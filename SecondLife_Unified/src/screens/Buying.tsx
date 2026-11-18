import { useState } from "react";
import { SHIPPING_FEE, PAY_WINDOW_MIN, type CartLine } from "../data";
import { countdown, fmt, fmtDate, go, useStore, type Issue } from "../store";
import {
  Alert,
  Button,
  Card,
  Chip,
  Confirm,
  DataGate,
  Empty,
  Field,
  Icon,
  Img,
  Link,
  LinkButton,
  PageTitle,
  Stepper,
  Tabs,
  type Tone,
} from "../ui";
import { StockChip } from "./Catalog";

export function Cart() {
  const s = useStore();
  const [tab, setTab] = useState<"ACTIVE" | "SAVED_FOR_LATER">("ACTIVE");
  const [rm, setRm] = useState<CartLine | null>(null);
  const lines = s.cart.filter((l) => l.status === tab);
  const nA = s.cart.filter((l) => l.status === "ACTIVE").length,
    nS = s.cart.length - nA;
  const groups = [...new Set(lines.map((l) => s.product(l.productId).sellerId))];
  const sel = s.cart.filter((l) => l.status === "ACTIVE" && s.selected.includes(l.id));
  const selSellers = new Set(sel.map((l) => s.product(l.productId).sellerId));
  const sub = sel.reduce((t, l) => t + l.qty * s.linePrice(l), 0),
    ship = selSellers.size * SHIPPING_FEE;
  const toggle = (ids: string[], on: boolean) =>
    s.setSelected((x) => (on ? [...new Set([...x, ...ids])] : x.filter((y) => !ids.includes(y))));

  return (
    <div>
      <PageTitle title="Your cart" />
      <Tabs
        tabs={[
          { id: "ACTIVE", label: `Active (${nA})` },
          { id: "SAVED_FOR_LATER", label: `Saved for later (${nS})` },
        ]}
        value={tab}
        onChange={setTab}
      />
      <DataGate rows={3}>
        {lines.length === 0 ? (
          <Empty
            icon="cart"
            title={tab === "ACTIVE" ? "Your cart is empty" : "Nothing saved for later"}
            text={
              tab === "ACTIVE"
                ? "Add items you love and check out in one go."
                : 'Use "Save for later" on a cart item to park it here.'
            }
            action={<LinkButton to="/products">Browse items</LinkButton>}
          />
        ) : (
          <div className="grid items-start gap-6 @4xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {groups.map((sid) => {
                const gl = lines.filter((l) => s.product(l.productId).sellerId === sid),
                  sl = s.seller(sid);
                const ids = gl.filter((l) => s.product(l.productId).stock > 0).map((l) => l.id);
                return (
                  <Card key={sid}>
                    <div className="flex min-h-14 items-center gap-3 border-b border-slate-100 px-4">
                      {tab === "ACTIVE" && (
                        <input
                          type="checkbox"
                          aria-label={`Select all items from ${sl.name}`}
                          className="size-5 accent-emerald-700"
                          checked={ids.length > 0 && ids.every((i) => s.selected.includes(i))}
                          onChange={(e) => toggle(ids, e.target.checked)}
                        />
                      )}
                      <Icon n="home" className="size-5 text-emerald-700" />
                      <span className="font-semibold">{sl.name}</span>
                      <span className="hidden text-xs text-slate-600 @xl:inline">{sl.city}</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {gl.map((l) => (
                        <Row key={l.id} l={l} tab={tab} onRemove={() => setRm(l)} />
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
            {tab === "ACTIVE" && (
              <Card className="p-4 @4xl:sticky @4xl:top-20">
                <h2 className="font-semibold">Order summary</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>Selected items</dt>
                    <dd>{sel.reduce((t, l) => t + l.qty, 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{fmt(sub)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>
                      Delivery ({selSellers.size} seller{selSellers.size === 1 ? "" : "s"})
                    </dt>
                    <dd>{fmt(ship)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <dt>Total</dt>
                    <dd>{fmt(sub + ship)}</dd>
                  </div>
                </dl>
                {selSellers.size > 1 && (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">
                    You'll get {selSellers.size} separate orders, one per seller. Each is paid on
                    its own.
                  </p>
                )}
                <Button
                  className="mt-4 w-full"
                  disabled={sel.length === 0}
                  onClick={() => go("/checkout")}
                >
                  Checkout ({sel.length})
                </Button>
                {sel.length === 0 && (
                  <p className="mt-2 text-center text-xs text-slate-600">
                    Select at least one available item.
                  </p>
                )}
              </Card>
            )}
          </div>
        )}
      </DataGate>
      {rm && (
        <Confirm
          title="Remove from cart?"
          text={s.product(rm.productId).title}
          confirm="Remove"
          cancel="Cancel"
          onConfirm={() => {
            s.removeLine(rm.id);
            s.toast("Item removed", "info");
          }}
          onClose={() => setRm(null)}
        />
      )}
    </div>
  );
}

function Row({ l, tab, onRemove }: { l: CartLine; tab: string; onRemove: () => void }) {
  const s = useStore();
  const p = s.product(l.productId),
    out = p.stock <= 0,
    price = s.linePrice(l);
  const over = !out && l.qty > p.stock;
  return (
    <li className="p-4">
      <div className="flex gap-3">
        {tab === "ACTIVE" && (
          <input
            type="checkbox"
            aria-label={`Select ${p.title}`}
            disabled={out}
            className="mt-1 size-5 shrink-0 accent-emerald-700"
            checked={s.selected.includes(l.id)}
            onChange={(e) =>
              s.setSelected((x) => (e.target.checked ? [...x, l.id] : x.filter((y) => y !== l.id)))
            }
          />
        )}
        <Link to={`/product/${p.id}`} className="shrink-0">
          <Img
            p={p}
            label={false}
            className={`size-20 rounded-lg ${out ? "opacity-60 grayscale" : ""}`}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/product/${p.id}`}
            className="line-clamp-2 text-sm font-semibold hover:underline"
          >
            {p.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-emerald-800">{fmt(price)}</span>
            {l.offerId && <Chip tone="green">Offer price</Chip>}
            {(out || p.stock <= 2) && <StockChip p={p} />}
          </div>
          {price !== l.unitPrice && !out && (
            <p className="mt-1 text-xs font-medium text-amber-800">
              Price changed since you added this ({fmt(l.unitPrice)}).{" "}
              <button
                onClick={() => s.refreshPrice(l.id)}
                className="inline-flex min-h-11 items-center font-semibold underline"
              >
                Accept new price
              </button>
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
        {l.offerId ? (
          <span className="text-sm text-slate-700">Qty 1 (offer price)</span>
        ) : (
          <Stepper
            value={l.qty}
            max={Math.max(p.stock, 1)}
            onChange={(n) => s.setQty(l.id, n)}
            disabled={out}
          />
        )}
        {tab === "ACTIVE" ? (
          <Button v="ghost" onClick={() => s.moveLine(l.id, "SAVED_FOR_LATER")}>
            Save for later
          </Button>
        ) : (
          <Button v="ghost" disabled={out} onClick={() => s.moveLine(l.id, "ACTIVE")}>
            Move to cart
          </Button>
        )}
        <Button v="ghost" className="text-red-700" onClick={onRemove}>
          Remove
        </Button>
      </div>
      {over && (
        <p className="mt-2 pl-8 text-sm font-medium text-red-700">
          Only {p.stock} available. Reduce the quantity to continue.
        </p>
      )}
      {out && (
        <p className="mt-2 pl-8 text-sm font-medium text-red-700">
          Out of stock. Save it or remove it.
        </p>
      )}
    </li>
  );
}

export function Checkout() {
  const s = useStore();
  const lines = s.cart.filter((l) => s.selected.includes(l.id));
  const [addr, setAddr] = useState(
    s.addresses.find((a) => a.isDefault)?.id ?? s.addresses[0]?.id ?? "",
  );
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const sellers = [...new Set(lines.map((l) => s.product(l.productId).sellerId))];
  const total = lines.reduce((t, l) => t + l.qty * l.unitPrice, 0) + sellers.length * SHIPPING_FEE;

  if (!lines.length)
    return (
      <Empty
        icon="cart"
        title="Nothing to check out"
        text="Select items in your cart first."
        action={<LinkButton to="/cart">Go to cart</LinkButton>}
      />
    );

  function place() {
    setBusy(true);
    setIssues(null);
    setTimeout(() => {
      const r = s.placeOrders(
        lines.map((l) => l.id),
        addr,
      );
      setBusy(false);
      if (r.ok) {
        s.toast(
          `${r.orders.length} order${r.orders.length > 1 ? "s" : ""} created. Pay each within ${s.data.settings.paymentMinutes} minutes.`,
        );
        go("/orders");
      } else setIssues(r.issues);
    }, 700);
  }
  return (
    <div>
      <PageTitle title="Checkout" sub="Review your items and choose a delivery address." />
      <div className="grid items-start gap-6 @4xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {issues && (
            <Alert
              tone="error"
              title={`Order not placed. Nothing was created or charged.`}
              action={
                <LinkButton to="/cart" v="secondary">
                  Review my cart
                </LinkButton>
              }
            >
              All {sellers.length} order{sellers.length > 1 ? "s were" : " was"} cancelled together,
              so you won't end up with a partial purchase. What needs fixing:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues.map((i) => (
                  <li key={i.lineId}>
                    <strong>{i.title}</strong> {i.reason}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <Card className="p-4">
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            <div role="radiogroup" aria-label="Delivery address" className="space-y-2">
              {s.addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${addr === a.id ? "border-emerald-700 bg-emerald-50" : "border-slate-200"}`}
                >
                  <input
                    type="radio"
                    name="addr"
                    className="mt-0.5 size-5 accent-emerald-700"
                    checked={addr === a.id}
                    onChange={() => setAddr(a.id)}
                  />
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      {a.label}
                      {a.isDefault && <Chip tone="green">Default</Chip>}
                    </span>
                    {a.line1}, {a.line2}, {a.postcode} {a.city}
                  </span>
                </label>
              ))}
            </div>
            <Link
              to="/profile"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800"
            >
              Manage addresses
            </Link>
          </Card>
          {sellers.map((sid) => (
            <Card key={sid}>
              <div className="flex min-h-12 items-center justify-between border-b border-slate-100 px-4">
                <span className="font-semibold">{s.seller(sid).name}</span>
                <Chip>Separate order</Chip>
              </div>
              <ul className="divide-y divide-slate-100">
                {lines
                  .filter((l) => s.product(l.productId).sellerId === sid)
                  .map((l) => (
                    <li key={l.id} className="flex items-center gap-3 p-4 text-sm">
                      <Img
                        p={s.product(l.productId)}
                        label={false}
                        className="size-14 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium">{s.product(l.productId).title}</p>
                        <p className="text-slate-600">
                          Qty {l.qty}
                          {l.offerId && " · Offer price"}
                        </p>
                      </div>
                      <span className="font-semibold">{fmt(l.qty * l.unitPrice)}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
          <Card className="border-dashed p-4">
            <p className="text-sm font-semibold">Shared inventory validation</p>
            <p className="mt-1 text-sm text-slate-600">
              Prices, stock and cart revisions are checked together when you place orders. Changes
              made in the seller workplace are reflected here.
            </p>
          </Card>
        </div>
        <Card className="p-4 @4xl:sticky @4xl:top-20">
          <h2 className="font-semibold">Payment summary</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Items</dt>
              <dd>{fmt(lines.reduce((t, l) => t + l.qty * l.unitPrice, 0))}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{fmt(sellers.length * SHIPPING_FEE)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{fmt(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex gap-2 text-sm text-slate-700">
            <Icon n="clock" className="mt-0.5 size-4 shrink-0" />
            You'll have {s.data.settings.paymentMinutes} minutes to pay each order. Items stay in
            your cart until payment goes through.
          </p>
          <Button className="mt-4 w-full" disabled={busy || !addr} onClick={place}>
            {busy
              ? "Placing orders..."
              : `Place ${sellers.length} order${sellers.length > 1 ? "s" : ""}`}
          </Button>
          <p className="mt-2 text-center text-xs text-slate-600">
            Payment is on the next step. It's a simulation for this prototype.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function Pay({ id }: { id: string }) {
  const s = useStore();
  const o = s.orders.find((x) => x.id === id);
  const [method, setMethod] = useState("fpx");
  const [res, setRes] = useState<{
    ok: boolean;
    removed: number;
    kept: number;
    reason?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!o)
    return (
      <Empty
        title="Order not found"
        text="Check your order list."
        action={<LinkButton to="/orders">My orders</LinkButton>}
      />
    );
  const st = s.orderStatus(o),
    left = o.payDeadline - s.now;
  const run = (ok: boolean) => {
    setBusy(true);
    setTimeout(() => {
      setRes(s.payOrder(id, ok));
      setBusy(false);
    }, 900);
  };
  if (res?.ok || st === "PAID" || st === "COMPLETED")
    return (
      <Card className="mx-auto max-w-lg p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <Icon n="check" className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Payment received</h1>
        <p className="mt-1 text-slate-600">
          {fmt(o.total)} paid for order {o.id}. The seller will ship it soon.
        </p>
        {res && (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {res.removed} purchased item{res.removed === 1 ? "" : "s"} removed from your cart.
            {res.kept > 0 &&
              ` ${res.kept} item${res.kept === 1 ? " was" : "s were"} kept because you changed ${res.kept === 1 ? "it" : "them"} after checkout.`}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-600">Simulated payment. No real money moved.</p>
        <div className="mt-5 flex flex-col gap-2 @xl:flex-row @xl:justify-center">
          <LinkButton to={`/order/${o.id}`}>View order</LinkButton>
          <LinkButton to="/orders" v="secondary">
            All orders
          </LinkButton>
        </div>
      </Card>
    );
  return (
    <div className="mx-auto max-w-lg">
      <PageTitle title="Pay for your order" sub={`${o.id} · ${s.seller(o.sellerId).name}`} />
      <div className="space-y-4">
        <Alert tone="info" title="Simulated payment">
          This is a prototype. Choose an outcome below to see how payment behaves. No real charge is
          made.
        </Alert>
        {st === "EXPIRED" && (
          <Alert tone="error" title="Payment time has run out">
            This order expired on {fmtDate(o.payDeadline)}. Add the items to your cart again to buy
            them.
          </Alert>
        )}
        {st === "CANCELLED" && (
          <Alert tone="error" title="This order was cancelled">
            There is nothing to pay.
          </Alert>
        )}
        {res && !res.ok && (
          <Alert tone="error" title="Payment failed">
            {res.reason} You can try again
            {st === "AWAITING_PAYMENT" ? ` for the next ${countdown(left)}` : ""}.
          </Alert>
        )}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Amount due</span>
            <span className="text-2xl font-extrabold text-emerald-800">{fmt(o.total)}</span>
          </div>
          {st === "AWAITING_PAYMENT" && (
            <p
              className={`mt-2 flex items-center gap-2 text-sm font-medium ${left < 5 * 60_000 ? "text-red-700" : "text-slate-700"}`}
            >
              <Icon n="clock" className="size-4" />
              Pay within {countdown(left)} (by {fmtDate(o.payDeadline)})
            </p>
          )}
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">Payment method</legend>
            {[
              ["fpx", "Online banking (FPX)"],
              ["card", "Credit / debit card"],
              ["ewallet", "E-wallet"],
            ].map(([v, l]) => (
              <label key={v} className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="m"
                  className="size-5 accent-emerald-700"
                  checked={method === v}
                  onChange={() => setMethod(v)}
                />
                {l}
              </label>
            ))}
          </fieldset>
        </Card>
        <div className="flex flex-col gap-2">
          <Button disabled={st !== "AWAITING_PAYMENT" || busy} onClick={() => run(true)}>
            {busy ? "Processing..." : `Pay ${fmt(o.total)}`}
          </Button>
          <Button
            v="secondary"
            disabled={st !== "AWAITING_PAYMENT" || busy}
            onClick={() => run(false)}
          >
            Prototype: simulate failed payment
          </Button>
          <LinkButton to={`/order/${o.id}`} v="ghost">
            Back to order
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- Offers ---------- */
export const offerTone: Record<string, Tone> = {
  PENDING: "amber",
  ACCEPTED: "green",
  REJECTED: "red",
  WITHDRAWN: "gray",
  EXPIRED: "red",
};
export const offerLabel: Record<string, string> = {
  PENDING: "Waiting for seller",
  ACCEPTED: "Accepted",
  REJECTED: "Declined",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Offer expired",
};

export function OfferForm({ pid }: { pid: string }) {
  const s = useStore();
  const p = s.product(pid);
  const [v, setV] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const min = Math.ceil((p.price * p.minOfferPct) / 100),
    n = Number(v);
  const err = !v
    ? "Enter your offer in RM."
    : isNaN(n) || n <= 0
      ? "Enter a valid amount."
      : n < min
        ? `Too low. This seller accepts offers from ${fmt(min)}.`
        : n >= p.price
          ? `Your offer should be below the listed price of ${fmt(p.price)}. You can buy it at the listed price instead.`
          : note.length > 200
            ? "Message can be up to 200 characters."
            : "";
  return (
    <div className="mx-auto max-w-lg">
      <Link
        to={`/product/${p.id}`}
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-800"
      >
        <Icon n="chevL" className="size-4" />
        Back to item
      </Link>
      <PageTitle title="Make an offer" />
      <Card className="p-4">
        <div className="flex gap-3">
          <Img p={p} label={false} className="size-20 rounded-lg" />
          <div>
            <p className="font-semibold">{p.title}</p>
            <p className="text-emerald-800 font-bold">{fmt(p.price)}</p>
            <StockChip p={p} />
          </div>
        </div>
        <form
          className="mt-5 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!err) {
              s.createOffer(pid, n, note);
              go("/offers");
            }
          }}
        >
          <Field
            label="Your offer (RM)"
            error={touched || v ? err || undefined : undefined}
            hint={`Minimum ${fmt(min)} · Listed at ${fmt(p.price)}`}
          >
            {(a) => (
              <input
                {...a}
                inputMode="decimal"
                value={v}
                onChange={(e) => setV(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={String(min)}
              />
            )}
          </Field>
          <Field label="Message to seller (optional)">
            {(a) => (
              <textarea
                {...a}
                rows={3}
                className={a.className + " py-2"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Can meet at LRT Bangsar?"
              />
            )}
          </Field>
          <Alert tone="info" title="How offers work">
            The seller has 24 hours to respond. If they accept, you'll see the agreed price and its
            expiry. Accepting an offer does not reserve the item, so check out before it sells out.
          </Alert>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={p.stock <= 0}>
              Send offer
            </Button>
            <LinkButton to={`/product/${p.id}`} v="secondary">
              Cancel
            </LinkButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function Offers() {
  const s = useStore();
  const [w, setW] = useState<string | null>(null);
  return (
    <div>
      <PageTitle
        title="My offers"
        sub="Accepted offers don't hold the item. Stock can run out before you check out."
      />
      <DataGate rows={3}>
        {s.offers.length === 0 ? (
          <Empty
            icon="tag"
            title="No offers yet"
            text="Open an item and tap Make an offer to negotiate."
            action={<LinkButton to="/products">Browse items</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-2">
            {s.offers.map((o) => {
              const st = s.offerStatus(o),
                p = s.product(o.productId),
                live = st === "PENDING" || st === "ACCEPTED",
                inCart = s.cart.some((l) => l.offerId === o.id);
              return (
                <Card key={o.id} className="p-4">
                  <div className="flex gap-3">
                    <Img p={p} label={false} className="size-20 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${p.id}`}
                        className="line-clamp-2 font-semibold hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip tone={offerTone[st]}>{offerLabel[st]}</Chip>
                        {p.stock <= 0 && <Chip tone="red">Out of stock</Chip>}
                      </div>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-slate-600">Listed</dt>
                      <dd className="font-medium">{fmt(p.price)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-600">Proposed</dt>
                      <dd className="font-medium">{fmt(o.proposed)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-600">Accepted</dt>
                      <dd className="font-bold text-emerald-800">
                        {o.accepted ? fmt(o.accepted) : "—"}
                      </dd>
                    </div>
                  </dl>
                  <p
                    className={`mt-3 flex items-center gap-2 text-sm ${st === "EXPIRED" ? "font-medium text-red-700" : live ? "text-slate-700" : "text-slate-600"}`}
                  >
                    <Icon n="clock" className="size-4" />
                    {st === "EXPIRED"
                      ? `Expired ${fmtDate(o.expiresAt)}`
                      : live
                        ? `Expires in ${countdown(o.expiresAt - s.now)} (${fmtDate(o.expiresAt)})`
                        : "No longer active"}
                  </p>
                  {st === "ACCEPTED" && (
                    <p className="mt-2 text-sm text-slate-700">
                      This price is not reserved. Add it to your cart soon.
                    </p>
                  )}
                  {st === "EXPIRED" && (
                    <p className="mt-2 text-sm text-slate-700">
                      The offer price no longer applies. You can make a new offer.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {st === "ACCEPTED" &&
                      (inCart ? (
                        <LinkButton to="/cart" v="secondary">
                          In your cart
                        </LinkButton>
                      ) : (
                        <Button disabled={p.stock <= 0} onClick={() => s.addToCart(p.id, 1, o.id)}>
                          {p.stock <= 0 ? "Out of stock" : `Add to cart at ${fmt(o.accepted!)}`}
                        </Button>
                      ))}
                    {live && (
                      <Button v="secondary" onClick={() => setW(o.id)}>
                        Withdraw offer
                      </Button>
                    )}
                    {(st === "EXPIRED" || st === "REJECTED" || st === "WITHDRAWN") && (
                      <LinkButton to={`/offer/new/${p.id}`} v="secondary">
                        Make a new offer
                      </LinkButton>
                    )}
                    {st === "PENDING" && (
                      <p className="text-xs text-slate-600">
                        Waiting for a response in the seller workplace.
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DataGate>
      {w && (
        <Confirm
          title="Withdraw this offer?"
          text="The seller will be told you withdrew it. You can make a new offer later."
          confirm="Withdraw offer"
          cancel="Keep offer"
          onConfirm={() => s.withdrawOffer(w)}
          onClose={() => setW(null)}
        />
      )}
    </div>
  );
}
