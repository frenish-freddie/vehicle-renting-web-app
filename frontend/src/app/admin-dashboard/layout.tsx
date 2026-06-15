"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Users,
  Car,
  UserCheck,
  History,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldCheck,
  ChevronRight,
  Bell,
  Settings,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin-dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Users",
    href: "/admin-dashboard/users",
    icon: Users,
    exact: false,
  },
  {
    label: "Vehicles",
    href: "/admin-dashboard/vehicles",
    icon: Car,
    exact: false,
  },
  {
    label: "Drivers",
    href: "/admin-dashboard/drivers",
    icon: UserCheck,
    exact: false,
  },
  {
    label: "Bookings",
    href: "/admin-dashboard/bookings",
    icon: CalendarCheck,
    exact: false,
  },
  {
    label: "Transactions",
    href: "/admin-dashboard/history",
    icon: History,
    exact: false,
  },
  {
    label: "Host KYC",
    href: "/admin-dashboard/host-kyc",
    icon: ShieldCheck,
    exact: false,
  },
  {
    label: "User KYC",
    href: "/admin-dashboard/user-kyc",
    icon: UserCheck,
    exact: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, loadSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadSession();
    const t = localStorage.getItem("flexiride_token");
    if (!t) {
      router.replace("/login");
    }
  }, [router, loadSession]);

  // Route guard: only admin role allowed
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F1923]">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-10 w-10 text-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-slate-300 tracking-wide">
            Verifying admin credentials…
          </span>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") return null;

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Mobile overlay ─────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[#0F1923] border-r border-white/5
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-[72px]"}
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo / Brand */}
        <div
          className={`flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0 ${
            !sidebarOpen && "justify-center px-0"
          }`}
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-extrabold text-white leading-none tracking-tight">
                FlexiRide
              </p>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mt-0.5">
                Admin Console
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  group flex items-center gap-3 rounded-xl transition-all duration-150
                  ${sidebarOpen ? "px-3 py-2.5" : "justify-center p-2.5"}
                  ${
                    active
                      ? "bg-amber-400/10 text-amber-400 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${
                    active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                {sidebarOpen && (
                  <>
                    <span className="text-xs font-semibold flex-1">{item.label}</span>
                    {active && (
                      <ChevronRight className="h-3 w-3 text-amber-400/60" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="shrink-0 border-t border-white/5 p-3 space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                {user.role === 'admin' ? 'J' : user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.role === 'admin' ? 'JARVIS' : user.name}
                </p>
                <p className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-wider">
                  Super Admin
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150
              ${sidebarOpen ? "px-3 py-2.5" : "justify-center p-2.5"}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300
          ${sidebarOpen ? "md:ml-64" : "md:ml-[72px]"}
        `}
      >
        {/* Top Navbar */}
        <header className="h-16 shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 gap-4 sticky top-0 z-30">
          {/* Sidebar toggle */}
          <button
            onClick={() => {
              setSidebarOpen((v) => !v);
              setMobileSidebarOpen((v) => !v);
            }}
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
            aria-label="Toggle sidebar"
          >
            {mobileSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold capitalize">
              {pathname === "/admin-dashboard"
                ? "Overview"
                : pathname.split("/").pop()?.replace("-", " ") ?? ""}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Live badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>

            {/* Notification bell */}
            <button className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
            </button>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-amber-500/20">
              {user.role === 'admin' ? 'J' : user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
