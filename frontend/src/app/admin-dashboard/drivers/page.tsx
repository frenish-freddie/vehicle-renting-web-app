"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminDriver } from "@/services/adminApi";
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  Filter,
  FileImage,
} from "lucide-react";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [approvedFilter, setApprovedFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchDrivers = useCallback(() => {
    setLoading(true);
    const approved =
      approvedFilter === "approved"
        ? true
        : approvedFilter === "pending"
        ? false
        : undefined;
    adminApi
      .getDrivers(page, LIMIT, approved)
      .then((r) => { setTotal(r.total); setDrivers(r.drivers); })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load drivers"))
      .finally(() => setLoading(false));
  }, [page, approvedFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleApproval = async (driverId: number, approve: boolean) => {
    setActionId(driverId);
    try {
      if (approve) await adminApi.approveDriver(driverId);
      else await adminApi.rejectDriver(driverId);
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, is_approved: approve } : d))
      );
    } catch {
      setError("Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const filtered = search
    ? drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.user_email.toLowerCase().includes(search.toLowerCase())
      )
    : drivers;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-violet-400" />
            Driver Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {total.toLocaleString()} registered driver profiles
          </p>
        </div>
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
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-600 w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 h-10">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={approvedFilter}
            onChange={(e) => { setApprovedFilter(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm text-slate-300 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Driver</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">Experience</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Daily Rate</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Verifications</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="h-6 w-6 text-amber-400 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">No driver profiles found.</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Driver info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{d.name}</p>
                          <p className="text-slate-500">{d.user_email}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                            <span className="text-amber-400 font-semibold">{d.rating_avg.toFixed(1)}</span>
                            <span className="text-slate-600">· {d.total_trips} trips</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">
                      <span className="font-semibold text-white">{d.experience_years}</span>{" "}
                      yrs
                    </td>

                    {/* Daily rate */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="font-bold text-white">₹{d.daily_rate.toLocaleString("en-IN")}</span>
                      <span className="text-slate-600">/day</span>
                    </td>

                    {/* Verifications */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${d.is_police_verified ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-slate-600 border-slate-700 bg-slate-800"}`}>
                          Police
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${d.is_medically_fit ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-slate-600 border-slate-700 bg-slate-800"}`}>
                          Medical
                        </span>
                        {d.license_url && (
                          <a 
                            href={`http://localhost:8000${d.license_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase text-blue-400 border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10 transition flex items-center gap-1"
                          >
                            <FileImage className="w-2.5 h-2.5" /> License
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Approval status */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        d.verification_status === "approved" ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" : 
                        d.verification_status === "pending" ? "text-amber-400 bg-amber-400/5 border-amber-400/20" :
                        d.verification_status === "rejected" ? "text-red-400 bg-red-400/5 border-red-400/20" :
                        "text-slate-400 bg-slate-400/5 border-slate-400/20"
                      }`}>
                        {d.verification_status === "approved" ? <CheckCircle2 className="h-2.5 w-2.5" /> : 
                         d.verification_status === "pending" ? <AlertCircle className="h-2.5 w-2.5" /> :
                         <XCircle className="h-2.5 w-2.5" />}
                        {d.verification_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {actionId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400 ml-auto" />
                      ) : d.verification_status === "approved" ? (
                        <button onClick={() => handleApproval(d.id, false)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
                          Revoke
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleApproval(d.id, true)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                            Approve
                          </button>
                          <button onClick={() => handleApproval(d.id, false)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages} · {total} drivers</p>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
