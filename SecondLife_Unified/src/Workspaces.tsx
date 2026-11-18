import { useState, type ReactNode } from "react";
import { useStore, fmt, fmtDate, countdown } from "./store";
import {
  Button,
  Card,
  Chip,
  PageTitle,
  Icon,
  Field,
  TextInput,
  Empty,
  Modal,
  Confirm,
  Alert,
  DataGate,
} from "./ui";
import { DataTable } from "./Table";
import { available, productStatus, type Listing, type Purchase } from "./domain";

export function Status({ value }: { value: string }) {
  const green = [
    "AVAILABLE",
    "ACTIVE",
    "ACCEPTED",
    "PAID",
    "COMPLETED",
    "RESOLVED",
    "SUCCESS",
  ].includes(value);
  const red = [
    "SUSPENDED",
    "UNAVAILABLE",
    "SOLD",
    "CANCELLED",
    "REJECTED",
    "EXPIRED",
    "REFUNDED",
  ].includes(value);
  return (
    <Chip
      tone={
        green
          ? "green"
          : red
            ? "red"
            : ["SHIPPED", "IN_TRANSIT", "DELIVERED", "IN_REVIEW"].includes(value)
              ? "blue"
              : "amber"
      }
    >
      {value === "AWAITING_PAYMENT"
        ? "PENDING"
        : value === "IN_REVIEW"
          ? "UNDER_REVIEW"
          : value.replaceAll("_", " ")}
    </Chip>
  );
}
function Search({
  value,
  set,
  placeholder,
}: {
  value: string;
  set: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-4 max-w-md">
      <Icon n="search" className="absolute left-3 top-3 size-5 text-slate-500" />
      <input
        className="sl-input pl-10"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
}
function Stat({ label, value, icon }: { label: string; value: ReactNode; icon: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-sm font-medium">{label}</span>
        <Icon n={icon} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
export function Overview() {
  const s = useStore();
  const admin = s.account?.role === "ADMIN";
  const listings = s.data.products.filter((p) => admin || p.sellerId === s.actor);
  const os = s.orders;
  return (
    <>
      <PageTitle
        title={admin ? "Platform overview" : "Seller overview"}
        sub={
          admin
            ? "A shared view of your marketplace, transactions and community."
            : "Your listings, incoming orders and next actions in one place."
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="tag"
          label={admin ? "Total listings" : "Your listings"}
          value={listings.length}
        />
        <Stat icon="box" label="Orders" value={os.length} />
        <Stat
          icon="truck"
          label="Ready to ship"
          value={os.filter((o) => o.status === "PAID" && o.tracking === "PENDING").length}
        />
        <Stat
          icon="flag"
          label="Open cases"
          value={s.cases.filter((c) => ["OPEN", "IN_REVIEW"].includes(c.status)).length}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Recent transactions</h2>
          <DataTable
            rows={os.slice(0, 6)}
            cols={[
              {
                header: "Order",
                render: (o) => <span className="break-all font-medium">{o.id}</span>,
              },
              { header: "Status", render: (o) => <Status value={o.status} /> },
              { header: "Total", render: (o) => fmt(o.total) },
            ]}
            emptyTitle="No orders yet"
            emptyHint="Buyer checkout creates orders here."
          />
        </Card>
        <Card className="p-5">
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Icon n="shield" className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">One marketplace. Connected.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Listings, offers, orders and cases are shared across all three workplaces. Use the demo
            account switcher to follow a transaction from buyer to seller to administrator.
          </p>
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            Paid volume{" "}
            <strong className="float-right text-slate-900">
              {fmt(
                os
                  .filter((o) => ["PAID", "COMPLETED"].includes(o.status))
                  .reduce((n, o) => n + o.total - (o.refund?.executedAt ? o.refund.amount : 0), 0),
              )}
            </strong>
          </div>
        </Card>
      </div>
    </>
  );
}

export function Listings() {
  const s = useStore();
  const admin = s.account?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [edit, setEdit] = useState<Listing | null | undefined>();
  const [target, setTarget] = useState<Listing>();
  const rows = s.data.products.filter(
    (p) =>
      (admin || p.sellerId === s.actor) &&
      (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
      (filter === "ALL" || productStatus(p) === filter),
  );
  return (
    <>
      <PageTitle
        title={admin ? "Listing moderation" : "My listings"}
        sub={
          admin
            ? "Review shared listings and control marketplace availability."
            : "Manage prices and inventory. Reserved units are protected."
        }
        action={
          !admin && (
            <Button onClick={() => setEdit(null)}>
              <Icon n="plus" />
              New listing
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-start gap-3">
        <Search value={q} set={setQ} placeholder="Search listings" />
        <select
          aria-label="Listing status"
          className="sl-input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["ALL", "AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <Card>
        <DataTable
          rows={rows}
          resetKey={q + filter}
          cols={[
            {
              header: "Listing",
              render: (p) => (
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.seller(p.sellerId).name}</p>
                </div>
              ),
            },
            { header: "Price", render: (p) => fmt(p.price) },
            {
              header: "Stock",
              render: (p) => (
                <div>
                  {p.stock} on hand
                  <p className="text-xs text-slate-500">
                    {p.reserved} reserved · {available(p)} available
                  </p>
                </div>
              ),
            },
            { header: "Status", render: (p) => <Status value={productStatus(p)} /> },
            {
              header: "Actions",
              render: (p) =>
                admin ? (
                  <Button v="secondary" onClick={() => setTarget(p)}>
                    {p.enabled ? "Disable" : "Restore"}
                  </Button>
                ) : (
                  <Button v="secondary" onClick={() => setEdit(p)}>
                    <Icon n="edit" />
                    Edit
                  </Button>
                ),
            },
          ]}
          emptyTitle="No listings found"
          emptyHint="Change your search or create a listing."
        />
      </Card>
      {edit !== undefined && <ListingForm listing={edit} onClose={() => setEdit(undefined)} />}
      {target && (
        <Confirm
          title={target.enabled ? "Disable listing?" : "Restore listing?"}
          text={`${target.title}. Buyer availability will update immediately; historical orders remain intact.`}
          confirm={target.enabled ? "Disable listing" : "Restore listing"}
          danger={target.enabled}
          onClose={() => setTarget(undefined)}
          onConfirm={() => s.moderate(target.id, !target.enabled)}
        />
      )}
    </>
  );
}
function ListingForm({ listing, onClose }: { listing: Listing | null; onClose: () => void }) {
  const s = useStore();
  const [f, set] = useState({
    modelId: listing?.modelId ?? s.data.models[0]?.id ?? "",
    price: String(listing?.price ?? ""),
    stock: String(listing?.stock ?? 1),
    minOfferPct: String(listing?.minOfferPct ?? 75),
    condition: listing?.condition ?? "Good",
    desc: listing?.desc ?? "",
    enabled: listing?.enabled ?? true,
  });
  const save = () => {
    if (
      s.saveListing({
        ...f,
        id: listing?.id,
        price: Number(f.price),
        stock: Number(f.stock),
        minOfferPct: Number(f.minOfferPct),
      })
    )
      onClose();
  };
  return (
    <Modal
      title={listing ? "Edit listing" : "Create listing"}
      onClose={onClose}
      actions={
        <>
          <Button v="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save listing</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Catalogue model">
          {(p) => (
            <select
              {...p}
              value={f.modelId}
              onChange={(e) => set({ ...f, modelId: e.target.value })}
            >
              {s.data.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {(["price", "stock", "minOfferPct"] as const).map((k) => (
          <TextInput
            key={k}
            label={
              {
                price: "Price (RM)",
                stock: "On-hand quantity",
                minOfferPct: "Minimum offer (% of price)",
              }[k]
            }
            type="number"
            step={k === "price" ? ".01" : "1"}
            value={f[k]}
            onChange={(e) => set({ ...f, [k]: e.target.value })}
          />
        ))}
        <Field label="Condition">
          {(p) => (
            <select
              {...p}
              value={f.condition}
              onChange={(e) => set({ ...f, condition: e.target.value as "Good" })}
            >
              {["Like new", "Good", "Fair"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Appearance and description">
          {(p) => (
            <textarea
              {...p}
              className={p.className + " py-2"}
              value={f.desc}
              onChange={(e) => set({ ...f, desc: e.target.value })}
            />
          )}
        </Field>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={f.enabled}
            disabled={!!listing && !listing.enabled}
            onChange={(e) => set({ ...f, enabled: e.target.checked })}
          />
          Listing enabled
        </label>
        {listing && !listing.enabled && (
          <p className="text-xs">Ask Admin to restore a disabled listing.</p>
        )}
      </div>
    </Modal>
  );
}

export function IncomingOffers() {
  const s = useStore();
  const [q, setQ] = useState("");
  const rows = s.offers.filter((o) =>
    s.product(o.productId)?.title.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Incoming offers"
        sub="Accepting an offer does not reserve stock. The original deadline is retained."
      />
      <Search value={q} set={setQ} placeholder="Search offered products" />
      <Card>
        <DataTable
          rows={rows}
          resetKey={q}
          cols={[
            {
              header: "Product / buyer",
              render: (o) => (
                <div className="font-medium">
                  {s.product(o.productId).title}
                  <p className="text-xs text-slate-500">
                    {s.data.accounts.find((a) => a.id === o.buyerId)?.name}
                  </p>
                </div>
              ),
            },
            { header: "Offer", render: (o) => fmt(o.proposed) },
            { header: "Status", render: (o) => <Status value={s.offerStatus(o)} /> },
            { header: "Remaining", render: (o) => countdown(o.expiresAt - s.now) },
            {
              header: "Decision",
              render: (o) => (
                <div className="flex gap-2">
                  <Button
                    disabled={s.offerStatus(o) !== "PENDING"}
                    onClick={() => s.demoRespondOffer(o.id, true)}
                  >
                    Accept
                  </Button>
                  <Button
                    v="secondary"
                    disabled={s.offerStatus(o) !== "PENDING"}
                    onClick={() => s.demoRespondOffer(o.id, false)}
                  >
                    Decline
                  </Button>
                </div>
              ),
            },
          ]}
          emptyTitle="No offers found"
          emptyHint="Offers submitted by buyers will appear here."
        />
      </Card>
    </>
  );
}

export function ManagedOrders({ deliveryOnly = false }: { deliveryOnly?: boolean }) {
  const s = useStore();
  const admin = s.account?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<string>();
  const rows = s.orders.filter(
    (o) =>
      (!deliveryOnly || ["PAID", "COMPLETED"].includes(o.status)) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) ||
        o.lines.some((l) => l.title.toLowerCase().includes(q.toLowerCase()))),
  );
  const order = s.data.orders.find((o) => o.id === chosen);
  return (
    <>
      <PageTitle
        title={deliveryOnly ? "Delivery tracking" : "Orders & payments"}
        sub={
          admin
            ? "Inspect the same transaction records shown to buyers and sellers."
            : "Register shipping after payment and follow buyer confirmation."
        }
      />
      <Search value={q} set={setQ} placeholder="Search orders or products" />
      <Card>
        <DataTable
          rows={rows}
          resetKey={q}
          cols={[
            {
              header: "Order",
              render: (o) => (
                <div className="max-w-64 break-all font-medium">
                  {o.id}
                  <p className="mt-1 text-xs text-slate-500">
                    {o.lines.map((l) => l.title).join(", ")}
                  </p>
                </div>
              ),
            },
            {
              header: "Buyer / seller",
              render: (o) => (
                <div>
                  {s.data.accounts.find((a) => a.id === o.buyerId)?.name}
                  <p className="text-xs text-slate-500">{s.seller(o.sellerId).name}</p>
                </div>
              ),
            },
            { header: "Total", render: (o) => fmt(o.total) },
            {
              header: "Order / delivery",
              render: (o) => (
                <div className="flex flex-col items-start gap-2">
                  <Status value={o.status} />
                  <Status value={o.tracking} />
                  {o.refund && (
                    <Status value={o.refund.executedAt ? "REFUNDED" : "REFUND AUTHORISED"} />
                  )}
                </div>
              ),
            },
            {
              header: "Actions",
              render: (o) => (
                <Button v="secondary" onClick={() => setChosen(o.id)}>
                  View order
                </Button>
              ),
            },
          ]}
          emptyTitle="No matching orders"
          emptyHint="Checkout and successful payments appear here."
        />
      </Card>
      {order && <OrderPanel order={order} onClose={() => setChosen(undefined)} admin={admin} />}
    </>
  );
}
function OrderPanel({
  order: o,
  onClose,
  admin,
}: {
  order: Purchase;
  onClose: () => void;
  admin: boolean;
}) {
  const s = useStore();
  const [courier, setCourier] = useState(o.courier ?? "Demo Courier");
  const [tracking, setTracking] = useState(o.trackingNumber ?? "");
  return (
    <Modal
      title="Order details"
      onClose={onClose}
      actions={
        <Button v="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="break-all text-xs text-slate-500">{o.id}</p>
        <div className="flex gap-2">
          <Status value={o.status} />
          <Status value={o.tracking} />
        </div>
        <p>{o.address}</p>
        <ul className="divide-y divide-slate-100">
          {o.lines.map((l) => (
            <li className="py-2" key={l.productId}>
              {l.title}
              <p>
                {l.qty} × {fmt(l.unitPrice)}
              </p>
            </li>
          ))}
        </ul>
        <p className="font-semibold">Total {fmt(o.total)}</p>
        <p className="text-xs text-slate-500">
          Created {fmtDate(o.createdAt)} · Payment deadline {fmtDate(o.payDeadline)}
        </p>
        {!admin && o.status === "PAID" && o.tracking === "PENDING" && (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <TextInput
              label="Courier"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            />
            <TextInput
              label="Tracking number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <Button onClick={() => s.ship(o.id, courier, tracking)}>Mark as shipped</Button>
          </div>
        )}
        {o.trackingNumber && (
          <p>
            Courier: {o.courier}
            <br />
            Tracking: {o.trackingNumber}
          </p>
        )}
        {o.tracking === "SHIPPED" && (
          <Alert title="Waiting for automatic transit">
            {countdown((o.nextAdvanceAt ?? 0) - s.now)} remaining. Buyer confirms delivery and
            receipt separately.
          </Alert>
        )}
        <ol className="space-y-2 border-l-2 border-emerald-200 pl-4">
          {s.data.events
            .filter((e) => e.orderId === o.id)
            .map((e) => (
              <li key={e.id}>
                <strong>{e.type.replaceAll("_", " ")}</strong>
                <p className="text-xs text-slate-500">
                  {fmtDate(e.at)} · {e.source}
                </p>
              </li>
            ))}
        </ol>
        {o.refund && (
          <Alert title={o.refund.executedAt ? "Refund processed" : "Refund authorised"}>
            {fmt(o.refund.amount)} · {o.refund.reason}
            {admin && !o.refund.executedAt && (
              <Button className="mt-2" onClick={() => s.executeRefund(o.id)}>
                Simulate refund processing
              </Button>
            )}
          </Alert>
        )}
      </div>
    </Modal>
  );
}

export function Users() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<string>();
  const user = s.data.accounts.find((a) => a.id === target);
  return (
    <>
      <PageTitle title="User management" sub="Account restrictions apply across all workplaces." />
      <Search value={q} set={setQ} placeholder="Search names or emails" />
      <Card>
        <DataTable
          rows={s.data.accounts.filter((a) =>
            (a.name + " " + a.email).toLowerCase().includes(q.toLowerCase()),
          )}
          resetKey={q}
          cols={[
            {
              header: "Account",
              render: (a) => (
                <div className="font-medium">
                  {a.name}
                  <p className="text-xs text-slate-500">{a.email}</p>
                </div>
              ),
            },
            { header: "Role", render: (a) => <Status value={a.role} /> },
            { header: "Status", render: (a) => <Status value={a.status} /> },
            {
              header: "Action",
              render: (a) => (
                <Button v="secondary" disabled={a.role === "ADMIN"} onClick={() => setTarget(a.id)}>
                  {a.status === "ACTIVE" ? "Suspend" : "Restore"}
                </Button>
              ),
            },
          ]}
          emptyTitle="No users found"
          emptyHint="Try another search."
        />
      </Card>
      {user && (
        <Confirm
          title={user.status === "ACTIVE" ? "Suspend account?" : "Restore account?"}
          text={`${user.name}. Suspending a seller disables their listings. Restoring an account does not automatically restore listings.`}
          confirm={user.status === "ACTIVE" ? "Suspend" : "Restore"}
          danger={user.status === "ACTIVE"}
          onClose={() => setTarget(undefined)}
          onConfirm={() =>
            s.setAccountStatus(user.id, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")
          }
        />
      )}
    </>
  );
}
export function Categories() {
  const s = useStore();
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<string>();
  return (
    <>
      <PageTitle
        title="Categories"
        sub="Shared catalogue categories used in buyer discovery and seller listings."
      />
      <Card className="mb-5 p-5">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (s.saveCategory(name, edit)) {
              setName("");
              setEdit(undefined);
            }
          }}
        >
          <TextInput
            label={edit ? "Rename category" : "New category"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit">Save category</Button>
          {edit && (
            <Button
              v="secondary"
              onClick={() => {
                setEdit(undefined);
                setName("");
              }}
            >
              Cancel
            </Button>
          )}
        </form>
      </Card>
      <Card>
        <DataTable
          rows={s.data.categories.map((name) => ({ id: name, name }))}
          cols={[
            { header: "Name", render: (c) => c.name },
            {
              header: "Models",
              render: (c) => s.data.models.filter((m) => m.category === c.name).length,
            },
            {
              header: "Actions",
              render: (c) => (
                <div className="flex gap-2">
                  <Button
                    v="secondary"
                    onClick={() => {
                      setEdit(c.name);
                      setName(c.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button v="ghost" onClick={() => s.deleteCategory(c.name)}>
                    Remove
                  </Button>
                </div>
              ),
            },
          ]}
          emptyTitle="No categories"
          emptyHint="Create the first category above."
        />
      </Card>
    </>
  );
}
export function ManagedCases() {
  const s = useStore();
  const admin = s.account?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<string>();
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState("0");
  const c = s.cases.find((c) => c.id === chosen);
  return (
    <>
      <PageTitle
        title="Reports & disputes"
        sub={
          admin
            ? "Investigate cases, record decisions and authorise eligible refunds."
            : "Follow cases involving your transactions and administrator decisions."
        }
      />
      <Search value={q} set={setQ} placeholder="Search cases" />
      <Card>
        <DataTable
          rows={s.cases.filter((c) =>
            (c.id + " " + c.details).toLowerCase().includes(q.toLowerCase()),
          )}
          resetKey={q}
          cols={[
            {
              header: "Case",
              render: (c) => (
                <div>
                  <span className="font-medium">{c.type}</span>
                  <p className="max-w-xs truncate text-xs text-slate-500">{c.details}</p>
                </div>
              ),
            },
            {
              header: "Reporter",
              render: (c) => s.data.accounts.find((a) => a.id === c.reporterId)?.name,
            },
            { header: "Status", render: (c) => <Status value={c.status} /> },
            {
              header: "Action",
              render: (c) => (
                <Button
                  v="secondary"
                  onClick={() => {
                    setChosen(c.id);
                    setNote(c.resolution ?? "");
                    setRefund("0");
                  }}
                >
                  Open case
                </Button>
              ),
            },
          ]}
          emptyTitle="No cases found"
          emptyHint="Buyer reports will appear in the shared case queue."
        />
      </Card>
      {c && (
        <Modal
          title="Case review"
          onClose={() => setChosen(undefined)}
          actions={
            <Button v="secondary" onClick={() => setChosen(undefined)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <Status value={c.status} />
            <p>{c.details}</p>
            <p className="break-all text-xs text-slate-500">Order: {c.orderId}</p>
            {c.resolution && <Alert title="Admin decision">{c.resolution}</Alert>}
            {admin && ["OPEN", "IN_REVIEW"].includes(c.status) && (
              <>
                <Field label="Resolution note">
                  {(p) => (
                    <textarea
                      {...p}
                      className={p.className + " py-2"}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  )}
                </Field>
                <TextInput
                  label="Authorised refund (RM; 0 for none)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={refund}
                  onChange={(e) => setRefund(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (s.resolve(c.id, note, Number(refund))) setChosen(undefined);
                  }}
                >
                  Resolve case
                </Button>
                <p className="text-xs text-slate-500">
                  Refund authorisation and simulated payment processing are separate steps. Process
                  an approved refund in Orders & payments.
                </p>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
export function Settings() {
  const s = useStore();
  const [f, set] = useState(s.data.settings);
  return (
    <>
      <PageTitle
        title="Platform settings"
        sub="New transactions use these values. Existing persisted deadlines are preserved."
      />
      <Card className="max-w-2xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            s.saveSettings(f);
          }}
          className="space-y-5"
        >
          {(["paymentMinutes", "offerHours", "cooldownSeconds"] as const).map((k) => (
            <TextInput
              key={k}
              label={
                {
                  paymentMinutes: "Payment timeout (minutes)",
                  offerHours: "Offer validity (hours)",
                  cooldownSeconds: "Shipping cooldown (seconds)",
                }[k]
              }
              type="number"
              min="1"
              step="1"
              value={f[k]}
              onChange={(e) => set({ ...f, [k]: Number(e.target.value) })}
            />
          ))}
          <Alert title="Internal tracking">
            Only SHIPPED → IN_TRANSIT advances automatically. Buyers confirm delivery and then
            receipt.
          </Alert>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
    </>
  );
}
export function Notices() {
  const s = useStore();
  return (
    <>
      <PageTitle
        title="Notifications"
        sub="Updates for the currently selected account."
        action={
          <Button v="secondary" onClick={s.markAllNotices}>
            Mark all as read
          </Button>
        }
      />
      {!s.notices.length ? (
        <Empty title="You're all caught up" text="New marketplace events will appear here." />
      ) : (
        <div className="space-y-3">
          {s.notices.map((n) => (
            <Card key={n.id} className="flex items-start gap-4 p-5">
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <Icon n="bell" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{n.title}</h2>
                <p className="mt-1 break-words text-sm text-slate-600">{n.body}</p>
                <p className="mt-2 text-xs text-slate-500">{fmtDate(n.at)}</p>
              </div>
              {!n.read && (
                <Button v="ghost" onClick={() => s.markNotice(n.id)}>
                  Mark read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
export function Workplace({ page }: { page: string }) {
  const pages: Record<string, ReactNode> = {
    overview: <Overview />,
    listings: <Listings />,
    offers: <IncomingOffers />,
    orders: <ManagedOrders />,
    delivery: <ManagedOrders deliveryOnly />,
    users: <Users />,
    categories: <Categories />,
    cases: <ManagedCases />,
    settings: <Settings />,
    notifications: <Notices />,
  };
  return (
    <DataGate>
      {pages[page] ?? (
        <Empty title="Page not found" text="Choose a page from the workplace navigation." />
      )}
    </DataGate>
  );
}
