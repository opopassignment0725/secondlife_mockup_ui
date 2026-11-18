import { useState } from "react";
import { SHIP_COOLDOWN_SEC, type Order, type Tracking } from "../data";
import { countdown, fmt, fmtDate, useStore } from "../store";
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
  Stars,
  Tabs,
  type Tone,
} from "../ui";

const stTone: Record<string, Tone> = {
  AWAITING_PAYMENT: "amber",
  PAID: "blue",
  COMPLETED: "green",
  CANCELLED: "gray",
  EXPIRED: "red",
};
const stLabel: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Payment expired",
};
const trLabel: Record<Tracking, string> = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
};
const STEPS: Tracking[] = ["PENDING", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

export function Orders() {
  const s = useStore();
  const [f, setF] = useState<"all" | "unpaid" | "progress" | "done">("all");
  const list = s.orders.filter((o) => {
    const st = s.orderStatus(o);
    return (
      f === "all" ||
      (f === "unpaid" && st === "AWAITING_PAYMENT") ||
      (f === "progress" && st === "PAID") ||
      (f === "done" && ["COMPLETED", "CANCELLED", "EXPIRED"].includes(st))
    );
  });
  return (
    <div>
      <PageTitle
        title="My orders"
        sub="Each seller's items are a separate order that you pay independently."
      />
      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "unpaid", label: "To pay" },
          { id: "progress", label: "In progress" },
          { id: "done", label: "Finished" },
        ]}
        value={f}
        onChange={setF}
      />
      <DataGate rows={3}>
        {list.length === 0 ? (
          <Empty
            title="No orders here"
            text="When you place an order it will show up in this list."
            action={<LinkButton to="/products">Start shopping</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-2">
            {list.map((o) => {
              const st = s.orderStatus(o);
              return (
                <Card key={o.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{s.seller(o.sellerId).name}</p>
                      <p className="text-xs text-slate-600">
                        {o.id} · {fmtDate(o.createdAt)}
                      </p>
                    </div>
                    <Chip tone={stTone[st]}>{stLabel[st]}</Chip>
                  </div>
                  <div className="mt-3 flex -space-x-2">
                    {o.lines.map((l) => (
                      <Img
                        key={l.productId}
                        p={s.product(l.productId)}
                        label={false}
                        className="size-12 rounded-lg ring-2 ring-white"
                      />
                    ))}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm text-slate-700">
                    {o.lines.map((l) => `${l.title} ×${l.qty}`).join(", ")}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-emerald-800">{fmt(o.total)}</span>
                    {st === "PAID" && <Chip tone="blue">{trLabel[o.tracking]}</Chip>}
                    {st === "COMPLETED" && <Chip tone="green">Delivered</Chip>}
                  </div>
                  {st === "AWAITING_PAYMENT" && (
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                      <Icon n="clock" className="size-4" />
                      Pay within {countdown(o.payDeadline - s.now)}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {st === "AWAITING_PAYMENT" && (
                      <LinkButton to={`/pay/${o.id}`}>Pay now</LinkButton>
                    )}
                    <LinkButton to={`/order/${o.id}`} v="secondary">
                      {st === "PAID" ? "Track order" : "View details"}
                    </LinkButton>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DataGate>
    </div>
  );
}

function Timeline({ o }: { o: Order }) {
  const s = useStore();
  const idx = STEPS.indexOf(o.tracking);
  const cd =
    o.tracking === "SHIPPED"
      ? Math.max(0, (s.data.orders.find((x) => x.id === o.id)?.nextAdvanceAt ?? 0) - s.now)
      : 0;
  const hint: Record<Tracking, string> = {
    PENDING: "Waiting for the seller to ship.",
    SHIPPED: `Handed to the courier. Moves to in transit automatically in ${countdown(cd)}.`,
    IN_TRANSIT: "On its way to you.",
    DELIVERED: "Delivered to your address.",
  };
  return (
    <ol className="space-y-0">
      {STEPS.map((t, i) => (
        <li key={t} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${i <= idx ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}
            >
              {i < idx ? <Icon n="check" className="size-4" /> : i + 1}
            </span>
            {i < 3 && (
              <span className={`h-8 w-0.5 ${i < idx ? "bg-emerald-700" : "bg-slate-200"}`} />
            )}
          </div>
          <div className="pb-4">
            <p
              className={`text-sm font-semibold ${i === idx ? "text-emerald-800" : i < idx ? "" : "text-slate-600"}`}
            >
              {trLabel[t]}
              {i === idx && " (current)"}
            </p>
            {i === idx && <p className="text-sm text-slate-700">{hint[t]}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const s = useStore();
  const o = s.orders.find((x) => x.id === id);
  const [cancel, setCancel] = useState(false);
  const [blocked, setBlocked] = useState("");
  if (!o)
    return (
      <Empty
        title="Order not found"
        text="It may belong to a different account."
        action={<LinkButton to="/orders">My orders</LinkButton>}
      />
    );
  const st = s.orderStatus(o),
    paid = st === "PAID",
    done = st === "COMPLETED";
  const canDeliver = paid && o.tracking === "IN_TRANSIT",
    canReceive = paid && o.tracking === "DELIVERED";
  const tryDeliver = () =>
    canDeliver
      ? (setBlocked(""), s.confirmDelivery(o.id))
      : setBlocked(
          o.tracking === "DELIVERED"
            ? "Delivery is already confirmed. Next, confirm that you received the item."
            : "You can confirm delivery once your parcel is in transit. It is currently " +
                trLabel[o.tracking].toLowerCase() +
                ".",
        );
  const tryReceive = () =>
    canReceive
      ? (setBlocked(""), s.confirmReceipt(o.id))
      : setBlocked(
          "Confirm receipt only after the order shows as delivered. Please confirm delivery first.",
        );
  return (
    <div>
      <Link
        to="/orders"
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-800"
      >
        <Icon n="chevL" className="size-4" />
        My orders
      </Link>
      <PageTitle
        title={`Order ${o.id}`}
        sub={`${s.seller(o.sellerId).name} · placed ${fmtDate(o.createdAt)}`}
        action={<Chip tone={stTone[st]}>{stLabel[st]}</Chip>}
      />
      <div className="grid items-start gap-6 @3xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {st === "AWAITING_PAYMENT" && (
            <Alert
              tone="warn"
              title={`Pay within ${countdown(o.payDeadline - s.now)}`}
              action={
                <div className="flex flex-wrap gap-2">
                  <LinkButton to={`/pay/${o.id}`}>Pay {fmt(o.total)}</LinkButton>
                  <Button v="secondary" onClick={() => setCancel(true)}>
                    Cancel order
                  </Button>
                </div>
              }
            >
              Deadline {fmtDate(o.payDeadline)}.{" "}
              {o.failedAttempts > 0
                ? `Your last payment attempt failed (${o.failedAttempts}). You were not charged.`
                : "Unpaid orders can be cancelled until the deadline."}
            </Alert>
          )}
          {st === "EXPIRED" && (
            <Alert tone="error" title="Payment expired">
              The deadline of {fmtDate(o.payDeadline)} passed, so this order was closed. You were
              not charged. Add the items to your cart again to buy them.
            </Alert>
          )}
          {o.refund && (
            <Alert title={o.refund.executedAt ? "Refund processed" : "Refund authorised"}>
              {fmt(o.refund.amount)}: {o.refund.reason}
            </Alert>
          )}
          {st === "CANCELLED" && (
            <Alert tone="info" title="Order cancelled">
              This order was cancelled before payment.
            </Alert>
          )}
          <Card>
            <ul className="divide-y divide-slate-100">
              {o.lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 p-4 text-sm">
                  <Img p={s.product(l.productId)} label={false} className="size-16 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${l.productId}`}
                      className="line-clamp-2 font-semibold hover:underline"
                    >
                      {l.title}
                    </Link>
                    <p className="text-slate-600">
                      {fmt(l.unitPrice)} × {l.qty}
                    </p>
                  </div>
                  <span className="font-semibold">{fmt(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-slate-200 p-4 text-sm">
              <div className="flex justify-between">
                <dt>Items</dt>
                <dd>{fmt(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{fmt(o.shipping)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{fmt(o.total)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="mb-1 font-semibold">Delivery address</h2>
            <p className="text-slate-700">{o.address}</p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Icon n="truck" className="size-5 text-emerald-700" />
                Tracking
              </h2>
              <Chip>Internal demo tracking</Chip>
            </div>
            {paid || done ? (
              <>
                <Timeline o={o} />
                <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  Shipment deadlines are saved when the seller dispatches. Only the move to in
                  transit is automatic. You confirm delivery and receipt yourself.
                </p>
                {paid && o.tracking === "PENDING" && (
                  <p className="mb-3 text-sm text-slate-600">
                    Waiting for the seller to register shipment.
                  </p>
                )}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    aria-disabled={!canDeliver}
                    onClick={tryDeliver}
                    style={!canDeliver ? { background: "#e2e8f0", color: "#475569" } : undefined}
                  >
                    Confirm Delivery
                  </Button>
                  <Button
                    className="w-full"
                    aria-disabled={!canReceive}
                    onClick={tryReceive}
                    style={!canReceive ? { background: "#e2e8f0", color: "#475569" } : undefined}
                  >
                    Confirm Receipt
                  </Button>
                </div>
                {blocked && (
                  <div className="mt-3">
                    <Alert tone="warn" title="Not yet">
                      {blocked}
                    </Alert>
                  </div>
                )}
                {done && (
                  <div className="mt-3">
                    <Alert tone="success" title="Order completed">
                      You confirmed receipt. Tracking stays at Delivered.
                    </Alert>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-700">Tracking starts once this order is paid.</p>
            )}
          </Card>
          {done && (
            <Card className="p-4">
              <h2 className="font-semibold">How was it?</h2>
              <p className="mb-3 text-sm text-slate-600">Rate your items to help other buyers.</p>
              <div className="flex flex-wrap gap-2">
                <LinkButton to="/reviews">Rate items</LinkButton>
                <LinkButton to="/cases" v="secondary">
                  Report a problem
                </LinkButton>
              </div>
            </Card>
          )}
          {(paid || done) && !done && (
            <LinkButton to="/cases" v="ghost" className="w-full">
              Something wrong? Open a case
            </LinkButton>
          )}
        </div>
      </div>
      {cancel && (
        <Confirm
          title="Cancel this order?"
          text="You haven't paid yet, so nothing will be charged. Items stay in your cart."
          confirm="Cancel order"
          cancel="Keep order"
          onConfirm={() => s.cancelOrder(o.id)}
          onClose={() => setCancel(false)}
        />
      )}
    </div>
  );
}

export function Reviews() {
  const s = useStore();
  const [rm, setRm] = useState<{ o: string; p: string } | null>(null);
  const done = s.orders.filter((o) => o.status === "COMPLETED");
  return (
    <div>
      <PageTitle title="My ratings" sub="One participant review per completed order." />
      <DataGate rows={2}>
        {done.length === 0 ? (
          <Empty
            icon="star"
            title="Nothing to rate yet"
            text="Rating opens after you confirm receipt of an order."
            action={<LinkButton to="/orders">View orders</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-2">
            {done.map((o) => (
              <RateCard
                key={o.id}
                o={o}
                pid={o.lines[0].productId}
                onRemove={() => setRm({ o: o.id, p: o.lines[0].productId })}
              />
            ))}
          </div>
        )}
      </DataGate>
      {rm && (
        <Confirm
          title="Remove your rating?"
          text="Your rating and comment will be deleted. You can rate again any time."
          confirm="Remove rating"
          cancel="Keep rating"
          onConfirm={() => s.removeReview(rm.o, rm.p)}
          onClose={() => setRm(null)}
        />
      )}
    </div>
  );
}
function RateCard({ o, pid, onRemove }: { o: Order; pid: string; onRemove: () => void }) {
  const s = useStore();
  const p = s.product(pid);
  const cur = s.reviews.find((r) => r.orderId === o.id && r.productId === pid);
  const [editing, setEditing] = useState(false);
  const [r, setR] = useState(cur?.rating ?? 0);
  const [t, setT] = useState(cur?.text ?? "");
  const [err, setErr] = useState("");
  const open = editing || !cur;
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Img p={p} label={false} className="size-16 shrink-0 rounded-lg" />
        <div>
          <p className="font-semibold">{p.title}</p>
          <p className="text-xs text-slate-600">Order {o.id}</p>
        </div>
      </div>
      {!open ? (
        <div className="mt-3">
          <Stars value={cur!.rating} size="size-5" />
          <p className="mt-1 text-sm text-slate-700">{cur!.text || "No comment"}</p>
          <div className="mt-3 flex gap-2">
            <Button v="secondary" onClick={() => setEditing(true)}>
              Edit rating
            </Button>
            <Button v="ghost" className="text-red-700" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!r) return setErr("Choose a rating from 1 to 5 stars.");
            setErr("");
            s.saveReview(o.id, pid, r, t.trim());
            setEditing(false);
          }}
        >
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Your rating</legend>
            <div className="flex" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  role="radio"
                  aria-checked={r === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setR(n)}
                  className={`flex size-11 items-center justify-center ${n <= r ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
                >
                  <Icon n="star" className="size-8" fill />
                </button>
              ))}
            </div>
            {err && <p className="text-sm font-medium text-red-700">{err}</p>}
          </fieldset>
          <Field
            label="Comment (optional)"
            error={t.length > 300 ? "Comments can be up to 300 characters." : undefined}
          >
            {(a) => (
              <textarea
                {...a}
                rows={3}
                className={a.className + " py-2"}
                value={t}
                onChange={(e) => setT(e.target.value)}
                placeholder="Item matched the photos, seller was quick to reply."
              />
            )}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={t.length > 300}>
              {cur ? "Save changes" : "Submit rating"}
            </Button>
            {cur && (
              <Button
                v="secondary"
                onClick={() => {
                  setEditing(false);
                  setR(cur.rating);
                  setT(cur.text);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}

const caseTone: Record<string, Tone> = {
  OPEN: "amber",
  IN_REVIEW: "blue",
  RESOLVED: "green",
  WITHDRAWN: "gray",
};
const caseLabel: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "Under review",
  RESOLVED: "Resolved",
  WITHDRAWN: "Withdrawn",
};
export function Cases() {
  const s = useStore();
  const [showForm, setShow] = useState(false);
  const [w, setW] = useState<string | null>(null);
  const [f, setF] = useState({
    seller: "",
    order: "",
    product: "",
    type: "Item not received",
    details: "",
  });
  const [e, setE] = useState<Record<string, string>>({});
  const sellers = [
    ...new Set(
      s.orders.filter((o) => ["PAID", "COMPLETED"].includes(o.status)).map((o) => o.sellerId),
    ),
  ];
  const orders = s.orders.filter(
    (o) => o.sellerId === f.seller && ["PAID", "COMPLETED"].includes(o.status),
  );
  const ord = orders.find((o) => o.id === f.order);
  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (!f.seller) er.seller = "Choose the seller.";
    if (!f.order) er.order = "Choose the order.";
    if (!f.product) er.product = "Choose the item.";
    if (f.details.trim().length < 10)
      er.details = "Please describe the problem in at least 10 characters.";
    setE(er);
    if (Object.keys(er).length) return;
    s.createCase({
      sellerId: f.seller,
      orderId: f.order,
      productId: f.product,
      type: f.type,
      details: f.details.trim(),
    });
    setShow(false);
    setF({ seller: "", order: "", product: "", type: "Item not received", details: "" });
  }
  const sel = (
    label: string,
    key: "seller" | "order" | "product",
    opts: [string, string][],
    dis?: boolean,
  ) => (
    <Field label={label} error={e[key]}>
      {(a) => (
        <select
          {...a}
          disabled={dis}
          value={f[key]}
          onChange={(x) =>
            setF({
              ...f,
              [key]: x.target.value,
              ...(key === "seller"
                ? { order: "", product: "" }
                : key === "order"
                  ? { product: "" }
                  : {}),
            })
          }
        >
          <option value="">Select...</option>
          {opts.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
  return (
    <div>
      <PageTitle
        title="Cases"
        sub="Tell us when an order didn't go as expected."
        action={
          !showForm && (
            <Button onClick={() => setShow(true)}>
              <Icon n="plus" className="size-4" />
              New case
            </Button>
          )
        }
      />
      {showForm && (
        <Card className="mb-6 p-4 @xl:p-6">
          <form onSubmit={submit} noValidate className="grid gap-4 @3xl:grid-cols-2">
            <h2 className="font-semibold @3xl:col-span-2">Report a problem</h2>
            {sel(
              "Seller",
              "seller",
              sellers.map((id) => [id, s.seller(id).name]),
            )}
            {sel(
              "Order",
              "order",
              orders.map((o) => [o.id, `${o.id} (${fmt(o.total)})`]),
              !f.seller,
            )}
            {sel(
              "Item",
              "product",
              (ord?.lines ?? []).map((l) => [l.productId, l.title]),
              !f.order,
            )}
            <Field label="Problem type">
              {(a) => (
                <select
                  {...a}
                  value={f.type}
                  onChange={(x) => setF({ ...f, type: x.target.value })}
                >
                  {[
                    "Item not received",
                    "Not as described",
                    "Damaged item",
                    "Refund request",
                    "Other",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
            </Field>
            <div className="@3xl:col-span-2">
              <Field
                label="What happened?"
                error={e.details}
                hint="Include dates and what you've already tried."
              >
                {(a) => (
                  <textarea
                    {...a}
                    rows={3}
                    className={a.className + " py-2"}
                    value={f.details}
                    onChange={(x) => setF({ ...f, details: x.target.value })}
                  />
                )}
              </Field>
            </div>
            <div className="flex gap-2 @3xl:col-span-2">
              <Button type="submit">Submit case</Button>
              <Button
                v="secondary"
                onClick={() => {
                  setShow(false);
                  setE({});
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      <DataGate rows={2}>
        {s.cases.length === 0 ? (
          <Empty
            icon="flag"
            title="No cases"
            text="You haven't reported any problems. Cases for paid and completed orders appear here."
          />
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-2">
            {s.cases.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.type}</p>
                    <p className="text-xs text-slate-600">Opened {fmtDate(c.createdAt)}</p>
                  </div>
                  <Chip tone={caseTone[c.status]}>{caseLabel[c.status]}</Chip>
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-slate-600">Seller</dt>
                    <dd>{s.seller(c.sellerId).name}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-slate-600">Order</dt>
                    <dd>
                      <Link to={`/order/${c.orderId}`} className="underline">
                        {c.orderId}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-slate-600">Item</dt>
                    <dd>{s.product(c.productId).title}</dd>
                  </div>
                </dl>
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {c.details}
                </p>
                {c.resolution && (
                  <p className="mt-2 text-sm text-emerald-800">Admin response: {c.resolution}</p>
                )}
                {["OPEN", "IN_REVIEW"].includes(c.status) && (
                  <Button v="secondary" className="mt-3" onClick={() => setW(c.id)}>
                    Withdraw case
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </DataGate>
      {w && (
        <Confirm
          title="Withdraw this case?"
          text="We'll stop reviewing it. If the problem comes back you can open a new case."
          confirm="Withdraw case"
          cancel="Keep case open"
          onConfirm={() => s.withdrawCase(w)}
          onClose={() => setW(null)}
        />
      )}
    </div>
  );
}
