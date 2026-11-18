import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import type { Product } from "./data";
import { useStore, go } from "./store";

const P: Record<string, string> = {
  menu: "M4 6h16M4 12h16M4 18h16",
  leaf: "M20 4C10 2 3 6 4 14c1 6 9 7 13 2 3-4 3-8 3-12zM4 21L15 9",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4",
  heart: "M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z",
  cart: "M3 4h2l2 11h11l2-8H6M9 20h.01M17 20h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  box: "M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0 8 4m0 0 8-4m-8 4v10",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.500 8h.01",
  star: "M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9L12 3z",
  check: "M5 12.500l4.500 4.500L19 7",
  x: "M6 6l12 12M18 6L6 18",
  alert: "M12 4l9 16H3L12 4zm0 6v4m0 3h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-10v5m0-8h.01",
  truck:
    "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3zm10 0a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3z",
  chevR: "M9 6l6 6-6 6",
  chevL: "M15 6l-6 6 6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2",
  shield: "M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6l8-3zm-3 9l2 2 4-4",
  flag: "M5 21V4m0 0h12l-2 4 2 4H5",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13",
  pin: "M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  bell: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zm4 10a2 2 0 0 0 4 0",
  edit: "M4 20l4-1 11-11-3-3L5 16l-1 4z",
  home: "M4 11l8-7 8 7v9H4z",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",
};
export function Icon({
  n,
  className = "size-5",
  fill,
}: {
  n: keyof typeof P | string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={P[n]} />
    </svg>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  v?: "primary" | "secondary" | "danger" | "ghost";
  sm?: boolean;
};
const bv = {
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-600",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-200 disabled:text-slate-600",
  ghost: "text-emerald-800 hover:bg-emerald-50 disabled:text-slate-500",
};
export const btnCls = (v: keyof typeof bv = "primary") =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${bv[v]}`;
export function Button({ v = "primary", className = "", ...p }: BtnProps) {
  return <button type="button" {...p} className={`${btnCls(v)} ${className}`} />;
}
export function Link({
  to,
  className = "",
  children,
  ...r
}: {
  to: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <a
      href={
        to.startsWith("/buyer") || to.startsWith("/seller") || to.startsWith("/admin")
          ? to
          : "/buyer" + to
      }
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          go(to);
        }
      }}
      className={className}
      {...r}
    >
      {children}
    </a>
  );
}
export function LinkButton({
  to,
  v = "primary",
  className = "",
  children,
}: {
  to: string;
  v?: keyof typeof bv;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={
        to.startsWith("/buyer") || to.startsWith("/seller") || to.startsWith("/admin")
          ? to
          : "/buyer" + to
      }
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          go(to);
        }
      }}
      className={`${btnCls(v)} ${className}`}
    >
      {children}
    </a>
  );
}

const tones = {
  green: "bg-emerald-100 text-emerald-900",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
  gray: "bg-slate-100 text-slate-800",
  blue: "bg-sky-100 text-sky-900",
};
export type Tone = keyof typeof tones;
export function Chip({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
export const Card = ({ className = "", children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

export function PageTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 @3xl:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-600">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Img({
  p,
  className = "",
  label = true,
}: {
  p: Pick<Product, "hue" | "category" | "title">;
  className?: string;
  label?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Photo placeholder for ${p.title}`}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${p.hue} 55% 90%), hsl(${(p.hue + 40) % 360} 45% 78%))`,
        color: `hsl(${p.hue} 40% 28%)`,
      }}
    >
      <Icon n="image" className="size-1/4 opacity-70" />
      {label && (
        <span className="absolute bottom-1.5 left-2 text-[10px] font-medium opacity-80">
          Photo placeholder
        </span>
      )}
    </div>
  );
}

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          n="star"
          className={`${size} ${i <= Math.round(value) ? "" : "text-slate-300"}`}
          fill
        />
      ))}
    </span>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  id,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (p: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    className: string;
  }) => ReactNode;
  id?: string;
}) {
  const g = useId();
  const fid = id ?? g;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </label>
      {children({
        id: fid,
        "aria-invalid": !!error,
        "aria-describedby": error || hint ? fid + "-d" : undefined,
        className: `block min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 ${error ? "border-red-600 ring-1 ring-red-600" : "border-slate-300"}`,
      })}
      {(error || hint) && (
        <p
          id={fid + "-d"}
          className={`mt-1.5 text-sm ${error ? "font-medium text-red-700" : "text-slate-600"}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
