"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminVehicle } from "@/services/adminApi";
import {
  Car,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileImage,
  ExternalLink,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const toDocUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

const CATEGORY_COLORS: Record<string, string> = {
  car:         "bg-blue-400/10 text-blue-400 border-blue-400/20",
  two_wheeler: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  commercial:  "bg-amber-400/10 text-amber-400 border-amber-400/20",
  machinery:   "bg-red-400/10 text-red-400 border-red-400/20",
  special:     "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
};

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [approvedFilter, setApprovedFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [vehicleToReject, setVehicleToReject] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchVehicles = useCallback(() => {
    setLoading(true);
    const approved =
      approvedFilter === "approved"
        ? true
        : approvedFilter === "pending"
        ? false
        : undefined;
    adminApi
      .getVehicles(page, LIMIT, approved)
      .then((r) => { setTotal(r.total); setVehicles(r.vehicles); })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load vehicles"))
      .finally(() => setLoading(false));
  }, [page, approvedFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleApproval = async (vehicleId: number, approve: boolean) => {
    if (!approve) {
      setVehicleToReject(vehicleId);
      return;
    }
    setActionId(vehicleId);
    try {
      await adminApi.approveVehicle(vehicleId);
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, is_approved: true } : v))
      );
    } catch {
      setError("Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const confirmRejection = async () => {
    if (vehicleToReject === null) return;
    setActionId(vehicleToReject);
    try {
      await adminApi.rejectVehicle(vehicleToReject);
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleToReject ? { ...v, is_approved: false } : v))
      );
    } catch {
      setError("Action failed.");
    } finally {
      setActionId(null);
      setVehicleToReject(null);
    }
  };

  const filtered = search
    ? vehicles.filter(
        (v) =>
          `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
          v.registration_no.toLowerCase().includes(search.toLowerCase()) ||
          v.host_name.toLowerCase().includes(search.toLowerCase())
      )
    : vehicles;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Rejection Confirmation Modal */}
      {vehicleToReject !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reject Vehicle</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to reject this vehicle listing? It will no longer be visible to customers.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setVehicleToReject(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRejection}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow transition"
              >
                Reject
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Car className="h-5 w-5 text-emerald-400" />
            Vehicle Listings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {total.toLocaleString()} vehicles across all hosts
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
            placeholder="Search vehicle, reg. no, host…"
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
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Photo</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden sm:table-cell">Host</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden xl:table-cell">Documents</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Daily Rate</th>
                <th className="text-left px-4 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-slate-500 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="h-6 w-6 text-amber-400 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">No vehicles found.</td></tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-white">
                          {v.brand} {v.model}{" "}
                          <span className="text-slate-500 font-normal">({v.year})</span>
                        </p>
                        <p className="text-slate-500 mt-0.5 font-mono">{v.registration_no}</p>
                      </div>
                    </td>
                    {/* Vehicle photo thumbnail */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {v.images ? (
                        <img
                          src={v.images.startsWith('http') ? v.images : (v.images.startsWith('/static/') ? `http://localhost:8000${v.images}` : v.images)}
                          alt={`${v.brand} ${v.model}`}
                          className="h-11 w-16 object-cover rounded-lg border border-white/10 bg-slate-800"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-11 w-16 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                          <span className="text-[9px] text-slate-600">No photo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${CATEGORY_COLORS[v.category] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                        {v.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">
                      <p className="font-semibold text-slate-300">{v.host_name}</p>
                      <p className="text-slate-600">{v.host_email}</p>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <div className="flex flex-col gap-1.5">
                        {v.rc_url ? (
                          <button
                            onClick={() => setPreviewUrl(toDocUrl(v.rc_url))}
                            className="text-[9px] font-bold px-2 py-1 rounded border uppercase text-emerald-400 border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 transition flex items-center gap-1 w-max"
                          >
                            <FileImage className="w-2.5 h-2.5" /> View RC
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-1 rounded border uppercase text-red-400 border-red-400/20 bg-red-400/5 w-max">No RC ⚠</span>
                        )}
                        {v.insurance_url ? (
                          <button
                            onClick={() => setPreviewUrl(toDocUrl(v.insurance_url))}
                            className="text-[9px] font-bold px-2 py-1 rounded border uppercase text-blue-400 border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10 transition flex items-center gap-1 w-max"
                          >
                            <FileImage className="w-2.5 h-2.5" /> Insur
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-1 rounded border uppercase text-slate-600 border-slate-700 bg-slate-800 w-max">No Insur</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="font-bold text-white">₹{v.price_daily.toLocaleString("en-IN")}</span>
                      <span className="text-slate-600">/day</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${v.is_approved ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" : "text-amber-400 bg-amber-400/5 border-amber-400/20"}`}>
                        {v.is_approved ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                        {v.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {actionId === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400 ml-auto" />
                      ) : v.is_approved ? (
                        <button onClick={() => handleApproval(v.id, false)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
                          Reject
                        </button>
                      ) : (
                        <button onClick={() => handleApproval(v.id, true)} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                          Approve
                        </button>
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
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages} · {total} vehicles</p>
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
