"use client";

import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Users, Truck, CalendarCheck, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { dashboardStats, isLoading } = useAuthStore();

  if (isLoading || !dashboardStats) {
    return (
      <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 h-[250px] animate-pulse flex flex-col justify-between dark:bg-neutral-900 dark:border-neutral-800">
        <div className="h-6 bg-slate-100 rounded w-1/4 dark:bg-neutral-800" />
        <div className="h-12 bg-slate-100 rounded-xl dark:bg-neutral-800 mt-6" />
      </div>
    );
  }

  const { total_users, total_vehicles, total_bookings, platform_earnings, recent_users, recent_bookings } = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Stats summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Platform cut */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Net Commissions</span>
            <span className="text-lg font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              ₹{platform_earnings}
            </span>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Users</span>
            <span className="text-lg font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {total_users} Users
            </span>
          </div>
        </div>

        {/* Fleet listing */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Fleet Size</span>
            <span className="text-lg font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {total_vehicles} Listings
            </span>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Trips</span>
            <span className="text-lg font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {total_bookings} Bookings
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users list */}
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-4">Newly Registered Accounts</h3>
          {recent_users.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No user profiles found.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {recent_users.map((usr: any) => (
                <div key={usr.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                      {usr.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-850 dark:text-white">{usr.name}</h4>
                      <p className="text-neutral-400 mt-0.5">{usr.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-neutral-800 border px-2 py-0.5 rounded text-neutral-500">
                    {usr.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Transactions tracker */}
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-4">Latest Platform Bookings</h3>
          {recent_bookings.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No trip transactions recorded.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {recent_bookings.map((booking: any) => (
                <div key={booking.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4">
                  <div>
                    <h4 className="font-bold text-neutral-850 dark:text-white capitalize">{booking.vehicle?.vehicle_name || "Rental"}</h4>
                    <div className="flex items-center gap-1.5 text-neutral-400 mt-0.5">
                      <span>{booking.pickup_location.split(",")[0]}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{booking.drop_location.split(",")[0]}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-900 dark:text-white">₹{booking.total_price}</span>
                    <span className="block text-[9px] font-bold uppercase text-primary-500 mt-0.5">{booking.booking_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
