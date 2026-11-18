const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const ts = require("typescript");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "secondlife-tests-"));
for (const name of ["data", "domain"]) {
  const src = fs.readFileSync(path.join(__dirname, "../src", name + ".ts"), "utf8");
  fs.writeFileSync(
    path.join(temp, name + ".js"),
    ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
}
const E = require(path.join(temp, "domain.js"));
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log("PASS " + name);
}
function transact(s, fn) {
  const next = structuredClone(s);
  const result = fn(next);
  Object.assign(s, next);
  return result;
}
test("multi-seller checkout reserves stock and preserves cart", () => {
  const s = E.initial();
  const before = s.cart.length;
  const os = E.checkout(s, "b1", ["c1", "c3"], "a1");
  assert.equal(os.length, 2);
  assert.equal(s.cart.length, before);
  assert.equal(s.products.find((p) => p.id === "p6").reserved, 1);
  assert.equal(s.products.find((p) => p.id === "p3").reserved, 2);
  assert(
    os.every((o) =>
      o.lines.every((l) => s.products.find((p) => p.id === l.productId).sellerId === o.sellerId),
    ),
  );
});
test("invalid line rolls back all seller orders and reservations", () => {
  const s = E.initial();
  s.cart.find((c) => c.id === "c3").qty = 99;
  const before = JSON.stringify(s);
  assert.throws(() => transact(s, (n) => E.checkout(n, "b1", ["c1", "c3"], "a1")));
  assert.equal(JSON.stringify(s), before);
});
test("payment, revised cart retention and duplicate payment protection", () => {
  const s = E.initial();
  const o = E.checkout(s, "b1", ["c1", "c2"], "a1")[0];
  s.cart.find((c) => c.id === "c1").revision = "changed";
  const result = E.pay(s, "b1", o.id, true);
  assert.equal(result.kept, 1);
  assert.equal(result.removed, 1);
  assert(s.cart.some((c) => c.id === "c1"));
  assert(!s.cart.some((c) => c.id === "c2"));
  assert.equal(s.products.find((p) => p.id === "p6").stock, 3);
  assert.equal(s.products.find((p) => p.id === "p6").reserved, 0);
  assert.throws(() => E.pay(s, "b1", o.id, true));
});
test("failed payment preserves reservation and permits retry", () => {
  const s = E.initial();
  const o = E.checkout(s, "b1", ["c1"], "a1")[0];
  assert.equal(E.pay(s, "b1", o.id, false).ok, false);
  assert.equal(s.products.find((p) => p.id === "p6").reserved, 1);
  assert.equal(E.pay(s, "b1", o.id, true).ok, true);
});
test("expiry releases inventory once and cancels unpaid order", () => {
  const s = E.initial();
  const o = E.checkout(s, "b1", ["c1"], "a1")[0];
  E.tick(s, o.payDeadline);
  assert.equal(o.status, "CANCELLED");
  assert.equal(o.cancelReason, "PAYMENT_TIMEOUT");
  assert.equal(s.products.find((p) => p.id === "p6").reserved, 0);
  const snapshot = JSON.stringify(s);
  E.tick(s, o.payDeadline + 1);
  assert.equal(JSON.stringify(s), snapshot);
  assert.throws(() => E.pay(s, "b1", o.id, true));
});
test("cancellation releases stock once", () => {
  const s = E.initial();
  const o = E.checkout(s, "b1", ["c1"], "a1")[0];
  E.cancel(s, "b1", o.id);
  assert.equal(s.products.find((p) => p.id === "p6").reserved, 0);
  assert.throws(() => E.cancel(s, "b1", o.id));
});
test("offer decisions enforce seller ownership and retain deadline", () => {
  const s = E.initial();
  const o = s.offers.find((o) => o.id === "o1");
  const end = o.expiresAt;
  assert.throws(() => E.decide(s, "b1", o.id, true));
  assert.throws(() => E.decide(s, "s1", o.id, true));
  E.decide(s, "s3", o.id, true);
  assert.equal(o.status, "ACCEPTED");
  assert.equal(o.expiresAt, end);
  assert.equal(s.products.find((p) => p.id === "p1").reserved, 0);
  assert.throws(() => E.decide(s, "s3", o.id, false));
});
test("redeemed offer cannot be reused, including after cancellation", () => {
  const s = E.initial();
  const o = E.checkout(s, "b1", ["c4"], "a1")[0];
  assert.equal(s.offers.find((o) => o.id === "o2").usedBy, o.id);
  E.cancel(s, "b1", o.id);
  assert.throws(() => E.checkout(s, "b1", ["c4"], "a1"));
});
test("shipping-to-receipt workflow uses distinct actors and saved deadline", () => {
  const s = E.initial();
  const now = Date.now();
  const o = E.checkout(s, "b1", ["c1"], "a1", now)[0];
  assert.throws(() => E.ship(s, "s1", o.id, "Demo", "TEST", now));
  E.pay(s, "b1", o.id, true, now + 10);
  assert.throws(() => E.ship(s, "b1", o.id, "Demo", "TEST", now + 20));
  E.ship(s, "s1", o.id, "Demo", "TEST", now + 20);
  const due = o.nextAdvanceAt;
  s.settings.cooldownSeconds = 10000;
  E.tick(s, due - 1);
  assert.equal(o.tracking, "SHIPPED");
  assert.throws(() => E.confirm(s, "b1", o.id, true, due));
  E.tick(s, due);
  assert.equal(o.tracking, "IN_TRANSIT");
  E.confirm(s, "b1", o.id, false, due + 1);
  assert.equal(o.status, "PAID");
  E.confirm(s, "b1", o.id, true, due + 2);
  assert.equal(o.status, "COMPLETED");
  assert.equal(o.tracking, "DELIVERED");
  assert.equal(s.events.filter((e) => e.orderId === o.id).length, 4);
  assert.throws(() => E.confirm(s, "b1", o.id, true, due + 3));
});
test("listing moderation and account suspension block new checkout", () => {
  const s = E.initial();
  E.moderate(s, "admin", "p6", false);
  assert.equal(E.available(s.products.find((p) => p.id === "p6")), 0);
  assert.throws(() => E.checkout(s, "b1", ["c1"], "a1"));
  E.accountStatus(s, "admin", "s1", "SUSPENDED");
  assert(s.products.filter((p) => p.sellerId === "s1").every((p) => !p.enabled));
  assert.throws(() => E.moderate(s, "admin", "p6", true));
  assert.throws(() => E.accountStatus(s, "b1", "s1", "ACTIVE"));
});
test("refund requires approval, valid amount and one-time execution", () => {
  const s = E.initial();
  const c = s.cases[0];
  const o = s.orders.find((o) => o.id === c.orderId);
  assert.throws(() => E.refund(s, "admin", o.id));
  assert.throws(() => E.resolve(s, "admin", c.id, "Checked", o.total + 1));
  E.resolve(s, "admin", c.id, "Partial refund approved", 20);
  assert(!o.refund.executedAt);
  assert.throws(() => E.refund(s, "b1", o.id));
  E.refund(s, "admin", o.id);
  assert(o.refund.executedAt);
  assert.throws(() => E.refund(s, "admin", o.id));
  assert(s.notices.some((n) => n.recipientId === "b1" && n.title === "Refund processed"));
});
test("initial reservations and completed order sellers are consistent", () => {
  const s = E.initial();
  for (const p of s.products) {
    const reserved = s.orders
      .filter((o) => o.status === "AWAITING_PAYMENT")
      .flatMap((o) => o.lines)
      .filter((l) => l.productId === p.id)
      .reduce((n, l) => n + l.qty, 0);
    assert.equal(p.reserved, reserved);
    assert(p.reserved <= p.stock);
  }
  for (const o of s.orders)
    assert(
      o.lines.every((l) => s.products.find((p) => p.id === l.productId).sellerId === o.sellerId),
    );
});
console.log(`${passed} workflow tests passed.`);
