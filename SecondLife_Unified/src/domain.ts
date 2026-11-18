import { PRODUCTS, SELLERS, CATEGORIES, seed } from "./data";
import type { Product, Order, Offer, CartLine, Address, Case, Review, Notice } from "./data";
export type Role = "BUYER" | "SELLER" | "ADMIN";
export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
};
export type Listing = Product & { enabled: boolean; reserved: number; modelId: string };
export type Line = CartLine & { buyerId: string; revision: string };
export type Deal = Offer & { buyerId: string; usedBy?: string };
export type Purchase = Order & {
  buyerId: string;
  revision: Record<string, string>;
  nextAdvanceAt?: number;
  receivedAt?: number;
  transitAt?: number;
  trackingNumber?: string;
  courier?: string;
  cancelReason?: string;
  paidAt?: number;
  refund?: { amount: number; reason: string; caseId: string; executedAt?: number };
};
export type Ticket = Case & {
  reporterId: string;
  resolution?: string;
  resolvedBy?: string;
  caseType: "ORDER_DISPUTE" | "USER_REPORT" | "PRODUCT_REPORT";
};
export type Feedback = Review & { reviewerId: string; removed?: boolean };
export type Event = {
  id: string;
  orderId: string;
  type: string;
  at: number;
  source: Role | "SYSTEM";
};
export type State = {
  version: 1;
  accounts: Account[];
  products: Listing[];
  cart: Line[];
  offers: Deal[];
  orders: Purchase[];
  cases: Ticket[];
  reviews: Feedback[];
  addresses: (Address & { userId: string })[];
  wishlist: { userId: string; productId: string; note: string }[];
  notices: (Notice & { recipientId: string })[];
  events: Event[];
  categories: string[];
  models: { id: string; name: string; category: string }[];
  settings: { paymentMinutes: number; offerHours: number; cooldownSeconds: number };
};
export const uid = (p: string) => p + "-" + crypto.randomUUID();
export const amount = (n: number) => Math.round(n * 100) / 100;
export const available = (p: Listing) => (p.enabled ? p.stock - p.reserved : 0);
export const productStatus = (p: Listing) =>
  !p.enabled ? "UNAVAILABLE" : p.stock === 0 ? "SOLD" : available(p) > 0 ? "AVAILABLE" : "RESERVED";
