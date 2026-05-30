"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LayoutDashboard, Car, Calendar, Compass, ShieldAlert, LogOut, User as UserIcon } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
    // Redirect to login if token is missing
    const t = localStorage.getItem("flexiride_token");
    if (!t) {
      router.push("/login");
    }
  }, [router, loadSession]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-primary-500">
        <span className="animate-pulse font-semibold">Validating credentials session...</span>
      </div>
    );
  }

  // Sidebar Links
  const menuItems = [
    { name: "Overview Analytics", path: `/dashboard/${user.role}`, icon: LayoutDashboard },
    { name: "My Bookings", path: "/bookings", icon: Calendar },
    { name: "Browse Fleet", path: "/vehicles", icon: Compass },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-full md:w-[260px] shrink-0 bg-white border border-neutral-200/50 rounded-3xl p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
          {/* User Meta */}
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-100 dark:border-neutral-850">
            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                {user.name}
              </h3>
              <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider mt-0.5 block">
                {user.role} Dashboard
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="space-y-1.5 flex flex-col">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-primary-500 text-white shadow-sm shadow-primary-500/10"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Session</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Pages */}
        <section className="flex-1 w-full bg-slate-50 dark:bg-transparent min-h-[500px]">
          {children}
        </section>
      </div>
    </div>
  );
}
