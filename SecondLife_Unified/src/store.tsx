import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as E from "./domain";
import { SELLERS } from "./data";
import type { Address, Case, CartLine, Offer } from "./data";
export { fmt, fmtDate, countdown } from "./format";
export type DemoMode = "normal" | "loading" | "error";
export type User = { name: string; email: string; phone: string };
type Toast = { id: number; msg: string; kind: "success" | "error" | "info" };
const KEY = "secondlife-unified-v1";
function load() {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "null");
    if (x?.version === 1 && Array.isArray(x.accounts) && x.settings) return x as E.State;
  } catch {}
  return E.initial();
}
function useImpl() {
  const [data, setData] = useState(load);
  const ref = useRef(data);
  const [actor, setActor] = useState(() => sessionStorage.getItem("secondlife-actor") || "b1");
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState<DemoMode>("normal");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (msg: string, kind: Toast["kind"] = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };
  function commit<T>(fn: (s: E.State) => T): T {
    const next = structuredClone(ref.current);
    E.tick(next);
    const result = fn(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      toast("Browser storage is unavailable. Changes will last only for this session.", "error");
    }
    ref.current = next;
    setData(next);
    return result;
  }
  function action(fn: (s: E.State) => unknown, msg?: string) {
    try {
      commit(fn);
      if (msg) toast(msg);
      return true;
    } catch (e) {
      toast((e as Error).message, "error");
      return false;
    }
  }
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (
        ref.current.orders.some(
          (o) =>
            (o.status === "AWAITING_PAYMENT" && o.payDeadline <= t) ||
            (o.status === "PAID" && o.tracking === "SHIPPED" && (o.nextAdvanceAt ?? Infinity) <= t),
        )
      )
        commit((s) => E.tick(s, t));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("secondlife-actor", actor);
  }, [actor]);
  useEffect(() => {
    const read = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as E.State;
          if (next.version === 1) {
            ref.current = next;
            setData(next);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);
  const account = data.accounts.find((a) => a.id === actor);
  const buyer = () => {
    const a = ref.current.accounts.find((a) => a.id === actor);
    if (a?.role !== "BUYER" || a.status !== "ACTIVE")
      throw Error("An active buyer account is required.");
  };
  const product = (id: string) => {
    const p = data.products.find((p) => p.id === id);
    return p ? { ...p, stock: E.available(p) } : undefined!;
  };
  const offerStatus = (o: Offer) =>
    (o.status === "PENDING" || o.status === "ACCEPTED") && now >= o.expiresAt
      ? "EXPIRED"
      : o.status;
  const linePrice = (l: CartLine) => {
    const o = data.offers.find((o) => o.id === l.offerId);
    return o && offerStatus(o) === "ACCEPTED" && !o.usedBy
      ? (o.accepted ?? o.proposed)
      : product(l.productId).price;
  };
  const orders = data.orders.filter(
    (o) =>
      account?.role === "ADMIN" ||
      (account?.role === "SELLER" ? o.sellerId === actor : o.buyerId === actor),
  );
  return {
    data,
    account,
    actor,
    now,
    selected,
    setSelected,
    demoMode,
    setDemoMode,
    toasts,
    toast,
    action,
    commit,
    user: account ? { name: account.name, email: account.email, phone: account.phone } : null,
    deactivated: account?.status === "DEACTIVATED",
    products: data.products
      .map((p) => ({ ...p, stock: E.available(p) }))
      .filter(
        (p) => p.enabled && data.accounts.find((a) => a.id === p.sellerId)?.status === "ACTIVE",
      ),
    product,
    seller: (id: string) => {
      const base = SELLERS.find((s) => s.id === id) ?? {
        id,
        name: "Seller",
        city: "Malaysia",
        rating: 0,
        reviews: 0,
        sales: 0,
        positive: 0,
        response: "Not available",
        since: 2026,
      };
      const reviews = data.reviews.filter(
        (r) =>
          !r.removed &&
          data.orders.some((o) => o.id === r.orderId && o.sellerId === id && r.reviewerId !== id),
      );
      return {
        ...base,
        name: data.accounts.find((a) => a.id === id)?.name ?? base.name,
        rating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
        reviews: reviews.length,
        sales: data.orders.filter((o) => o.sellerId === id && o.status === "COMPLETED").length,
        positive: reviews.length
          ? Math.round((100 * reviews.filter((r) => r.rating >= 4).length) / reviews.length)
          : 0,
      };
    },
    addresses: data.addresses.filter((a) => a.userId === actor),
    notices: data.notices.filter((n) => n.recipientId === actor),
    wishlist: data.wishlist.filter((w) => w.userId === actor),
    cart: data.cart.filter((c) => c.buyerId === actor),
    offers: data.offers.filter((o) =>
      account?.role === "SELLER"
        ? data.products.find((p) => p.id === o.productId)?.sellerId === actor
        : o.buyerId === actor,
    ),
    orders,
    reviews: data.reviews.filter((r) => r.reviewerId === actor && !r.removed),
    cases: data.cases.filter(
      (c) =>
        account?.role === "ADMIN" ||
        c.reporterId === actor ||
        (account?.role === "SELLER" && c.sellerId === actor),
    ),
    offerStatus,
    linePrice,
    orderStatus: (o: E.Purchase) => (o.cancelReason === "PAYMENT_TIMEOUT" ? "EXPIRED" : o.status),
    isActiveOrder: (o: E.Purchase) => ["AWAITING_PAYMENT", "PAID"].includes(o.status),
    dismissToast: (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    switchActor: (id: string) => {
      const a = data.accounts.find((a) => a.id === id);
      if (!a) return;
      setActor(id);
      setSelected([]);
      go("/" + a.role.toLowerCase() + (a.role === "BUYER" ? "/products" : "/overview"));
    },
    reset: () => {
      const fresh = E.initial();
      ref.current = fresh;
      setData(fresh);
      try {
        localStorage.setItem(KEY, JSON.stringify(fresh));
      } catch {}
      setActor("b1");
      setSelected([]);
      setDemoMode("normal");
      go("/buyer/products");
    },
    login: (email: string, pw: string) => {
      const a = data.accounts.find((a) => a.email === email);
      if (!a || pw !== "secondlife1")
        return "Use a displayed demo account and password secondlife1.";
      if (a.status !== "ACTIVE") return "This account is restricted.";
      setActor(a.id);
      go("/" + a.role.toLowerCase() + (a.role === "BUYER" ? "/products" : "/overview"));
      return null;
    },
    register: (name: string, email: string, phone: string) =>
      action((s) => {
        if (s.accounts.some((a) => a.email === email.toLowerCase().trim()))
          throw Error("Email already exists.");
        const id = E.uid("buyer");
        s.accounts.push({
          id,
          name,
          email: email.toLowerCase().trim(),
          phone,
          role: "BUYER",
          status: "ACTIVE",
        });
        setActor(id);
      }),
    logout: () => setActor(""),
    reactivate: () => toast("Ask an administrator to restore this account.", "info"),
    deactivate: () =>
      action((s) => {
        buyer();
        if (
          s.orders.some(
            (o) => o.buyerId === actor && ["PAID", "AWAITING_PAYMENT"].includes(o.status),
          )
        )
          throw Error("Complete or cancel active transactions first.");
        s.accounts.find((a) => a.id === actor)!.status = "DEACTIVATED";
      }, "Account deactivated"),
    updateProfile: (p: User) =>
      action((s) => {
        const a = s.accounts.find((a) => a.id === actor)!;
        if (!p.name.trim() || !/^\S+@\S+\.\S+$/.test(p.email))
          throw Error("Enter a name and valid email.");
        if (s.accounts.some((u) => u.id !== actor && u.email === p.email.trim().toLowerCase()))
          throw Error("Email already exists.");
        Object.assign(a, p, { email: p.email.trim().toLowerCase() });
      }, "Profile updated"),
    saveAddress: (a: Address) =>
      action((s) => {
        buyer();
        const current = s.addresses.find((x) => x.id === a.id);
        if (current && current.userId !== actor) throw Error("Address access denied.");
        if (current) Object.assign(current, a);
        else s.addresses.push({ ...a, userId: actor });
        if (a.isDefault)
          s.addresses
            .filter((x) => x.userId === actor)
            .forEach((x) => (x.isDefault = x.id === a.id));
      }, "Address saved"),
    setDefaultAddress: (id: string) =>
      action((s) => {
        buyer();
        if (!s.addresses.some((a) => a.id === id && a.userId === actor))
          throw Error("Address not found.");
        s.addresses.filter((a) => a.userId === actor).forEach((a) => (a.isDefault = a.id === id));
      }),
    removeAddress: (id: string) =>
      action((s) => {
        buyer();
        s.addresses = s.addresses.filter((a) => a.id !== id || a.userId !== actor);
      }),
    markNotice: (id: string) =>
      action((s) => {
        const n = s.notices.find((n) => n.id === id && n.recipientId === actor);
        if (n) n.read = true;
      }),
    markAllNotices: () =>
      action((s) => {
        s.notices.filter((n) => n.recipientId === actor).forEach((n) => (n.read = true));
      }),
    toggleWish: (pid: string) =>
      action((s) => {
        buyer();
        const has = s.wishlist.some((w) => w.productId === pid && w.userId === actor);
        s.wishlist = has
          ? s.wishlist.filter((w) => w.productId !== pid || w.userId !== actor)
          : [...s.wishlist, { userId: actor, productId: pid, note: "" }];
      }, "Wishlist updated"),
    setNote: (pid: string, note: string) =>
      action((s) => {
        buyer();
        const w = s.wishlist.find((w) => w.productId === pid && w.userId === actor);
        if (w) w.note = note;
      }),
    addToCart: (pid: string, qty = 1, offerId?: string) =>
      action((s) => {
        buyer();
        const p = s.products.find((p) => p.id === pid)!;
        if (
          !Number.isInteger(qty) ||
          qty < 1 ||
          E.available(p) < qty ||
          s.accounts.find((a) => a.id === p.sellerId)?.status !== "ACTIVE"
        )
          throw Error("This quantity is unavailable.");
        const o = s.offers.find((o) => o.id === offerId);
        if (
          offerId &&
          (!o ||
            o.buyerId !== actor ||
            o.productId !== pid ||
            o.status !== "ACCEPTED" ||
            o.expiresAt <= Date.now() ||
            o.usedBy)
        )
          throw Error("Offer is not available.");
        const ex = s.cart.find((c) => c.productId === pid && c.buyerId === actor);
        if (ex)
          Object.assign(ex, {
            qty: Math.min(E.available(p), ex.qty + qty),
            status: "ACTIVE",
            offerId,
            unitPrice: o?.accepted ?? p.price,
            revision: E.uid("rev"),
          });
        else
          s.cart.push({
            id: E.uid("cart"),
            buyerId: actor,
            productId: pid,
            qty,
            unitPrice: o?.accepted ?? p.price,
            status: "ACTIVE",
            offerId,
            revision: E.uid("rev"),
          });
      }, "Cart updated"),
    setQty: (id: string, qty: number) =>
      action((s) => {
        buyer();
        const c = s.cart.find((c) => c.id === id && c.buyerId === actor);
        if (!c || !Number.isInteger(qty) || qty < 1) throw Error("Enter a positive quantity.");
        c.qty = qty;
        c.revision = E.uid("rev");
      }),
    refreshPrice: (id: string) =>
      action((s) => {
        buyer();
        const c = s.cart.find((c) => c.id === id && c.buyerId === actor);
        if (c) {
          c.unitPrice = linePrice(c);
          const o = s.offers.find((o) => o.id === c.offerId);
          if (o && (o.usedBy || o.expiresAt <= Date.now() || o.status !== "ACCEPTED"))
            c.offerId = undefined;
          c.revision = E.uid("rev");
        }
      }),
    removeLine: (id: string) =>
      action((s) => {
        buyer();
        s.cart = s.cart.filter((c) => c.id !== id || c.buyerId !== actor);
        setSelected((x) => x.filter((i) => i !== id));
      }),
    moveLine: (id: string, status: CartLine["status"]) =>
      action((s) => {
        buyer();
        const c = s.cart.find((c) => c.id === id && c.buyerId === actor);
        if (c) {
          c.status = status;
          c.revision = E.uid("rev");
        }
        setSelected((x) => x.filter((i) => i !== id));
      }),
    createOffer: (pid: string, price: number, note: string) =>
      action((s) => {
        buyer();
        const p = s.products.find((p) => p.id === pid)!;
        if (
          E.available(p) <= 0 ||
          !Number.isFinite(price) ||
          price <= 0 ||
          price < (p.price * p.minOfferPct) / 100 ||
          price > p.price
        )
          throw Error("Offer must be within the seller’s allowed price range.");
        s.offers.unshift({
          id: E.uid("offer"),
          buyerId: actor,
          productId: pid,
          proposed: E.amount(price),
          status: "PENDING",
          createdAt: Date.now(),
          expiresAt: Date.now() + s.settings.offerHours * 3600000,
          note,
        });
        E.notify(s, p.sellerId, "New offer", p.title);
      }, "Offer sent to seller"),
    withdrawOffer: (id: string) =>
      action((s) => {
        buyer();
        const o = s.offers.find((o) => o.id === id && o.buyerId === actor);
        if (
          !o ||
          o.usedBy ||
          !["PENDING", "ACCEPTED"].includes(o.status) ||
          o.expiresAt <= Date.now()
        )
          throw Error("Offer cannot be withdrawn.");
        o.status = "WITHDRAWN";
      }, "Offer withdrawn"),
    demoRespondOffer: (id: string, accept: boolean) =>
      action((s) => E.decide(s, actor, id, accept), "Offer updated"),
    demoStale: (_kind: string, _ids: string[]) =>
      toast("Change this listing in the Seller demo to test a stale checkout.", "info"),
    placeOrders: (ids: string[], address: string) => {
      try {
        const os = commit((s) => E.checkout(s, actor, ids, address));
        return { ok: true as const, orders: os };
      } catch (e) {
        return {
          ok: false as const,
          issues: [{ lineId: "", title: "Checkout", reason: (e as Error).message }],
        };
      }
    },
    payOrder: (id: string, success: boolean) => {
      try {
        return commit((s) => E.pay(s, actor, id, success));
      } catch (e) {
        return { ok: false, removed: 0, kept: 0, reason: (e as Error).message };
      }
    },
    cancelOrder: (id: string) =>
      action((s) => E.cancel(s, actor, id), "Order cancelled; reservation released"),
    demoShip: (id: string) =>
      action((s) => E.ship(s, actor, id, "Demo Courier", "DEMO-" + id), "Shipment recorded"),
    ship: (id: string, courier: string, tracking: string) =>
      action((s) => E.ship(s, actor, id, courier, tracking), "Shipment recorded"),
    confirmDelivery: (id: string) =>
      action((s) => E.confirm(s, actor, id, false), "Delivery confirmed"),
    confirmReceipt: (id: string) =>
      action((s) => E.confirm(s, actor, id, true), "Receipt confirmed; order completed"),
    saveReview: (orderId: string, productId: string, rating: number, text: string) =>
      action((s) => {
        const o = s.orders.find((o) => o.id === orderId);
        if (
          !o ||
          o.status !== "COMPLETED" ||
          ![o.buyerId, o.sellerId].includes(actor) ||
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5
        )
          throw Error("Review requires a completed order and a rating from 1 to 5.");
        const r = s.reviews.find((r) => r.orderId === orderId && r.reviewerId === actor);
        if (r) Object.assign(r, { rating, text, removed: false });
        else
          s.reviews.push({
            id: E.uid("review"),
            orderId,
            productId,
            reviewerId: actor,
            rating,
            text,
          });
      }, "Review saved"),
    removeReview: (orderId: string, _productId: string) =>
      action((s) => {
        const r = s.reviews.find((r) => r.orderId === orderId && r.reviewerId === actor);
        if (r) r.removed = true;
      }, "Review removed"),
    createCase: (c: Omit<Case, "id" | "status" | "createdAt">) =>
      action((s) => {
        buyer();
        const o = s.orders.find((o) => o.id === c.orderId && o.buyerId === actor);
        if (!o || !["PAID", "COMPLETED"].includes(o.status))
          throw Error("Choose a paid order you own.");
        s.cases.unshift({
          ...c,
          id: E.uid("case"),
          reporterId: actor,
          caseType: "ORDER_DISPUTE",
          status: "OPEN",
          createdAt: Date.now(),
        });
        E.notify(s, "admin", "New dispute", c.orderId);
      }, "Case submitted"),
    withdrawCase: (id: string) =>
      action((s) => {
        const c = s.cases.find((c) => c.id === id && c.reporterId === actor);
        if (!c || !["OPEN", "IN_REVIEW"].includes(c.status))
          throw Error("This case cannot be withdrawn.");
        c.status = "WITHDRAWN";
      }, "Case withdrawn"),
    moderate: (id: string, enabled: boolean) =>
      action((s) => E.moderate(s, actor, id, enabled), "Listing availability updated"),
    setAccountStatus: (id: string, status: E.Account["status"]) =>
      action((s) => E.accountStatus(s, actor, id, status), "Account updated"),
    resolve: (id: string, note: string, refund: number) =>
      action((s) => E.resolve(s, actor, id, note, refund), "Resolution saved"),
    executeRefund: (id: string) =>
      action((s) => E.refund(s, actor, id), "Simulated refund processed"),
    saveSettings: (settings: E.State["settings"]) =>
      action((s) => {
        if (account?.role !== "ADMIN") throw Error("Admin access required.");
        if (
          !Number.isInteger(settings.paymentMinutes) ||
          settings.paymentMinutes < 1 ||
          settings.paymentMinutes > 1440 ||
          !Number.isInteger(settings.offerHours) ||
          settings.offerHours < 1 ||
          settings.offerHours > 168 ||
          !Number.isInteger(settings.cooldownSeconds) ||
          settings.cooldownSeconds < 1 ||
          settings.cooldownSeconds > 86400
        )
          throw Error(
            "Use payment 1–1440 minutes, offer 1–168 hours and cooldown 1–86400 seconds.",
          );
        s.settings = settings;
      }, "Settings saved; existing deadlines are unchanged"),
    saveListing: (input: {
      id?: string;
      modelId: string;
      price: number;
      stock: number;
      minOfferPct: number;
      condition: string;
      desc: string;
      enabled: boolean;
    }) =>
      action((s) => {
        if (account?.role !== "SELLER" || account.status !== "ACTIVE")
          throw Error("Seller access required.");
        const model = s.models.find((m) => m.id === input.modelId);
        if (!model) throw Error("Choose a catalogue model.");
        if (
          !Number.isFinite(input.price) ||
          input.price <= 0 ||
          !Number.isInteger(input.stock) ||
          input.stock < 0 ||
          !Number.isFinite(input.minOfferPct) ||
          input.minOfferPct <= 0 ||
          input.minOfferPct > 100
        )
          throw Error("Check price, stock and minimum offer percentage.");
        const p = s.products.find((p) => p.id === input.id);
        if (p) {
          if (p.sellerId !== actor) throw Error("Listing access denied.");
          if (input.stock < p.reserved) throw Error("Stock cannot fall below reserved quantity.");
          if (input.enabled && !p.enabled) throw Error("Ask Admin to restore a disabled listing.");
          Object.assign(p, input, {
            title: model.name,
            category: model.category,
            price: E.amount(input.price),
          });
        } else
          s.products.push({
            ...input,
            id: E.uid("product"),
            title: model.name,
            category: model.category,
            condition: input.condition as "Good",
            price: E.amount(input.price),
            sellerId: actor,
            reserved: 0,
            hue: 160,
          });
      }, "Listing saved"),
    saveCategory: (name: string, old?: string) =>
      action((s) => {
        if (account?.role !== "ADMIN") throw Error("Admin access required.");
        name = name.trim();
        if (
          !name ||
          name.length > 100 ||
          s.categories.some((c) => c !== old && c.toLowerCase() === name.toLowerCase())
        )
          throw Error("Enter a unique category name (up to 100 characters).");
        if (old) {
          s.categories = s.categories.map((c) => (c === old ? name : c));
          s.models.filter((m) => m.category === old).forEach((m) => (m.category = name));
          s.products.filter((p) => p.category === old).forEach((p) => (p.category = name));
        } else s.categories.push(name);
      }, "Category saved"),
    deleteCategory: (name: string) =>
      action((s) => {
        if (account?.role !== "ADMIN") throw Error("Admin access required.");
        if (s.models.some((m) => m.category === name))
          throw Error("This category is referenced by a product model.");
        s.categories = s.categories.filter((c) => c !== name);
      }, "Category removed"),
  };
}
type Store = ReturnType<typeof useImpl>;
const Ctx = createContext<Store>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useImpl()}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
export function useRoute() {
  const get = () => (location.pathname === "/" ? "/buyer/products" : location.pathname);
  const [r, setR] = useState(get);
  useEffect(() => {
    const f = () => {
      setR(get());
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", f);
    return () => window.removeEventListener("popstate", f);
  }, []);
  return r;
}
export function go(path: string) {
  const target = /^\/(buyer|seller|admin)(\/|$)/.test(path) ? path : "/buyer" + path;
  history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export type Issue = { lineId: string; title: string; reason: string };
