import { useState, useEffect, type ReactNode } from "react";
import { Button, Icon } from "./ui";
const Btn = Button;
const cx = (...x: (string | false | undefined)[]) => x.filter(Boolean).join(" ");
export interface Col<T> {
  header: string;
  render: (r: T) => ReactNode;
  className?: string;
}

export function useFakeLoad(dep: unknown, ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [dep]);
  return loading;
}

export function DataTable<T extends { id: string }>({
  rows,
  cols,
  onOpen,
  loading,
  pageSize = 8,
  emptyTitle,
  emptyHint,
  resetKey,
}: {
  rows: T[];
  cols: Col<T>[];
  onOpen?: (r: T) => void;
  loading?: boolean;
  pageSize?: number;
  emptyTitle: string;
  emptyHint?: string;
  resetKey?: string;
}) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * pageSize, cur * pageSize);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {cols.map((c) => (
                <th
                  key={c.header}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {c.header}
                </th>
              ))}
              {onOpen && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100" aria-busy={loading}>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: cols.length + (onOpen ? 1 : 0) }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              slice.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onOpen?.(r)}
                  className={cx("hover:bg-emerald-50/40", onOpen && "cursor-pointer")}
                >
                  {cols.map((c) => (
                    <td
                      key={c.header}
                      className={cx("px-4 py-3 align-middle text-slate-700", c.className)}
                    >
                      {c.render(r)}
                    </td>
                  ))}
                  {onOpen && (
                    <td className="px-4 py-3 text-right">
                      <Btn
                        v="ghost"
                        className="!py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(r);
                        }}
                      >
                        Inspect
                      </Btn>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (
        <div className="px-6 py-14 text-center">
          <div
            className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500"
            aria-hidden
          >
            <Icon n="box" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
          {emptyHint && <p className="mt-1 text-sm text-slate-600">{emptyHint}</p>}
        </div>
      )}
      <nav
        aria-label="Pagination"
        className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700"
      >
        <p>
          {loading
            ? "Loading…"
            : rows.length === 0
              ? "0 results"
              : `Showing ${(cur - 1) * pageSize + 1}–${Math.min(cur * pageSize, rows.length)} of ${rows.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Btn disabled={cur <= 1} onClick={() => setPage(cur - 1)}>
            Previous
          </Btn>
          <span aria-current="page" className="px-2 text-slate-600">
            Page {cur} of {pages}
          </span>
          <Btn disabled={cur >= pages} onClick={() => setPage(cur + 1)}>
            Next
          </Btn>
        </div>
      </nav>
    </div>
  );
}
