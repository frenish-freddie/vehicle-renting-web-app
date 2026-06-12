"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminBooking } from "@/services/adminApi";
import {
  CalendarCheck,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
  confirmed: "text-blue-400 bg-blue-400/5 border-blue-400/20",
  pending:   "text-amber-400 bg-amber-400/5 border-amber-400/20",
  ongoing:   "text-violet-400 bg-violet-400/5 border-violet-400/20",
  cancelled: "text-red-400 bg-red-400/5 border-red-400/20",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchBookings = useCallback(() => {
    setLoading(true);
    adminApi
      .getBookings(page, LIMIT, statusFilter || undefined)
      .then((r) => { setTotal(r.total); setBookings(r.bookings); })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = search
    ? bookings.filter(
        (b) =>
          b.user_name.toLowerCase().includes(search.toLowerCase()) ||
          b.vehicle_name.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const totalPages = Math.ceil(total / LIMIT);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-blue-400" />
          All Bookings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {total.toLocaleString()} total platform bookings
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 h-10 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search user or vehicle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-600 w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 h-10">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm text-slate-300 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">Dates</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Amount</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Commission</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="h-6 w-6 text-amber-400 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-600 text-sm">No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-500">#{b.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{b.user_name}</p>
                      <p className="text-slate-600">{b.user_email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{b.vehicle_name}</p>
                      <p className="text-slate-600 capitalize">{b.vehicle_category.replace("_", " ")}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">
                      {fmtDate(b.from_dt)} → {fmtDate(b.to_dt)}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="font-bold text-white">₹{b.total_amount.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-4 py-4 text-amber-400 font-bold hidden lg:table-cell">
                      ₹{b.commission_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_COLORS[b.status] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages} · {total} bookings</p>
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
