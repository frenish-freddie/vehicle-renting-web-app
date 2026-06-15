"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminUser } from "@/services/adminApi";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  FileImage,
  ExternalLink
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-amber-400/10 text-amber-400 border-amber-400/20",
  host:   "bg-blue-400/10 text-blue-400 border-blue-400/20",
  driver: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  guest:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi
      .getUsers(page, LIMIT, roleFilter || undefined)
      .then((r) => {
        setTotal(r.total);
        setUsers(r.users);
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApproval = async (userId: number, approve: boolean) => {
    setActionId(userId);
    try {
      if (approve) await adminApi.approveUser(userId);
      else await adminApi.rejectUser(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_host_approved: approve } : u
        )
      );
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const handleKycApproval = async (userId: number, approve: boolean) => {
    setActionId(userId);
    try {
      if (approve) await adminApi.approveUserKyc(userId);
      else await adminApi.rejectUserKyc(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                user_kyc_status: approve ? "approved" : "rejected",
                dl_verified: approve ? !!u.user_dl_url : false,
                aadhaar_verified: approve ? !!u.user_aadhaar_url : false,
              }
            : u
        )
      );
    } catch {
      setError("KYC action failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = (userId: number) => {
    setUserToDelete(userId);
  };

  const confirmDelete = async () => {
    if (userToDelete === null) return;
    setActionId(userToDelete);
    try {
      await adminApi.deleteUser(userToDelete);
      setUsers((prev) => prev.filter(u => u.id !== userToDelete));
      setTotal((t) => t - 1);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to delete user.");
    } finally {
      setActionId(null);
      setUserToDelete(null);
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
      {/* Delete Confirmation Modal */}
      {userToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete User</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to completely delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {total.toLocaleString()} registered accounts
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
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-white/5 rounded-xl px-3 h-10 text-sm text-slate-300 outline-none cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="guest">Guest</option>
          <option value="host">Host</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">
                  Phone
                </th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">
                  KYC
                </th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">
                  Host Status
                </th>
                <th className="text-right px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-600 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User info */}
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

                    {/* Role badge */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                          ROLE_COLORS[u.role] ?? ROLE_COLORS.guest
                        }`}
                      >
                        {u.role === "admin" && <Shield className="h-2.5 w-2.5" />}
                        {u.role}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">
                      {u.phone ?? "—"}
                    </td>

                    {/* KYC */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.user_dl_url ? (
                            <button
                              onClick={() => setPreviewUrl(`${API_BASE}${u.user_dl_url}`)}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 transition ${
                                u.dl_verified
                                  ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10"
                                  : "text-blue-400 border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10"
                              }`}
                            >
                              <FileImage className="w-2.5 h-2.5" /> DL
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase text-slate-600 border-slate-700 bg-slate-800">
                              No DL
                            </span>
                          )}
                          {u.user_aadhaar_url ? (
                            <button
                              onClick={() => setPreviewUrl(`${API_BASE}${u.user_aadhaar_url}`)}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 transition ${
                                u.aadhaar_verified
                                  ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10"
                                  : "text-purple-400 border-purple-400/20 bg-purple-400/5 hover:bg-purple-400/10"
                              }`}
                            >
                              <FileImage className="w-2.5 h-2.5" /> ID
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase text-slate-600 border-slate-700 bg-slate-800">
                              No ID
                            </span>
                          )}
                        </div>
                        {/* Status + Actions for KYC */}
                        {(u.user_dl_url || u.user_aadhaar_url) && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              u.user_kyc_status === "approved" ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" :
                              u.user_kyc_status === "pending" ? "text-amber-400 bg-amber-400/5 border-amber-400/20" :
                              u.user_kyc_status === "rejected" ? "text-red-400 bg-red-400/5 border-red-400/20" :
                              "text-slate-400 bg-slate-400/5 border-slate-400/20"
                            }`}>
                              {u.user_kyc_status}
                            </span>
                            {u.user_kyc_status !== "approved" && (
                              <button onClick={() => handleKycApproval(u.id, true)} className="text-[9px] text-emerald-400 hover:text-emerald-300">✓ Approve</button>
                            )}
                            {u.user_kyc_status !== "rejected" && (
                              <button onClick={() => handleKycApproval(u.id, false)} className="text-[9px] text-red-400 hover:text-red-300">✗ Reject</button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Host approval status */}
                    <td className="px-4 py-4">
                      {u.role === "host" ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            u.is_host_approved
                              ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20"
                              : "text-red-400 bg-red-400/5 border-red-400/20"
                          }`}
                        >
                          {u.is_host_approved ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <XCircle className="h-2.5 w-2.5" />
                          )}
                          {u.is_host_approved ? "Active" : "Suspended"}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-[10px]">N/A</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {actionId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400 ml-auto" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {u.role === "host" && (
                            u.is_host_approved ? (
                              <button
                                onClick={() => handleApproval(u.id, false)}
                                className="text-[10px] font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApproval(u.id, true)}
                                className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                              >
                                Reinstate
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-[10px] font-bold p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-[11px] text-slate-500">
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
