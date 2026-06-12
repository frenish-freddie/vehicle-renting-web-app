"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminTransaction } from "@/services/adminApi";
import {
  History,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
} from "lucide-react";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  success:  "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
  pending:  "text-amber-400 bg-amber-400/5 border-amber-400/20",
  failed:   "text-red-400 bg-red-400/5 border-red-400/20",
  refunded: "text-blue-400 bg-blue-400/5 border-blue-400/20",
};

export default function AdminHistory() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchHistory = useCallback(() => {
    setLoading(true);
    adminApi
      .getHistory(page, LIMIT)
      .then((r) => { setTotal(r.total); setTransactions(r.transactions); })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load transactions"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalPages = Math.ceil(total / LIMIT);
  const totalCommission = transactions.reduce((s, t) => s + (t.platform_commission ?? 0), 0);
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <History className="h-5 w-5 text-amber-400" />
          Transaction History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Global payment log · {total.toLocaleString()} records
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards for this page */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Page Commission
              </p>
              <p className="text-lg font-extrabold text-amber-400 leading-none mt-0.5">
                ₹{totalCommission.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Page Volume
              </p>
              <p className="text-lg font-extrabold text-white leading-none mt-0.5">
                ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Txn ID</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">User · Vehicle</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Commission</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="h-6 w-6 text-amber-400 animate-spin mx-auto" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-600 text-sm">No payment records found.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.payment_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-500">
                      <p>P#{t.payment_id}</p>
                      <p className="text-slate-700">B#{t.booking_id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{t.user_name}</p>
                      <p className="text-slate-500">{t.vehicle_name}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="uppercase text-slate-400 font-semibold tracking-wider">
                        {t.method}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-white">
                        ₹{t.amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-amber-400 font-bold hidden md:table-cell">
                      ₹{(t.platform_commission ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${PAYMENT_STATUS_COLORS[t.status] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 hidden lg:table-cell">
                      {fmtDate(t.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages} · {total} records</p>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition"><ChevronLeft className="h-3.5 w-3.5" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 transition"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
