"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Menu, X, Bell, User, Sun, Moon } from "lucide-react";

export default function HeroNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("light");
  const { user, logout, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    // Theme initialization
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadSession]);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 flex flex-col">
      {/* 1. Main Navbar */}
      <div 
        className={`bg-brand-card transition-all duration-300 ${
          scrolled ? "shadow-[0_2px_8px_rgba(0,0,0,0.06)]" : ""
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
          
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-4">
            <button
              className="p-1 text-brand-text hover:text-brand-green transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-sans font-extrabold text-brand-green tracking-tight">
                FlexiRide
              </span>
            </Link>
          </div>

          {/* Right: Nav Links & Auth & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link href="#how-it-works" className="text-sm font-semibold text-brand-text hover:text-brand-green transition-colors">
                How to book?
              </Link>
              <Link href="/register" className="text-sm font-semibold text-brand-text hover:text-brand-green transition-colors">
                Become a Host
              </Link>
              <Link href="/about" className="text-sm font-semibold text-brand-text hover:text-brand-green transition-colors">
                Company Profile
              </Link>
              <Link href="#app" className="text-sm font-semibold text-brand-text hover:text-brand-green transition-colors flex items-center gap-1">
                <Bell className="w-4 h-4" /> Get the App
              </Link>
            </nav>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-brand-bg transition-colors flex items-center justify-center ml-2 border border-brand-border"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-brand-text" /> : <Moon className="w-4 h-4 text-brand-text" />}
            </button>

            <div className="flex items-center gap-4 ml-2">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href={`/dashboard/${user.role}`} className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm font-bold text-brand-muted hover:text-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-bold bg-brand-green text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-colors shadow-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-brand-card border-t border-brand-border shadow-lg absolute top-20 left-0 w-full z-40">
            <div className="flex flex-col p-4 space-y-2">
              <Link href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-brand-text p-3 hover:bg-brand-bg rounded-lg">
                How to book?
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-brand-text p-3 hover:bg-brand-bg rounded-lg">
                Become a Host
              </Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-brand-text p-3 hover:bg-brand-bg rounded-lg">
                Company Profile
              </Link>
              <Link href="#app" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-brand-text p-3 hover:bg-brand-bg rounded-lg flex items-center gap-2">
                <Bell className="w-4 h-4" /> Get the App
              </Link>
              
              <button 
                onClick={toggleTheme} 
                className="text-sm font-bold text-brand-text p-3 hover:bg-brand-bg rounded-lg flex items-center gap-2"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              <div className="h-px bg-brand-border my-2" />
              
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href={`/dashboard/${user.role}`} onClick={() => setMobileOpen(false)} className="text-sm font-bold text-brand-green p-3 hover:bg-brand-bg rounded-lg">
                    My Account
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm font-bold text-red-500 p-3 hover:bg-red-50 rounded-lg text-left">
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-bold text-center bg-brand-green text-white p-3 rounded-full mt-2">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Marquee Ticker Banner */}
      <div className="w-full bg-brand-green overflow-hidden relative h-8 flex items-center">
        <div className="whitespace-nowrap flex animate-marquee text-white text-[13px] font-semibold tracking-wide">
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
          <span className="mx-4">🌟 Get upto 30% OFF this summer valid till 27th May | Use Code SAVE30</span>
        </div>
      </div>
    </header>
  );
}
