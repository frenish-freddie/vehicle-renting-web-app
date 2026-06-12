"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Booking } from "@/types";
import { Calendar, MapPin, Gauge, AlertCircle, Info, Loader2, ArrowRight, XCircle, BadgeCheck, Clock } from "lucide-react";

const STATUS_BADGES: { [key: string]: { text: string; css: string } } = {
  pending: { text: "Pending Pay", css: "bg-yellow-50 border-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400" },
  confirmed: { text: "Confirmed", css: "bg-green-50 border-green-100 text-green-600 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400" },
  active: { text: "Active Trip", css: "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400" },
  completed: { text: "Completed", css: "bg-neutral-50 border-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:border-neutral-700/50 dark:text-neutral-300" },
  cancelled: { text: "Cancelled", css: "bg-red-50 border-red-100 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400" },
};

export default function MyBookings() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadBookings() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/bookings/user");
        setBookings(response.data);
      } catch (err: any) {
        setError("Failed to fetch bookings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [token, router]);

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await api.put(`/api/bookings/${id}`, {
        booking_status: "cancelled"
      });
      
      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, booking_status: "cancelled" } : b))
      );
      alert("Booking cancelled successfully.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not cancel booking.");
    }
  };

  // Phase 1: Pay remaining 70% balance after trip
  const [payingBalanceId, setPayingBalanceId] = useState<number | null>(null);
  const handlePayBalance = async (id: number) => {
    if (!window.confirm("Pay the remaining 70% balance for this booking?")) return;
    setPayingBalanceId(id);
    try {
      await api.post(`/api/bookings/${id}/pay-balance`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, balance_payment_status: "paid" } : b
        )
      );
      alert("Balance payment successful! Your booking is now fully paid.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Balance payment failed. Please try again.");
    } finally {
      setPayingBalanceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-primary-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
          My Rental Bookings
        </h1>
        <span className="text-xs text-neutral-400 font-medium">
          Total Bookings: {bookings.length}
        </span>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200/50 rounded-2xl p-6 text-center text-sm text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-12 text-center text-neutral-500 dark:bg-neutral-900 dark:border-neutral-800/80 dark:text-neutral-400">
          <Info className="h-8 w-8 text-primary-500 mx-auto mb-3" />
          <p className="font-semibold text-neutral-850 dark:text-neutral-200">No bookings recorded yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Browse available fleet listings to secure your first booking.</p>
          <button
            onClick={() => router.push("/vehicles")}
            className="mt-6 bg-primary-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-600 shadow-sm transition dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Find Vehicles
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const badge = STATUS_BADGES[booking.booking_status] || { text: booking.booking_status, css: "bg-slate-100 dark:bg-neutral-800 dark:text-neutral-200" };
            return (
              <div
                key={booking.id}
                className="bg-white border border-neutral-200/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 dark:bg-neutral-900 dark:border-neutral-800/80"
              >
                {/* Details */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.css}`}>
                      {badge.text}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Booking ID: #{booking.id}
                    </span>
                  </div>

                  {/* Phase 1: Partial Payment Status pill */}
                  {booking.balance_payment_status === "paid" ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Fully Paid
                    </div>
                  ) : booking.balance_payment_status === "pending" && booking.remaining_amount ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      30% Paid — Balance ₹{booking.remaining_amount} pending
                    </div>
                  ) : null}

                  <h3 className="font-bold text-neutral-900 dark:text-white text-base sm:text-lg">
                    {booking.vehicle?.vehicle_name || "Vehicle Rental Transaction"}
                  </h3>

                  {/* Route points */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{booking.pickup_location}</span>
                    </div>
                    <ArrowRight className="hidden sm:inline h-3 w-3 text-neutral-300 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{booking.drop_location}</span>
                    </div>
                  </div>

                  {/* Date & Distance Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-bold">Start Date</span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-200">
                        {new Date(booking.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-bold">End Date</span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-200">
                        {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-bold">Distance</span>
                      <span className="font-semibold text-neutral-600 dark:text-neutral-200">
                        {booking.estimated_distance} KM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price and Action Controls */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-neutral-100 dark:border-neutral-850 pt-4 md:pt-0 md:pl-6 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Price Paid</span>
                    <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                      ₹{booking.total_price}
                    </span>
                  </div>

                  {/* Cancel Action */}
                  {booking.booking_status === "confirmed" && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="flex items-center gap-1 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 text-xs font-semibold px-4 h-9 rounded-lg border border-red-200/50 dark:border-red-900/30 transition shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancel Ride</span>
                    </button>
                  )}

                  {/* Phase 1: Pay Balance button — completed trip with pending balance */}
                  {booking.booking_status === "completed" &&
                    booking.balance_payment_status === "pending" &&
                    booking.remaining_amount ? (
                    <button
                      onClick={() => handlePayBalance(booking.id)}
                      disabled={payingBalanceId === booking.id}
                      className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/30 text-xs font-semibold px-4 h-9 rounded-lg border border-amber-200/50 dark:border-amber-900/30 transition shrink-0"
                    >
                      {payingBalanceId === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                      <span>Pay Remaining ₹{booking.remaining_amount}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
