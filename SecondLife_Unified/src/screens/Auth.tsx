import { useState } from "react";
import { useStore, go } from "../store";
import { Alert, Button, Card, Icon, TextInput, Tabs } from "../ui";

export function Auth() {
  const s = useStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [f, setF] = useState({
    name: "",
    email: "aisyah.rahman@example.my",
    phone: "",
    pw: "secondlife1",
    pw2: "",
    terms: false,
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const set = (k: string, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email))
      er.email = "Enter a valid email address, for example name@example.my.";
    if (tab === "login") {
      if (!f.pw) er.pw = "Enter your password.";
    } else {
      if (f.name.trim().length < 2) er.name = "Enter your full name.";
      if (!/^(\+?60|0)1\d[- ]?\d{7,8}$/.test(f.phone.replace(/\s/g, "")))
        er.phone = "Enter a Malaysian mobile number, for example 012-345 6789.";
      if (f.pw.length < 8 || !/\d/.test(f.pw))
        er.pw = "Use at least 8 characters including a number.";
      if (f.pw2 !== f.pw) er.pw2 = "Passwords do not match.";
      if (!f.terms) er.terms = "Please accept the terms to continue.";
    }
    setErr(er);
    setFormErr("");
    if (Object.keys(er).length) return;
    if (tab === "login") {
      const m = s.login(f.email, f.pw);
      if (m) setFormErr(m);
      else {
        s.toast("Welcome back");
      }
    } else if (s.register(f.name, f.email, f.phone)) {
      s.toast("Demo account created. Use secondlife1 for subsequent demo sign-in.");
      go("/buyer/products");
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-8 px-4 py-8 @3xl:grid-cols-2 @3xl:py-16">
      <div className="@max-3xl:hidden">
        <span className="inline-flex items-center gap-2 text-xl font-extrabold text-emerald-800">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Icon n="tag" />
          </span>
          SecondLife
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900">
          Good things deserve a second life.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Buy preloved electronics, fashion and home goods from trusted Malaysian sellers. Make
          offers, track orders and pay securely.
        </p>
        <ul className="mt-6 space-y-3 text-slate-700">
          {[
            "Offers with clear expiry times",
            "One order per seller, paid independently",
            "Rate sellers after your order is complete",
          ].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Icon n="check" className="size-4" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Card className="p-5 @xl:p-8">
        <div className="mb-4 flex items-center gap-2 text-lg font-extrabold text-emerald-800 @3xl:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Icon n="tag" className="size-4" />
          </span>
          SecondLife
        </div>
        <Tabs
          tabs={[
            { id: "login", label: "Log in" },
            { id: "register", label: "Create account" },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t);
            setErr({});
            setFormErr("");
          }}
        />
        <form onSubmit={submit} noValidate className="space-y-4">
          {formErr && <Alert tone="error">{formErr}</Alert>}
          {tab === "register" && (
            <TextInput
              label="Full name"
              autoComplete="name"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              error={err.name}
              placeholder="Aisyah binti Rahman"
            />
          )}
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            error={err.email}
          />
          {tab === "register" && (
            <TextInput
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              error={err.phone}
              placeholder="012-345 6789"
              hint="Use fictitious details for this local prototype."
            />
          )}
          <TextInput
            label="Password"
            type="password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            value={f.pw}
            onChange={(e) => set("pw", e.target.value)}
            error={err.pw}
          />
          {tab === "register" && (
            <TextInput
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={f.pw2}
              onChange={(e) => set("pw2", e.target.value)}
              error={err.pw2}
            />
          )}
          {tab === "register" && (
            <div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-5 accent-emerald-700"
                  checked={f.terms}
                  onChange={(e) => set("terms", e.target.checked)}
                />
                I agree to the Terms of Use and Privacy Policy
              </label>
              {err.terms && <p className="mt-1 text-sm font-medium text-red-700">{err.terms}</p>}
            </div>
          )}
          <Button type="submit" className="w-full">
            {tab === "login" ? "Log in" : "Create account"}
          </Button>
          {tab === "login" && (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              All demo accounts use password secondlife1. Prototype sign-in is prefilled:
              aisyah.rahman@example.my / secondlife1. Nothing is sent to a server.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}

export function Deactivated() {
  const s = useStore();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-slate-200 text-slate-700">
        <Icon n="user" className="size-7" />
      </span>
      <h1 className="text-2xl font-bold">Your account is deactivated</h1>
      <p className="mt-2 text-slate-600">
        Your listings and wishlist are hidden. You can come back any time.
      </p>
      <Button className="mt-6" onClick={() => s.reactivate()}>
        Reactivate my account
      </Button>
    </div>
  );
}