export function TextInput({
  label,
  error,
  hint,
  ...r
}: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => <input {...p} {...r} className={p.className} />}
    </Field>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "success" | "warn" | "error";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const t = {
    info: "border-sky-200 bg-sky-50 text-sky-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warn: "border-amber-300 bg-amber-50 text-amber-950",
    error: "border-red-300 bg-red-50 text-red-950",
  }[tone];
  const ic = { info: "info", success: "check", warn: "alert", error: "alert" }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-xl border p-4 text-sm ${t}`}
    >
      <Icon n={ic} className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-1" : ""}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Empty({
  icon = "box",
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon n={icon} className="size-7" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Skeleton({ rows = 4, grid }: { rows?: number; grid?: boolean }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={
        grid ? "grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-4 @3xl:gap-5" : "space-y-3"
      }
    >
      {Array.from({ length: rows }).map((_, i) =>
        grid ? (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3">
            <div className="aspect-square rounded-lg bg-slate-200" />
            <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
          </div>
        ) : (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
          </div>
        ),
      )}
    </div>
  );
}

/** Shows loading / error states when the prototype data-state switch is used. */
export function DataGate({
  children,
  grid,
  rows,
}: {
  children: ReactNode;
  grid?: boolean;
  rows?: number;
}) {
  const { demoMode, setDemoMode } = useStore();
  if (demoMode === "loading") return <Skeleton grid={grid} rows={rows ?? (grid ? 8 : 4)} />;
  if (demoMode === "error")
    return (
      <Alert
        tone="error"
        title="We could not load this page"
        action={
          <Button v="secondary" onClick={() => setDemoMode("normal")}>
            Try again
          </Button>
        }
      >
        Please check your connection and try again.
      </Alert>
    );
  return <>{children}</>;
}

export function Modal({
  title,
  children,
  onClose,
  actions,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("keydown", k);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 @xl:items-center @xl:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl @xl:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="-m-2 flex size-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Icon n="x" />
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-700">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 @xl:flex-row @xl:justify-end">
          {actions}
        </div>
      </div>
    </div>
  );
}

export function Confirm({
  title,
  text,
  confirm,
  cancel = "Keep it",
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  text: ReactNode;
  confirm: string;
  cancel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button v="secondary" onClick={onClose}>
            {cancel}
          </Button>
          <Button
            v={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirm}
          </Button>
        </>
      }
    >
      {text}
    </Modal>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === "error" ? "bg-red-700" : t.kind === "info" ? "bg-slate-800" : "bg-emerald-800"}`}
        >
          <Icon
            n={t.kind === "error" ? "alert" : t.kind === "info" ? "info" : "check"}
            className="size-5 shrink-0"
          />
          <span className="flex-1">{t.msg}</span>
          <button
            aria-label="Dismiss"
            onClick={() => dismissToast(t.id)}
            className="-m-2 flex size-11 items-center justify-center"
          >
            <Icon n="x" className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg ring-1 ring-inset ring-slate-300"
      role="group"
      aria-label="Quantity"
    >
      <button
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className="size-11 rounded-l-lg text-lg font-semibold hover:bg-slate-50 disabled:text-slate-400"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className="size-11 rounded-r-lg text-lg font-semibold hover:bg-slate-50 disabled:text-slate-400"
      >
        +
      </button>
    </div>
  );
}
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-semibold ${value === t.id ? "bg-white text-emerald-800 shadow-sm" : "text-slate-700 hover:text-slate-900"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
