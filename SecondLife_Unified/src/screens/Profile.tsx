import { useState } from "react";
import { fmtDate, useStore } from "../store";
import type { Address } from "../data";
import {
  Alert,
  Button,
  Card,
  Chip,
  Confirm,
  Icon,
  LinkButton,
  Modal,
  PageTitle,
  Tabs,
  TextInput,
  Link,
} from "../ui";

const blank: Address = {
  id: "",
  label: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  postcode: "",
  city: "",
  state: "Selangor",
  isDefault: false,
};
const STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan",
];

function AddressForm({ initial, onClose }: { initial: Address; onClose: () => void }) {
  const s = useStore();
  const [a, setA] = useState(initial);
  const [e, setE] = useState<Record<string, string>>({});
  const set = (k: keyof Address, v: string | boolean) => setA((x) => ({ ...x, [k]: v }));
  function save() {
    const er: Record<string, string> = {};
    if (!a.label.trim()) er.label = "Give this address a label, such as Home.";
    if (!a.name.trim()) er.name = "Enter the recipient name.";
    if (!/^(\+?60|0)1\d[- ]?\d{7,8}$/.test(a.phone.replace(/\s/g, "")))
      er.phone = "Enter a valid Malaysian mobile number.";
    if (!a.line1.trim()) er.line1 = "Enter the street address.";
    if (!/^\d{5}$/.test(a.postcode)) er.postcode = "Postcode must be 5 digits.";
    if (!a.city.trim()) er.city = "Enter the city.";
    setE(er);
    if (Object.keys(er).length) return;
    s.saveAddress({ ...a, id: a.id || "a" + Date.now() });
    s.toast("Address saved");
    onClose();
  }
  return (
    <Modal
      title={initial.id ? "Edit address" : "Add address"}
      onClose={onClose}
      actions={
        <>
          <Button v="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save address</Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput
          label="Label"
          value={a.label}
          onChange={(x) => set("label", x.target.value)}
          error={e.label}
        />
        <TextInput
          label="Recipient name"
          value={a.name}
          onChange={(x) => set("name", x.target.value)}
          error={e.name}
        />
        <TextInput
          label="Mobile number"
          value={a.phone}
          onChange={(x) => set("phone", x.target.value)}
          error={e.phone}
        />
        <TextInput
          label="Address line 1"
          value={a.line1}
          onChange={(x) => set("line1", x.target.value)}
          error={e.line1}
        />
        <TextInput
          label="Address line 2 (optional)"
          value={a.line2}
          onChange={(x) => set("line2", x.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Postcode"
            inputMode="numeric"
            value={a.postcode}
            onChange={(x) => set("postcode", x.target.value)}
            error={e.postcode}
          />
          <TextInput
            label="City"
            value={a.city}
            onChange={(x) => set("city", x.target.value)}
            error={e.city}
          />
        </div>
        <div>
          <label htmlFor="st" className="mb-1.5 block text-sm font-medium">
            State
          </label>
          <select
            id="st"
            value={a.state}
            onChange={(x) => set("state", x.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            {STATES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-emerald-700"
            checked={a.isDefault}
            onChange={(x) => set("isDefault", x.target.checked)}
          />
          Use as my default address
        </label>
      </div>
    </Modal>
  );
}

export function Profile() {
  const s = useStore();
  const [tab, setTab] = useState<"profile" | "addresses" | "notices" | "account">("profile");
  const [form, setForm] = useState(s.user!);
  const [err, setErr] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Address | null>(null);
  const [rm, setRm] = useState<Address | null>(null);
  const [deact, setDeact] = useState(false);
  const unread = s.notices.filter((n) => !n.read).length;
  const blocking = s.orders.filter(s.isActiveOrder);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^(\+?60|0)1\d[- ]?\d{7,8}$/.test(form.phone.replace(/\s/g, "")))
      er.phone = "Enter a valid Malaysian mobile number.";
    setErr(er);
    if (!Object.keys(er).length) {
      s.updateProfile(form);
      s.toast("Profile updated");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="My account" sub={s.user!.email} />
      <Tabs
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "addresses", label: "Addresses" },
          { id: "notices", label: unread ? `Notices (${unread})` : "Notices" },
          { id: "account", label: "Account" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "profile" && (
        <>
          <Card className="p-5">
            <form onSubmit={save} noValidate className="space-y-4">
              <TextInput
                label="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={err.name}
              />
              <TextInput
                label="Email"
                value={form.email}
                disabled
                hint="Contact support to change your email."
              />
              <TextInput
                label="Mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={err.phone}
              />
              <Button type="submit">Save changes</Button>
            </form>
          </Card>
          <Card className="mt-4 divide-y divide-slate-100">
            {[
              ["/offers", "My offers", "tag"],
              ["/reviews", "My ratings", "star"],
              ["/cases", "Cases", "flag"],
              ["/wishlist", "Wishlist", "heart"],
            ].map(([to, l, ic]) => (
              <Link
                key={to}
                to={to}
                className="flex min-h-14 items-center gap-3 px-4 text-sm font-medium hover:bg-slate-50"
              >
                <Icon n={ic} className="size-5 text-emerald-700" />
                <span className="flex-1">{l}</span>
                <Icon n="chevR" className="size-4 text-slate-500" />
              </Link>
            ))}
          </Card>
          <Button
            v="secondary"
            className="mt-4 w-full @xl:w-auto"
            onClick={() => {
              s.logout();
            }}
          >
            Log out
          </Button>
        </>
      )}
      {tab === "addresses" && (
        <div className="space-y-3">
          <Button onClick={() => setEditing(blank)}>
            <Icon n="plus" className="size-4" />
            Add address
          </Button>
          {s.addresses.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Icon n="pin" className="size-5 text-emerald-700" />
                <span className="font-semibold">{a.label}</span>
                {a.isDefault && <Chip tone="green">Default</Chip>}
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {a.name} · {a.phone}
                <br />
                {a.line1}, {a.line2}
                <br />
                {a.postcode} {a.city}, {a.state}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <Button
                    v="secondary"
                    onClick={() => {
                      s.setDefaultAddress(a.id);
                      s.toast(`${a.label} is now your default address`);
                    }}
                  >
                    Set as default
                  </Button>
                )}
                <Button v="secondary" onClick={() => setEditing(a)}>
                  Edit
                </Button>
                <Button
                  v="ghost"
                  disabled={a.isDefault}
                  onClick={() => setRm(a)}
                  title={a.isDefault ? "Choose another default first" : undefined}
                >
                  Remove
                </Button>
              </div>
              {a.isDefault && s.addresses.length > 1 && (
                <p className="mt-2 text-xs text-slate-600">
                  To remove this address, set another one as default first.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
      {tab === "notices" && (
        <div className="space-y-3">
          {unread > 0 && (
            <Button v="secondary" onClick={s.markAllNotices}>
              Mark all as read
            </Button>
          )}
          {s.notices.map((n) => (
            <Card
              key={n.id}
              className={`p-4 ${n.read ? "" : "border-emerald-300 bg-emerald-50/40"}`}
            >
              <div className="flex items-start gap-3">
                <Icon n="bell" className="mt-0.5 size-5 text-emerald-700" />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {n.title}
                    {!n.read && <Chip tone="green">New</Chip>}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-600">{fmtDate(n.at)}</p>
                </div>
                {!n.read && (
                  <Button v="ghost" onClick={() => s.markNotice(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === "account" && (
        <Card className="border-red-200 p-5">
          <h2 className="text-lg font-semibold text-red-800">Deactivate account</h2>
          <p className="mt-1 text-sm text-slate-700">
            Your profile, wishlist and offers will be hidden. An administrator can restore your
            account.
          </p>
          {blocking.length > 0 && (
            <div className="mt-4">
              <Alert tone="warn" title="You can't deactivate yet">
                You have {blocking.length} order{blocking.length > 1 ? "s" : ""} in progress. Finish
                or cancel {blocking.length > 1 ? "them" : "it"} first:
                <ul className="mt-2 list-disc pl-5">
                  {blocking.map((o) => (
                    <li key={o.id}>
                      <Link to={`/order/${o.id}`} className="font-semibold underline">
                        {o.id}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
          <Button
            v="danger"
            className="mt-4"
            aria-disabled={blocking.length > 0}
            onClick={() =>
              blocking.length
                ? s.toast("Active orders must be finished or cancelled first", "error")
                : setDeact(true)
            }
          >
            Deactivate my account
          </Button>
          {blocking.length > 0 && (
            <div className="mt-3">
              <LinkButton to="/orders" v="secondary">
                View my orders
              </LinkButton>
            </div>
          )}
        </Card>
      )}
      {editing && <AddressForm initial={editing} onClose={() => setEditing(null)} />}
      {rm && (
        <Confirm
          title="Remove this address?"
          text={`${rm.label} (${rm.line1}) will be deleted.`}
          confirm="Remove"
          onConfirm={() => {
            s.removeAddress(rm.id);
            s.toast("Address removed", "info");
          }}
          onClose={() => setRm(null)}
        />
      )}
      {deact && (
        <Confirm
          title="Deactivate your account?"
          text="Your account will be restricted. An administrator can restore it."
          confirm="Yes, deactivate"
          cancel="Cancel"
          onConfirm={s.deactivate}
          onClose={() => setDeact(false)}
        />
      )}
    </div>
  );
}
