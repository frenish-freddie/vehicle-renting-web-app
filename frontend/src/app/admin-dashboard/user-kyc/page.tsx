"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminUserKyc } from "@/services/adminApi";
import {
  ShieldCheck, Search, CheckCircle2, XCircle, Loader2,
  AlertCircle, ChevronLeft, ChevronRight, Filter,
  FileImage, ExternalLink, Clock, AlertTriangle,
} from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  approved: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
  pending:  "text-amber-400 bg-amber-400/5 border-amber-400/20",
  rejected: "text-red-400 bg-red-400/5 border-red-400/20",
  unsubmitted: "text-slate-400 bg-slate-400/5 border-slate-400/20",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  approved:    <CheckCircle2 className="h-2.5 w-2.5" />,
  pending:     <Clock className="h-2.5 w-2.5" />,
  rejected:    <XCircle className="h-2.5 w-2.5" />,
  unsubmitted: <AlertTriangle className="h-2.5 w-2.5" />,
};

const API_BASE = "http://localhost:8000";

export default function AdminUserKycPage() {
  const [users, setUsers] = useState<AdminUserKyc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi
      .getUserKyc(page, LIMIT, statusFilter || undefined)
      .then((r) => { setTotal(r.total); setUsers(r.users); })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load user KYC data"))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: number, approve: boolean) => {
    setActionId(userId);
    try {
      if (approve) await adminApi.approveUserKyc(userId);
      else await adminApi.rejectUserKyc(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, user_kyc_status: approve ? "approved" : "rejected" }
            : u
        )
      );
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Document Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-white">Document Preview</p>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-white transition text-xl leading-none">&times;</button>
            </div>
            {previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[500px] rounded-xl" />
            ) : (
              <img src={previewUrl} alt="doc" className="w-full max-h-[500px] object-contain rounded-xl" />
            )}
            <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-xs text-blue-400 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </a>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            User KYC Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {total.toLocaleString()} registered user{total !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Stats pills */}
        <div className="hidden md:flex gap-2">
          {["pending", "approved", "rejected", "unsubmitted"].map((s) => {
            const count = users.filter((u) => u.user_kyc_status === s).length;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === statusFilter ? "" : s); setPage(1); }}
                className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase transition ${statusFilter === s ? STATUS_STYLE[s] + " ring-1 ring-current" : STATUS_STYLE[s]}`}
              >
                {s} {count > 0 && `· ${count}`}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
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
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm text-slate-300 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="unsubmitted">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Documents</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">KYC Status</th>
                <th className="text-right px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="h-6 w-6 text-blue-400 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">No users found matching your criteria.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-slate-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">
                      {u.phone ?? "—"}
                    </td>

                    {/* Documents */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-2">
                        {u.user_dl_url ? (
                          <button onClick={() => setPreviewUrl(`${API_BASE}${u.user_dl_url}`)} className="flex items-center gap-2 text-[11px] font-bold text-slate-300 hover:text-white transition group">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition"><FileImage className="h-3.5 w-3.5 text-blue-400" /></div>
                            View DL
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 text-[11px] text-slate-600"><div className="h-6 w-6 rounded bg-slate-800/50 flex items-center justify-center"><AlertCircle className="h-3 w-3" /></div>No DL</span>
                        )}
                        {u.user_aadhaar_url ? (
                          <button onClick={() => setPreviewUrl(`${API_BASE}${u.user_aadhaar_url}`)} className="flex items-center gap-2 text-[11px] font-bold text-slate-300 hover:text-white transition group">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition"><FileImage className="h-3.5 w-3.5 text-purple-400" /></div>
                            View Aadhaar
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 text-[11px] text-slate-600"><div className="h-6 w-6 rounded bg-slate-800/50 flex items-center justify-center"><AlertCircle className="h-3 w-3" /></div>No Aadhaar</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[u.user_kyc_status] ?? STATUS_STYLE.unsubmitted}`}>
                        {STATUS_ICON[u.user_kyc_status]}
                        {u.user_kyc_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {actionId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400 ml-auto" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {u.user_kyc_status !== "approved" && u.user_kyc_status !== "unsubmitted" && (
                            <button onClick={() => handleAction(u.id, true)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </button>
                          )}
                          {u.user_kyc_status !== "rejected" && u.user_kyc_status !== "unsubmitted" && (
                            <button onClick={() => handleAction(u.id, false)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages} · {total} hosts</p>
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
