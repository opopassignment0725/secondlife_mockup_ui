import { useState } from "react";
import { StoreProvider, useStore, useRoute, go } from "./store";
import { Button, Icon, Link, Toasts, Confirm, Empty } from "./ui";
import { BuyerScreen } from "./BuyerScreen";
import { Workplace } from "./Workspaces";
import { Auth } from "./screens/Auth";
const NAV = {
  buyer: [
    ["products", "Shop", "home"],
    ["wishlist", "Wishlist", "heart"],
    ["cart", "Cart", "cart"],
    ["offers", "Offers", "tag"],
    ["orders", "Orders", "box"],
    ["reviews", "Reviews", "star"],
    ["cases", "Cases", "flag"],
    ["profile", "Account", "user"],
  ],
  seller: [
    ["overview", "Overview", "home"],
    ["listings", "My listings", "tag"],
    ["offers", "Incoming offers", "tag"],
    ["orders", "Orders", "box"],
    ["delivery", "Delivery", "truck"],
    ["cases", "Cases", "flag"],
    ["notifications", "Notifications", "bell"],
  ],
  admin: [
    ["overview", "Overview", "home"],
    ["users", "Users", "user"],
    ["listings", "Listings", "tag"],
    ["categories", "Categories", "box"],
    ["orders", "Orders & payments", "cart"],
    ["delivery", "Delivery", "truck"],
    ["cases", "Reports & disputes", "flag"],
    ["settings", "Settings", "shield"],
    ["notifications", "Notifications", "bell"],
  ],
};
function Shell() {
  const s = useStore();
  const route = useRoute();
  const [reset, setReset] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [, role = "buyer", page = "products"] = route.split("/");
  const valid = role === "buyer" || role === "seller" || role === "admin";
  const nav = valid ? NAV[role] : [];
  const allowed =
    valid &&
    s.account?.role.toLowerCase() === role &&
    (role === "buyer" || nav.some((n) => n[0] === page));
  const restricted = s.account && s.account.status !== "ACTIVE";
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4"
      >
        Skip to content
      </a>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2 text-white sm:px-6">
        <span className="text-xs font-medium text-slate-300">
          Connected prototype · simulated payments & tracking
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            Demo account
            <select
              className="min-h-10 max-w-[220px] rounded-lg border border-slate-600 bg-slate-800 px-2 text-sm"
              value={s.actor}
              onChange={(e) => {
                s.switchActor(e.target.value);
                setMobile(false);
              }}
            >
              <option value="" disabled>
                Select an account
              </option>
              {s.data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.role} · {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            State
            <select
              aria-label="Preview data state"
              value={s.demoMode}
              onChange={(e) => s.setDemoMode(e.target.value as "normal")}
              className="min-h-10 rounded-lg bg-slate-800 px-2"
            >
              <option value="normal">Normal</option>
              <option value="loading">Loading</option>
              <option value="error">Error</option>
            </select>
          </label>
          <button
            onClick={() => setReset(true)}
            className="min-h-10 rounded-lg px-3 text-xs text-slate-200 hover:bg-slate-800"
          >
            Reset demo
          </button>
        </div>
      </div>
      <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <Icon n="menu" />
          </button>
          <Link
            to={"/" + (valid ? role : "buyer") + (role === "buyer" ? "/products" : "/overview")}
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-emerald-800"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-white">
              <Icon n="leaf" />
            </span>
            SecondLife
          </Link>
          <span className="hidden border-l border-slate-200 pl-3 text-sm capitalize text-slate-500 sm:block">
            {role} workplace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs text-slate-500 sm:block">
            {s.account?.name}
            <span className="block mt-1 font-semibold text-emerald-800">{s.account?.role}</span>
          </span>
          <button
            aria-label="View notifications"
            onClick={() => go("/" + role + (role === "buyer" ? "/profile" : "/notifications"))}
            className="relative grid size-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Icon n="bell" />
            {s.notices.some((n) => !n.read) && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-600" />
            )}
          </button>
          <div className="grid size-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
            {s.account?.name[0] ?? "?"}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={
            (mobile ? "block " : "hidden ") +
            "fixed bottom-0 top-[122px] z-20 w-64 overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl lg:sticky lg:top-18 lg:block lg:h-[calc(100vh-4.5rem)] lg:shrink-0 lg:shadow-none"
          }
        >
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
            Your workplace
          </p>
          <nav aria-label="Workplace navigation" className="space-y-1">
            {nav.map(([path, label, icon]) => (
              <a
                key={path}
                href={"/" + role + "/" + path}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    go("/" + role + "/" + path);
                    setMobile(false);
                  }
                }}
                aria-current={path === page ? "page" : undefined}
                className={
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold " +
                  (path === page
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-slate-600 hover:bg-slate-50")
                }
              >
                <Icon n={icon} />
                {label}
                {path === "cart" && s.cart.length > 0 && (
                  <span className="ml-auto rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                    {s.cart.length}
                  </span>
                )}
              </a>
            ))}
          </nav>
          <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <Icon n="leaf" className="mb-2 size-6 text-emerald-700" />
            <p className="text-sm font-semibold text-emerald-900">
              Give good things a second life.
            </p>
            <p className="mt-2 text-xs leading-5 text-emerald-800">
              A connected pre-loved marketplace for Malaysia.
            </p>
          </div>
        </aside>
        <main
          id="main"
          tabIndex={-1}
          className="@container min-w-0 flex-1 p-4 outline-none sm:p-6 xl:p-8"
        >
          {!valid ? (
            <Empty title="Page not found" text="Choose a demo account to enter its workplace." />
          ) : !s.account ? (
            <Auth />
          ) : restricted ? (
            <Empty
              title="Account restricted"
              text={
                "This account is " +
                s.account.status.toLowerCase() +
                ". An administrator must review it before it can trade."
              }
            />
          ) : !allowed ? (
            <Empty
              title="Access denied"
              text="This account cannot access the selected workplace."
              action={
                <Button onClick={() => s.switchActor(s.actor)}>Return to my workplace</Button>
              }
            />
          ) : role === "buyer" ? (
            <BuyerScreen key={s.actor} route={"/" + route.split("/").slice(2).join("/")} />
          ) : (
            <Workplace key={s.actor + page} page={page} />
          )}
        </main>
      </div>
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        SecondLife · Academic interaction prototype · Local browser data
      </footer>
      <Toasts />
      {reset && (
        <Confirm
          title="Reset this demo?"
          text="This clears only the unified prototype's local changes and restores the sample marketplace."
          confirm="Reset demo"
          onConfirm={s.reset}
          onClose={() => setReset(false)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
