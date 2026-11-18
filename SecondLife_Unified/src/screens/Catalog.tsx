import { useMemo, useState } from "react";
import { CATEGORIES, CONDITIONS, SELLER_REVIEWS, type Product } from "../data";
import { fmt, go, useStore } from "../store";
import {
  Alert,
  Button,
  Card,
  Chip,
  DataGate,
  Empty,
  Icon,
  Img,
  Link,
  LinkButton,
  PageTitle,
  Stars,
  Stepper,
} from "../ui";

export function StockChip({ p }: { p: Product }) {
  if (p.stock <= 0) return <Chip tone="red">Out of stock</Chip>;
  if (p.stock <= 2) return <Chip tone="amber">Only {p.stock} left</Chip>;
  return <Chip tone="green">In stock</Chip>;
}
const condTone = { "Like new": "green", Good: "blue", Fair: "amber" } as const;

function Card1({ p }: { p: Product }) {
  const s = useStore();
  const wished = s.wishlist.some((w) => w.productId === p.id);
  return (
    <Card className="group relative overflow-hidden">
      <Link to={`/product/${p.id}`} className="block rounded-xl">
        <Img
          p={p}
          className={`aspect-square w-full ${p.stock <= 0 ? "opacity-60 grayscale" : ""}`}
        />
        <div className="space-y-1.5 p-3">
          <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{p.title}</p>
          <p className="text-lg font-bold text-emerald-800">{fmt(p.price)}</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={condTone[p.condition]}>{p.condition}</Chip>
            <StockChip p={p} />
          </div>
          <p className="truncate text-xs text-slate-600">{s.seller(p.sellerId).name}</p>
        </div>
      </Link>
      <button
        aria-label={wished ? `Remove ${p.title} from wishlist` : `Save ${p.title} to wishlist`}
        aria-pressed={wished}
        onClick={() => s.toggleWish(p.id)}
        className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/95 shadow ring-1 ring-slate-200 hover:bg-white"
      >
        <Icon
          n="heart"
          fill={wished}
          className={`size-5 ${wished ? "text-red-600" : "text-slate-700"}`}
        />
      </button>
    </Card>
  );
}

