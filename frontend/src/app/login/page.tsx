"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Mail, Lock, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const loginStore = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (loginStore.token && loginStore.user) {
      router.replace(`/dashboard/${loginStore.user.role}`);
    }
  }, [loginStore.token, loginStore.user, router]);

  const handleGoogleLogin = async (googleEmail: string, googlePassword: string) => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/auth/login", { 
        email: googleEmail, 
        password: googlePassword 
      });
      const { access_token } = response.data;
      
      loginStore.login(access_token);
      
      setTimeout(() => {
        const decodedUser = useAuthStore.getState().user;
        setIsGoogleLoading(false);
        setShowGoogleModal(false);
        if (decodedUser) {
          const dest = decodedUser.role === "admin"
            ? "/admin-dashboard"
            : `/dashboard/${decodedUser.role}`;
          router.replace(dest);
        } else {
          router.replace("/");
        }
      }, 1000);
    } catch (err: any) {
      setIsGoogleLoading(false);
      setShowGoogleModal(false);
      setError("Failed to sign in with Google account.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { access_token } = response.data;
      
      // Save token & refresh Zustand state
      loginStore.login(access_token);
      
      // Dynamic Redirect based on decoded role
      const decodedUser = useAuthStore.getState().user;
      if (decodedUser) {
        const dest = decodedUser.role === "admin"
          ? "/admin-dashboard"
          : `/dashboard/${decodedUser.role}`;
        router.replace(dest);
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      let errMessage = "Incorrect email or password. Please try again.";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errMessage = err.response.data.detail[0].msg;
        } else {
          errMessage = err.response.data.detail;
        }
      }
      setError(errMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/20 py-12 px-4 sm:px-6 lg:px-8 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/20">
      {/* Background blurs */}
      <div className="absolute left-1/4 top-1/4 h-[250px] w-[250px] rounded-full bg-primary-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-neutral-200/50 rounded-3xl p-8 shadow-2xl relative z-10 dark:bg-neutral-900 dark:border-neutral-800/80">
        <div className="text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
            Welcome to FlexiRide
          </h2>
          <p className="text-xs text-neutral-500 mt-1.5 dark:text-neutral-400">
            Sign in to access your custom role dashboard panel.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 bg-red-50 border border-red-200/50 px-4 py-3 rounded-xl text-xs text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/50 h-11 px-3.5 rounded-xl focus-within:border-primary-500 focus-within:bg-white transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:focus-within:bg-neutral-900">
              <Mail className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
              <input
                type="email"
                required
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <span className="text-[10px] text-neutral-400 hover:text-primary-500 cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/50 h-11 px-3.5 rounded-xl focus-within:border-primary-500 focus-within:bg-white transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:focus-within:bg-neutral-900">
              <Lock className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-neutral-400">Quick Fill:</span>
            {[
              { role: "Admin", email: "admin@flexiride.com", pass: "admin123" },
              { role: "Host", email: "host@flexiride.com", pass: "host123" },
              { role: "Driver", email: "driver@flexiride.com", pass: "driver123" },
            ].map((u) => (
              <button 
                key={u.role} 
                type="button" 
                onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                className="text-[10px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-2.5 py-1 rounded-md transition font-semibold"
              >
                {u.role}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 transition dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-500/10"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="relative mt-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative bg-white dark:bg-neutral-900 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Or continue with
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="mt-6 w-full h-11 bg-white border border-neutral-200/50 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:hover:bg-neutral-700 dark:text-neutral-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          New to FlexiRide?{" "}
          <Link href="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Custom Google Account Chooser Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex gap-0.5 text-xl font-bold tracking-tight mb-2">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Choose an account
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                to continue to <span className="font-semibold text-primary-500">FlexiRide</span>
              </p>
            </div>

            {isGoogleLoading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Authenticating...</p>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {[
                  { name: "Jane Guest", email: "jane@example.com", pass: "guest123", role: "Renter", initial: "J", color: "bg-purple-500" },
                  { name: "John Host", email: "host@flexiride.com", pass: "host123", role: "Host / Owner", initial: "J", color: "bg-blue-500" },
                  { name: "Mike Driver", email: "driver@flexiride.com", pass: "driver123", role: "Driver", initial: "M", color: "bg-emerald-500" },
                  { name: "Admin User", email: "admin@flexiride.com", pass: "admin123", role: "Administrator", initial: "A", color: "bg-red-500" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleGoogleLogin(acc.email, acc.pass)}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-800/80 transition"
                  >
                    <div className={`h-8 w-8 rounded-full ${acc.color} text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0`}>
                      {acc.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{acc.name}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{acc.email}</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0 uppercase tracking-wider">
                      {acc.role.split(' ')[0]}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="w-full mt-4 h-10 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
