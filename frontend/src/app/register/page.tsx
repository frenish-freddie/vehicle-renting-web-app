"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { User, Lock, Mail, Phone, UserPlus, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type UserRole = "guest" | "host" | "driver";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("guest");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loginStore = useAuthStore();

  useEffect(() => {
    if (loginStore.token && loginStore.user) {
      router.replace(`/dashboard/${loginStore.user.role}`);
    }
  }, [loginStore.token, loginStore.user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError("Please fill out all input fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        phone_number: phone,
        role: role,
      });

      setSuccess("Account created successfully! Redirecting you to login portal...");
      
      // Redirect after short pause
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      let errMessage = "An unexpected error occurred. Please try again.";
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
      {/* Visual background elements */}
      <div className="absolute right-1/4 top-1/4 h-[250px] w-[250px] rounded-full bg-primary-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute left-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Card Wrapper */}
      <div className="w-full max-w-lg bg-white border border-neutral-200/50 rounded-3xl p-8 shadow-2xl relative z-10 dark:bg-neutral-900 dark:border-neutral-800/80">
        <div className="text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 mb-4">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
            Create an Account
          </h2>
          <p className="text-xs text-neutral-500 mt-1.5 dark:text-neutral-400">
            Join the FlexiRide ecosystem today.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 bg-red-50 border border-red-200/50 px-4 py-3 rounded-xl text-xs text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-6 flex items-start gap-2.5 bg-green-50 border border-green-200/50 px-4 py-3 rounded-xl text-xs text-green-600 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Identity role selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Select Your Role Profile
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setRole("guest")}
                className={`border-2 p-4 rounded-2xl cursor-pointer transition-all ${role === 'guest' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-800'}`}
              >
                <User className={`h-6 w-6 mb-2 ${role === 'guest' ? 'text-primary-600' : 'text-neutral-400'}`} />
                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Renter</h4>
                <p className="text-xs text-neutral-500">I want to rent vehicles for my trips.</p>
              </div>
              
              <div 
                onClick={() => setRole("host")}
                className={`border-2 p-4 rounded-2xl cursor-pointer transition-all ${role === 'host' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-800'}`}
              >
                <UserPlus className={`h-6 w-6 mb-2 ${role === 'host' ? 'text-primary-600' : 'text-neutral-400'}`} />
                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Host</h4>
                <p className="text-xs text-neutral-500">I want to list my vehicle for rent.</p>
              </div>
              
              <div 
                onClick={() => setRole("driver")}
                className={`border-2 p-4 rounded-2xl cursor-pointer transition-all ${role === 'driver' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-800'}`}
              >
                <UserPlus className={`h-6 w-6 mb-2 ${role === 'driver' ? 'text-primary-600' : 'text-neutral-400'}`} />
                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Driver</h4>
                <p className="text-xs text-neutral-500">I am a professional driver.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Full Name
              </label>
              <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/50 h-11 px-3.5 rounded-xl focus-within:border-primary-500 focus-within:bg-white transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:focus-within:bg-neutral-900">
                <User className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Rahul Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Phone Number
              </label>
              <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/50 h-11 px-3.5 rounded-xl focus-within:border-primary-500 focus-within:bg-white transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:focus-within:bg-neutral-900">
                <Phone className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                <input
                  type="tel"
                  required
                  placeholder="+91 90000 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white"
                />
              </div>
            </div>
          </div>

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
                placeholder="developer@flexiride.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Create Password
            </label>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/50 h-11 px-3.5 rounded-xl focus-within:border-primary-500 focus-within:bg-white transition dark:bg-neutral-800 dark:border-neutral-700/80 dark:focus-within:bg-neutral-900">
              <Lock className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 focus:ring-0 dark:text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>Create Account</span>
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
          onClick={() => {
            // Mock google sign up just redirects to login for now
            router.push("/login");
          }}
          className="mt-6 w-full h-11 bg-white border border-neutral-200/50 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition dark:bg-neutral-850 dark:border-neutral-700/80 dark:hover:bg-neutral-800 dark:text-neutral-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </button>

        <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
            Sign In Here
          </Link>
        </div>

        {/* Dummy Credentials UI */}
        <div className="mt-8 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/80">
          <p className="text-[10px] text-center font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Quick Fill (Test Registration)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setRole("guest"); setName("Test Customer"); setEmail("testcustomer@gmail.com"); setPhone("+91 88888 99999"); setPassword("password123"); }}
              className="h-10 rounded-xl text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/50 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700/80 dark:hover:bg-neutral-750 transition"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setRole("host"); setName("Test Owner"); setEmail("testowner@gmail.com"); setPhone("+91 77777 66666"); setPassword("password123"); }}
              className="h-10 rounded-xl text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/50 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700/80 dark:hover:bg-neutral-750 transition"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => { setRole("driver"); setName("Test Driver"); setEmail("testdriver@gmail.com"); setPhone("+91 66666 55555"); setPassword("password123"); }}
              className="h-10 rounded-xl text-xs font-semibold bg-neutral-50 text-neutral-600 border border-neutral-200/50 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700/80 dark:hover:bg-neutral-750 transition"
            >
              Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