export function initial(): State {
  const x = seed();
  const now = Date.now();
  const accounts: Account[] = [
    {
      id: "b1",
      name: "Aisyah binti Rahman",
      email: "aisyah.rahman@example.my",
      phone: "+60 12-345 6789",
      role: "BUYER",
      status: "ACTIVE",
    },
    ...SELLERS.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.id + "@secondlife.test",
      phone: "+60 12-000 0000",
      role: "SELLER" as const,
      status: "ACTIVE" as const,
    })),
    {
      id: "admin",
      name: "Platform Administrator",
      email: "admin@secondlife.test",
      phone: "",
      role: "ADMIN",
      status: "ACTIVE",
    },
  ];
  const products = PRODUCTS.map((p) => ({
    ...p,
    enabled: true,
    reserved: 0,
    modelId: "m-" + p.id,
  }));
  const orders: Purchase[] = x.orders.map((o) => ({
    ...o,
    shipping: 0,
    total: o.subtotal,
    buyerId: "b1",
    revision: {},
    ...(o.status !== "AWAITING_PAYMENT" ? { paidAt: o.createdAt + 60000 } : {}),
    ...(o.tracking === "IN_TRANSIT"
      ? { nextAdvanceAt: (o.shippedAt ?? now) + 20000, transitAt: (o.shippedAt ?? now) + 20000 }
      : {}),
    ...(o.status === "COMPLETED"
      ? {
          receivedAt: (o.deliveredAt ?? now) + 60000,
          transitAt: (o.shippedAt ?? now) + 20000,
          nextAdvanceAt: (o.shippedAt ?? now) + 20000,
        }
      : {}),
  }));
  // The source seed combined different sellers in one historical order. Keep a single seller.
  const completed = orders.find((o) => o.status === "COMPLETED")!;
  completed.lines = completed.lines.filter(
    (l) => products.find((p) => p.id === l.productId)!.sellerId === completed.sellerId,
  );
  completed.subtotal = completed.total = completed.lines.reduce(
    (n, l) => n + l.qty * l.unitPrice,
    0,
  );
  for (const o of orders.filter((o) => o.status === "AWAITING_PAYMENT"))
    for (const l of o.lines) products.find((p) => p.id === l.productId)!.reserved += l.qty;
  const state: State = {
    version: 1,
    accounts,
    products,
    orders,
    cart: x.cart.map((l) => ({ ...l, buyerId: "b1", revision: uid("rev") })),
    offers: x.offers.map((o) => ({
      ...o,
      buyerId: "b1",
      ...(o.id === "o2" ? { proposed: 100 } : {}),
    })),
    cases: x.cases.map((c) => ({ ...c, reporterId: "b1", caseType: "ORDER_DISPUTE" })),
    reviews: [],
    addresses: x.addresses.map((a) => ({ ...a, userId: "b1" })),
    wishlist: [{ userId: "b1", productId: "p1", note: "" }],
    notices: x.notices.map((n) => ({ ...n, recipientId: "b1" })),
    events: [],
    categories: [...CATEGORIES],
    models: products.map((p) => ({ id: p.modelId, name: p.title, category: p.category })),
    settings: { paymentMinutes: 15, offerHours: 24, cooldownSeconds: 20 },
  };
  for (const o of orders) {
    if (o.shippedAt) event(state, o, "SHIPPED", o.shippedAt, "SELLER");
    if (o.transitAt) event(state, o, "IN_TRANSIT", o.transitAt, "SYSTEM");
    if (o.deliveredAt) event(state, o, "DELIVERED", o.deliveredAt, "BUYER");
    if (o.receivedAt) event(state, o, "RECEIPT_CONFIRMED", o.receivedAt, "BUYER");
  }
  return state;
}
export function notify(
  s: State,
  recipientId: string,
  title: string,
  body: string,
  at = Date.now(),
) {
  s.notices.unshift({ id: uid("notice"), recipientId, title, body, at, read: false });
}
function event(s: State, o: Purchase, type: string, at: number, source: Event["source"]) {
  if (!s.events.some((e) => e.orderId === o.id && e.type === type))
    s.events.push({ id: uid("event"), orderId: o.id, type, at, source });
}
function requireRole(s: State, actor: string, role: Role) {
  const a = s.accounts.find((a) => a.id === actor);
  if (!a || a.role !== role || a.status !== "ACTIVE")
    throw Error("This action requires an active " + role.toLowerCase() + " account.");
}
function ownedOrder(s: State, actor: string, id: string, role: "BUYER" | "SELLER") {
  requireRole(s, actor, role);
  const o = s.orders.find((o) => o.id === id);
  if (!o || o[role === "BUYER" ? "buyerId" : "sellerId"] !== actor)
    throw Error("Order access denied.");
  return o;
}
function release(s: State, o: Purchase) {
  for (const l of o.lines) s.products.find((p) => p.id === l.productId)!.reserved -= l.qty;
}
export function tick(s: State, now = Date.now()) {
  for (const o of s.orders) {
    if (o.status === "AWAITING_PAYMENT" && now >= o.payDeadline) {
      release(s, o);
      o.status = "CANCELLED";
      o.cancelReason = "PAYMENT_TIMEOUT";
      notify(s, o.buyerId, "Order expired", o.id, now);
    }
    if (o.status === "PAID" && o.tracking === "SHIPPED" && now >= (o.nextAdvanceAt ?? Infinity)) {
      o.tracking = "IN_TRANSIT";
      o.transitAt = now;
      event(s, o, "IN_TRANSIT", now, "SYSTEM");
      notify(s, o.buyerId, "Order in transit", o.id, now);
    }
  }
}
export function checkout(
  s: State,
  actor: string,
  lineIds: string[],
  addressId: string,
  now = Date.now(),
) {
  requireRole(s, actor, "BUYER");
  tick(s, now);
  if (!lineIds.length || new Set(lineIds).size !== lineIds.length)
    throw Error("Select active cart items.");
  const a = s.addresses.find((a) => a.id === addressId && a.userId === actor);
  if (!a) throw Error("Choose your delivery address.");
  const lines = lineIds.map((id) => {
    const l = s.cart.find((l) => l.id === id && l.buyerId === actor);
    if (!l || l.status !== "ACTIVE") throw Error("Cart changed. Review your selection.");
    const p = s.products.find((p) => p.id === l.productId)!;
    if (
      s.accounts.find((u) => u.id === p.sellerId)?.status !== "ACTIVE" ||
      !p.enabled ||
      !Number.isInteger(l.qty) ||
      l.qty < 1 ||
      available(p) < l.qty
    )
      throw Error(p.title + ": stock or listing availability changed.");
    const offer = l.offerId ? s.offers.find((o) => o.id === l.offerId) : undefined;
    if (
      l.offerId &&
      (!offer ||
        offer.buyerId !== actor ||
        offer.productId !== p.id ||
        offer.status !== "ACCEPTED" ||
        offer.expiresAt <= now ||
        offer.usedBy)
    )
      throw Error("This offer is expired or already redeemed.");
    const price = offer?.accepted ?? p.price;
    if (price !== l.unitPrice) throw Error(p.title + ": price changed. Refresh the cart price.");
    return l;
  });
  const made: Purchase[] = [];
  for (const sid of new Set(
    lines.map((l) => s.products.find((p) => p.id === l.productId)!.sellerId),
  )) {
    const ls = lines.filter((l) => s.products.find((p) => p.id === l.productId)!.sellerId === sid);
    const items = ls.map((l) => ({
      productId: l.productId,
      title: s.products.find((p) => p.id === l.productId)!.title,
      qty: l.qty,
      unitPrice: l.unitPrice,
      cartLineId: l.id,
      cartLineQty: l.qty,
    }));
    const total = amount(items.reduce((n, l) => n + l.qty * l.unitPrice, 0));
    const o: Purchase = {
      id: uid("SL"),
      buyerId: actor,
      sellerId: sid,
      lines: items,
      subtotal: total,
      shipping: 0,
      total,
      address: `${a.name}, ${a.phone}, ${a.line1}, ${a.line2}, ${a.postcode} ${a.city}, ${a.state}, Malaysia`,
      createdAt: now,
      payDeadline: now + s.settings.paymentMinutes * 60000,
      status: "AWAITING_PAYMENT",
      tracking: "PENDING",
      failedAttempts: 0,
      revision: Object.fromEntries(ls.map((l) => [l.id, l.revision])),
    };
    for (const l of ls) {
      s.products.find((p) => p.id === l.productId)!.reserved += l.qty;
      if (l.offerId) s.offers.find((f) => f.id === l.offerId)!.usedBy = o.id;
    }
    made.push(o);
    notify(s, sid, "New order", o.id, now);
  }
  s.orders.unshift(...made);
  return made;
}
export function pay(s: State, actor: string, id: string, success: boolean, now = Date.now()) {
  const o = ownedOrder(s, actor, id, "BUYER");
  if (o.status !== "AWAITING_PAYMENT" || now >= o.payDeadline)
    throw Error("This order can no longer be paid.");
  if (!success) {
    o.failedAttempts++;
    return {
      ok: false,
      removed: 0,
      kept: 0,
      reason: "Simulated payment declined. No money moved.",
    };
  }
  const remove = o.lines
    .filter((l) => s.cart.some((c) => c.id === l.cartLineId && c.revision === o.revision[c.id]))
    .map((l) => l.cartLineId);
  s.cart = s.cart.filter((c) => !remove.includes(c.id));
  for (const l of o.lines) {
    const p = s.products.find((p) => p.id === l.productId)!;
    p.stock -= l.qty;
    p.reserved -= l.qty;
  }
  o.status = "PAID";
  o.paidAt = now;
  notify(s, o.sellerId, "Payment received", o.id, now);
  notify(s, actor, "Payment succeeded", o.id, now);
  return { ok: true, removed: remove.length, kept: o.lines.length - remove.length };
}
export function cancel(s: State, actor: string, id: string) {
  const o = ownedOrder(s, actor, id, "BUYER");
  if (o.status !== "AWAITING_PAYMENT") throw Error("Only unpaid orders can be cancelled.");
  release(s, o);
  o.status = "CANCELLED";
  o.cancelReason = "BUYER_CANCELLED";
  notify(s, o.sellerId, "Order cancelled", o.id);
}
export function decide(s: State, actor: string, id: string, accept: boolean, now = Date.now()) {
  requireRole(s, actor, "SELLER");
  const o = s.offers.find((o) => o.id === id);
  if (!o || s.products.find((p) => p.id === o.productId)?.sellerId !== actor)
    throw Error("Offer access denied.");
  if (o.status !== "PENDING" || o.expiresAt <= now) throw Error("This offer is no longer pending.");
  o.status = accept ? "ACCEPTED" : "REJECTED";
  if (accept) o.accepted = o.proposed;
  notify(
    s,
    o.buyerId,
    accept ? "Offer accepted" : "Offer declined",
    s.products.find((p) => p.id === o.productId)!.title,
    now,
  );
}
export function ship(
  s: State,
  actor: string,
  id: string,
  courier: string,
  tracking: string,
  now = Date.now(),
) {
  const o = ownedOrder(s, actor, id, "SELLER");
  if (o.status !== "PAID" || o.tracking !== "PENDING")
    throw Error("Only paid, unshipped orders can be dispatched.");
  if (!courier.trim() || !tracking.trim() || courier.length > 100 || tracking.length > 100)
    throw Error("Enter valid courier and tracking details (up to 100 characters).");
  o.courier = courier.trim();
  o.trackingNumber = tracking.trim();
  o.tracking = "SHIPPED";
  o.shippedAt = now;
  o.nextAdvanceAt = now + s.settings.cooldownSeconds * 1000;
  event(s, o, "SHIPPED", now, "SELLER");
  notify(s, o.buyerId, "Order shipped", o.id, now);
}
export function confirm(s: State, actor: string, id: string, receipt: boolean, now = Date.now()) {
  const o = ownedOrder(s, actor, id, "BUYER");
  if (o.status !== "PAID" || o.tracking !== (receipt ? "DELIVERED" : "IN_TRANSIT"))
    throw Error("This delivery step is not available yet.");
  if (receipt) {
    o.receivedAt = now;
    o.status = "COMPLETED";
    event(s, o, "RECEIPT_CONFIRMED", now, "BUYER");
    notify(s, o.sellerId, "Order completed", o.id, now);
  } else {
    o.tracking = "DELIVERED";
    o.deliveredAt = now;
    event(s, o, "DELIVERED", now, "BUYER");
  }
}
export function moderate(s: State, actor: string, id: string, enabled: boolean) {
  requireRole(s, actor, "ADMIN");
  const p = s.products.find((p) => p.id === id);
  if (!p) throw Error("Listing not found.");
  if (enabled && s.accounts.find((a) => a.id === p.sellerId)?.status !== "ACTIVE")
    throw Error("Restore the seller account before enabling its listings.");
  p.enabled = enabled;
  notify(s, p.sellerId, enabled ? "Listing restored" : "Listing disabled", p.title);
}
export function accountStatus(s: State, actor: string, id: string, status: Account["status"]) {
  requireRole(s, actor, "ADMIN");
  const a = s.accounts.find((a) => a.id === id);
  if (!a || a.role === "ADMIN") throw Error("Administrator accounts cannot be changed here.");
  a.status = status;
  if (status !== "ACTIVE")
    s.products.filter((p) => p.sellerId === id).forEach((p) => (p.enabled = false));
  notify(s, id, "Account status changed", status);
}
export function resolve(s: State, actor: string, id: string, note: string, refund: number) {
  requireRole(s, actor, "ADMIN");
  const c = s.cases.find((c) => c.id === id);
  if (!c || !["OPEN", "IN_REVIEW"].includes(c.status)) throw Error("This case is closed.");
  if (!note.trim()) throw Error("Enter a resolution note.");
  if (!Number.isFinite(refund) || refund < 0) throw Error("Invalid refund amount.");
  if (refund) {
    const o = s.orders.find((o) => o.id === c.orderId);
    if (
      c.caseType !== "ORDER_DISPUTE" ||
      !o ||
      !["PAID", "COMPLETED"].includes(o.status) ||
      o.refund ||
      refund > o.total
    )
      throw Error("Refund requires a paid order dispute and an amount within the payment.");
    o.refund = { amount: amount(refund), reason: note.trim(), caseId: c.id };
  }
  c.status = "RESOLVED";
  c.resolution = note.trim();
  c.resolvedBy = actor;
  notify(s, c.reporterId, "Case resolved", note.trim());
}
export function refund(s: State, actor: string, id: string) {
  requireRole(s, actor, "ADMIN");
  const o = s.orders.find((o) => o.id === id);
  if (!o?.refund || o.refund.executedAt) throw Error("No pending authorised refund.");
  const c = s.cases.find((c) => c.id === o.refund!.caseId);
  if (c?.status !== "RESOLVED" || !c.resolvedBy) throw Error("Refund approval is missing.");
  o.refund.executedAt = Date.now();
  notify(s, o.buyerId, "Refund processed", "Simulated refund RM " + o.refund.amount.toFixed(2));
  notify(s, o.sellerId, "Refund processed", o.id);
}