export function Products() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [cond, setCond] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("rel");
  const [open, setOpen] = useState(false);
  const lo = min === "" ? 0 : Number(min),
    hi = max === "" ? Infinity : Number(max);
  const bad =
    min !== "" && max !== "" && lo > hi ? "Minimum price must be lower than maximum price." : "";
  const list = useMemo(() => {
    let l = s.products.filter(
      (p) =>
        (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
        (!cat || p.category === cat) &&
        (!cond.length || cond.includes(p.condition)) &&
        (bad || (p.price >= lo && p.price <= hi)),
    );
    if (sort === "lo") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "hi") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [s.products, q, cat, cond, lo, hi, sort, bad]);
  const reset = () => {
    setQ("");
    setCat("");
    setCond([]);
    setMin("");
    setMax("");
  };
  const filters = (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Category</legend>
        <div className="flex flex-wrap gap-2">
          {["", ...s.data.categories].map((c) => (
            <button
              key={c}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`min-h-11 rounded-full px-4 text-sm font-medium ring-1 ring-inset ${cat === c ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50"}`}
            >
              {c || "All"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Condition</legend>
        {CONDITIONS.map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-emerald-700"
              checked={cond.includes(c)}
              onChange={() =>
                setCond((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))
              }
            />
            {c}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price (RM)</legend>
        <div className="flex items-center gap-2">
          <input
            aria-label="Minimum price"
            inputMode="numeric"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
            className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
          <span aria-hidden>–</span>
          <input
            aria-label="Maximum price"
            inputMode="numeric"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
            className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
        {bad && <p className="mt-1.5 text-sm font-medium text-red-700">{bad}</p>}
      </fieldset>
      <Button v="secondary" className="w-full" onClick={reset}>
        Clear filters
      </Button>
    </div>
  );
  return (
    <div>
      <PageTitle
        title="Discover preloved"
        sub={`${list.length} items from sellers across Malaysia`}
      />
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Icon
            n="search"
            className="pointer-events-none absolute left-3 top-3.5 size-5 text-slate-500"
          />
          <input
            type="search"
            aria-label="Search items"
            placeholder="Search iPad, baju kurung, air fryer..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm"
          />
        </div>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm"
        >
          <option value="rel">Recommended</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
        </select>
        <Button
          v="secondary"
          className="@3xl:hidden"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Filters
        </Button>
      </div>
      {open && <Card className="mb-4 p-4 @3xl:hidden">{filters}</Card>}
      <div className="grid gap-6 @3xl:grid-cols-[250px_1fr]">
        <Card className="hidden h-fit p-4 @3xl:block">{filters}</Card>
        <DataGate grid>
          {list.length === 0 ? (
            <Empty
              icon="search"
              title="No items match your filters"
              text="Try a different search word, widen the price range or clear your filters."
              action={<Button onClick={reset}>Clear filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @3xl:gap-5 @6xl:grid-cols-4">
              {list.map((p) => (
                <Card1 key={p.id} p={p} />
              ))}
            </div>
          )}
        </DataGate>
      </div>
    </div>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const s = useStore();
  const p = s.products.find((x) => x.id === id);
  const [qty, setQty] = useState(1);
  if (!p)
    return (
      <Empty
        title="Item not found"
        text="This listing may have been removed."
        action={<LinkButton to="/products">Back to shop</LinkButton>}
      />
    );
  const sl = s.seller(p.sellerId),
    wished = s.wishlist.some((w) => w.productId === p.id),
    out = p.stock <= 0;
  const offer = s.offers.find(
    (o) => o.productId === p.id && ["PENDING", "ACCEPTED"].includes(s.offerStatus(o)),
  );
  return (
    <div>
      <Link
        to="/products"
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-800"
      >
        <Icon n="chevL" className="size-4" />
        Back to shop
      </Link>
      <div className="grid gap-6 @3xl:grid-cols-2 @3xl:gap-10">
        <Img
          p={p}
          className={`aspect-square w-full rounded-2xl ${out ? "opacity-60 grayscale" : ""}`}
        />
        <div>
          <div className="flex flex-wrap gap-2">
            <Chip tone={condTone[p.condition]}>{p.condition}</Chip>
            <Chip>{p.category}</Chip>
            <StockChip p={p} />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight @3xl:text-3xl">{p.title}</h1>
          <p className="mt-2 text-3xl font-extrabold text-emerald-800">{fmt(p.price)}</p>
          <p className="mt-4 text-slate-700">{p.desc}</p>
          {out && (
            <div className="mt-4">
              <Alert tone="error" title="Out of stock">
                This item is sold out right now. Save it to your wishlist and check back later.
              </Alert>
            </div>
          )}
          {offer && (
            <div className="mt-4">
              <Alert
                tone="info"
                title={`You have an offer on this item (${fmt(offer.accepted ?? offer.proposed)})`}
              >
                <Link to="/offers" className="font-semibold underline">
                  View offer
                </Link>
              </Alert>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Stepper value={qty} max={Math.max(1, p.stock)} onChange={setQty} disabled={out} />
            <Button
              disabled={out}
              onClick={() => s.addToCart(p.id, qty)}
              className="flex-1 @xl:flex-none"
            >
              <Icon n="cart" className="size-4" />
              {out ? "Out of stock" : "Add to cart"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <LinkButton
              to={`/offer/new/${p.id}`}
              v="secondary"
              className={out ? "pointer-events-none opacity-50" : ""}
            >
              <Icon n="tag" className="size-4" />
              Make an offer
            </LinkButton>
            <Button v="secondary" aria-pressed={wished} onClick={() => s.toggleWish(p.id)}>
              <Icon n="heart" fill={wished} className={`size-4 ${wished ? "text-red-600" : ""}`} />
              {wished ? "Saved" : "Wishlist"}
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
            <Icon n="info" className="mt-0.5 size-4 shrink-0" />
            Offers don't hold the item. Another buyer can still purchase it first.
          </p>
          <Card className="mt-6 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-900">
                {sl.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{sl.name}</p>
                <p className="flex items-center gap-1 text-sm text-slate-600">
                  <Icon n="pin" className="size-4" />
                  {sl.city}
                </p>
              </div>
              <Chip tone="green">Trusted seller</Chip>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                [`${sl.rating.toFixed(1)}`, `${sl.reviews} ratings`],
                [`${sl.positive}%`, "positive"],
                [`${sl.sales}`, "items sold"],
              ].map(([a, b]) => (
                <div key={b} className="rounded-lg bg-slate-50 p-2">
                  <dd className="text-lg font-bold">{a}</dd>
                  <dt className="text-xs text-slate-600">{b}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <Icon n="clock" className="size-4" />
              Replies {sl.response} · Selling since {sl.since}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Stars value={sl.rating} />
              <span className="text-sm font-medium">{sl.rating.toFixed(1)}</span>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {s.data.reviews
                .filter(
                  (r) =>
                    !r.removed &&
                    s.data.orders.some((o) => o.id === r.orderId && o.sellerId === p.sellerId),
                )
                .map((r) => ({
                  who: s.data.accounts.find((a) => a.id === r.reviewerId)?.name ?? "Buyer",
                  stars: r.rating,
                  text: r.text,
                }))
                .map((r) => (
                  <li key={r.who} className="py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Stars value={r.stars} size="size-3.5" />
                      <span className="font-medium">{r.who}</span>
                    </div>
                    <p className="mt-0.5 text-slate-700">{r.text}</p>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Wishlist() {
  const s = useStore();
  return (
    <div>
      <PageTitle title="Wishlist" sub="Add private notes to remember why you saved something." />
      <DataGate>
        {s.wishlist.length === 0 ? (
          <Empty
            icon="heart"
            title="Your wishlist is empty"
            text="Tap the heart on any item to save it here."
            action={<LinkButton to="/products">Browse items</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-2">
            {s.wishlist.map((w) => (
              <WishRow key={w.productId} pid={w.productId} note={w.note} />
            ))}
          </div>
        )}
      </DataGate>
    </div>
  );
}
function WishRow({ pid, note }: { pid: string; note: string }) {
  const s = useStore();
  const p = s.product(pid);
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(note);
  const err = v.length > 120 ? "Notes can be up to 120 characters." : "";
  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <Link to={`/product/${p.id}`} className="shrink-0">
          <Img
            p={p}
            label={false}
            className={`size-24 rounded-lg ${p.stock <= 0 ? "opacity-60 grayscale" : ""}`}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/product/${p.id}`}
            className="line-clamp-2 text-sm font-semibold hover:underline"
          >
            {p.title}
          </Link>
          <p className="mt-1 font-bold text-emerald-800">{fmt(p.price)}</p>
          <div className="mt-1.5 flex gap-1.5">
            <StockChip p={p} />
          </div>
        </div>
      </div>
      <div className="mt-3">
        {editing ? (
          <div>
            <label htmlFor={"n" + pid} className="mb-1 block text-sm font-medium">
              Your note
            </label>
            <textarea
              id={"n" + pid}
              rows={2}
              value={v}
              onChange={(e) => setV(e.target.value)}
              aria-invalid={!!err}
              className={`w-full rounded-lg border p-3 text-sm ${err ? "border-red-600" : "border-slate-300"}`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={err ? "font-medium text-red-700" : "text-slate-600"}>
                {err || `${v.length}/120`}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                disabled={!!err}
                onClick={() => {
                  s.setNote(pid, v.trim());
                  setEditing(false);
                  s.toast("Note saved");
                }}
              >
                Save note
              </Button>
              <Button
                v="secondary"
                onClick={() => {
                  setV(note);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <p className={`flex-1 ${note ? "text-slate-800" : "text-slate-600"}`}>
              {note || "No note yet"}
            </p>
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit note for ${p.title}`}
              className="-m-1.5 flex size-11 items-center justify-center rounded-lg text-emerald-800 hover:bg-white"
            >
              <Icon n="edit" className="size-4" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          className="flex-1"
          disabled={p.stock <= 0}
          onClick={() => {
            if (s.addToCart(pid)) go("/cart");
          }}
        >
          {p.stock <= 0 ? "Out of stock" : "Add to cart"}
        </Button>
        <Button
          v="secondary"
          aria-label={`Remove ${p.title} from wishlist`}
          onClick={() => s.toggleWish(pid)}
        >
          <Icon n="trash" className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
