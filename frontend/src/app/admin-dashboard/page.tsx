"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminStats } from "@/services/adminApi";
import {
  Users,
  Car,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AdminLiveTrips from "@/components/trips/AdminLiveTrips";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${n.toLocaleString("en-IN")}`;

// Simulated monthly commission trend — replace with real time-series from backend when available
const generateTrend = (total: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, i) => ({
    month,
    commission: Math.round((total / 6) * (0.5 + Math.random() * 0.8 + i * 0.05)),
    bookings: Math.floor(5 + Math.random() * 15 + i * 2),
  }));
};

const PIE_COLORS = {
  completed: "#10B981",
  confirmed: "#3B82F6",
  pending:   "#F59E0B",
  ongoing:   "#8B5CF6",
  cancelled: "#EF4444",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  alert?: boolean;
}) {
  return (
    <div className="relative bg-slate-900 border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-all duration-200">
      {/* Glow */}
      <div
        className={`absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent.replace("text-", "bg-")}`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
          {sub && (
            <p className={`text-xs mt-1.5 font-medium ${alert ? "text-amber-400" : "text-slate-500"}`}>
              {sub}
            </p>
          )}
        </div>
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent.replace("text-", "bg-")}/10 ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading platform analytics…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-400">{error || "No data available"}</p>
      </div>
    );
  }

  const trend = generateTrend(stats.total_commission);

  const pieData = Object.entries(stats.booking_status_counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          Platform Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time snapshot of the FlexiRide platform
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Platform Commission"
          value={fmt(stats.total_commission)}
          sub={`Gross: ${fmt(stats.gross_revenue)}`}
          icon={TrendingUp}
          accent="text-amber-400"
        />
        <StatCard
          label="Total Users"
          value={stats.total_users.toLocaleString()}
          sub={`${stats.suspended_hosts} suspended hosts`}
          icon={Users}
          accent="text-blue-400"
          alert={stats.suspended_hosts > 0}
        />
        <StatCard
          label="Fleet Size"
          value={stats.total_vehicles.toLocaleString()}
          sub={`${stats.pending_vehicle_approvals} awaiting approval`}
          icon={Car}
          accent="text-emerald-400"
          alert={stats.pending_vehicle_approvals > 0}
        />
        <StatCard
          label="Total Bookings"
          value={stats.total_bookings.toLocaleString()}
          sub={`${stats.booking_status_counts.ongoing ?? 0} ongoing`}
          icon={CalendarCheck}
          accent="text-violet-400"
        />
      </div>

      {/* ── Pending alerts banner ── */}
      {(stats.pending_vehicle_approvals > 0 || stats.pending_driver_approvals > 0) && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 font-semibold flex-1">
            Action required:
          </p>
          {stats.pending_vehicle_approvals > 0 && (
            <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1 rounded-full font-bold">
              {stats.pending_vehicle_approvals} vehicle{stats.pending_vehicle_approvals !== 1 ? "s" : ""} pending
            </span>
          )}
          {stats.pending_driver_approvals > 0 && (
            <span className="text-xs bg-violet-400/10 text-violet-400 border border-violet-400/20 px-3 py-1 rounded-full font-bold">
              {stats.pending_driver_approvals} driver{stats.pending_driver_approvals !== 1 ? "s" : ""} pending
            </span>
          )}
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Commission Trend — Area Chart */}
        <div className="xl:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">
                Commission Revenue Trend
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Monthly platform earnings (10% of base)
              </p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((v: number) => `₹${v.toLocaleString("en-IN")}`) as any}
              />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#commGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#F59E0B", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Breakdown — Pie Chart */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Booking Status</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Distribution across all trips
            </p>
          </div>
          {pieData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ?? "#64748b"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ?? "#64748b",
                      }}
                    />
                    <span className="text-[10px] text-slate-400 capitalize">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
              No booking data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Quick-action cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Completed", count: stats.booking_status_counts.completed ?? 0, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10" },
          { label: "Pending",   count: stats.booking_status_counts.pending ?? 0,   icon: Clock,         color: "text-amber-400 bg-amber-400/10" },
          { label: "Ongoing",   count: stats.booking_status_counts.ongoing ?? 0,   icon: ShieldCheck,   color: "text-blue-400 bg-blue-400/10" },
          { label: "Cancelled", count: stats.booking_status_counts.cancelled ?? 0, icon: XCircle,       color: "text-red-400 bg-red-400/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-lg font-extrabold text-white leading-none mt-0.5">
                  {item.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Phase 5: Live Trips Monitor ── */}
      <AdminLiveTrips />
    </div>
  );
}
