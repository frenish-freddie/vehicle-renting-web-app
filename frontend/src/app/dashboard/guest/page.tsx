"use client";

import { useAuthStore } from "@/store/authStore";
import { CreditCard, CalendarDays, Compass, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
  const { dashboardStats, isLoading } = useAuthStore();

  if (isLoading || !dashboardStats) {
    return (
      <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 h-[250px] animate-pulse flex flex-col justify-between dark:bg-neutral-900 dark:border-neutral-800">
        <div className="h-6 bg-slate-100 rounded w-1/4 dark:bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="h-16 bg-slate-100 rounded-xl dark:bg-neutral-800" />
          <div className="h-16 bg-slate-100 rounded-xl dark:bg-neutral-800" />
          <div className="h-16 bg-slate-100 rounded-xl dark:bg-neutral-800" />
        </div>
        <div className="h-12 bg-slate-100 rounded-xl dark:bg-neutral-800 mt-6" />
      </div>
    );
  }

  const { total_bookings, active_bookings, total_spent, recent_bookings } = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Stats Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Money spent */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Spent</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              ₹{total_spent}
            </span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Rides</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {total_bookings}
            </span>
          </div>
        </div>

        {/* Active bookings */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Active Bookings</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {active_bookings}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Trips Table List */}
      <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
        <h2 className="text-base font-extrabold text-neutral-950 dark:text-white mb-6">Recent Bookings</h2>
        
        {recent_bookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400">
            <Compass className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p>No trip booking transactions found.</p>
            <Link href="/vehicles" className="text-primary-500 font-bold hover:underline mt-2 inline-block">
              Browse Vehicles
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
            {recent_bookings.map((booking: any) => (
              <div key={booking.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">{booking.vehicle?.vehicle_name || "Vehicle rental"}</h4>
                  <div className="flex items-center gap-1.5 text-neutral-400 mt-1">
                    <span>{booking.pickup_address?.split(",")[0] || "Pickup"}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{booking.delivery_address?.split(",")[0] || "Delivery"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-neutral-950 dark:text-white">₹{booking.total_amount}</span>
                  <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
