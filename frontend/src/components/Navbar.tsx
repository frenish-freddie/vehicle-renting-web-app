"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sun, Moon, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loadSession } = useAuthStore();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    loadSession();
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, [loadSession]);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/50 bg-white/70 backdrop-blur-md dark:border-neutral-800/50 dark:bg-neutral-900/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Flexi<span className="text-primary-500 dark:text-blue-500">Ride</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <Link
              href="/vehicles"
              className={`transition hover:text-primary-500 ${
                pathname === "/vehicles" ? "text-primary-500 font-semibold" : ""
              }`}
            >
              Browse Vehicles
            </Link>
            {user && (
              <>
                <Link
                  href="/bookings"
                  className={`transition hover:text-primary-500 ${
                    pathname === "/bookings" ? "text-primary-500 font-semibold" : ""
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  href={`/dashboard/${user.role}`}
                  className={`transition hover:text-primary-500 ${
                    pathname.startsWith("/dashboard") ? "text-primary-500 font-semibold" : ""
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Dark Mode */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* Session controls */}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-neutral-800 flex items-center justify-center text-primary-600 dark:text-blue-400 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 leading-none">
                    {user.name}
                  </p>
                  <p className="text-neutral-500 capitalize leading-none mt-1">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20 px-3 h-9 rounded-lg border border-red-200/50 dark:border-red-900/30 transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-4 py-2 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
