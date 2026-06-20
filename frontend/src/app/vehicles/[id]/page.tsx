"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Vehicle } from "@/types";
import DynamicMap from "@/components/DynamicMap";
import { Calendar, User2, Fuel, MapPin, Gauge, Star, AlertTriangle, ShieldCheck, Heart, Loader2 } from "lucide-react";

const STATIONS = [
  "Peenya, Bangalore",
  "Koramangala, Bangalore",
  "Indiranagar, Bangalore",
  "Whitefield, Bangalore",
  "Yeshwanthpur, Bangalore",
  "Bandra, Mumbai",
  "Andheri West, Mumbai",
  "Thane, Mumbai",
  "Connaught Place, Delhi",
];

export default function VehicleDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();

  const todayString = new Date().toISOString().split("T")[0];

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking fields state variables
  const [pickup, setPickup] = useState("Koramangala, Bangalore");
  const [drop, setDrop] = useState("Whitefield, Bangalore");
  const [distance, setDistance] = useState(15);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverIncluded, setDriverIncluded] = useState(false);

  // Payment simulation state variables
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Booked Dates state
  const [bookedDates, setBookedDates] = useState<{from_dt: string, to_dt: string}[]>([]);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/vehicles/${id}`);
        setVehicle(response.data);
        
        // Also load booked dates
        const bookedResponse = await api.get(`/api/vehicles/${id}/booked-dates`);
        setBookedDates(bookedResponse.data);
      } catch (err: any) {
        setError("Could not load vehicle details. Please make sure the backend is active.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  const isDateRangeBooked = (start: string, end: string) => {
    if (!start || !end) return false;
    const s = new Date(start).getTime();
    // Use end of day for the selected end date to allow same day bookings if times don't conflict
    // but here we just have dates, so end date is 00:00:00 of that day, let's treat it as the whole day
    const e = new Date(end).getTime() + 24 * 60 * 60 * 1000 - 1; 
    
    return bookedDates.some(b => {
      const bStart = new Date(b.from_dt).getTime();
      const bEnd = new Date(b.to_dt).getTime();
      return s < bEnd && e > bStart;
    });
  };

  // Auth Protection Check
  useEffect(() => {
    if (!token) {
      router.push("/login?redirect=true");
    }
  }, [token, router]);

  // Compute pricing breakdown in real-time
  const pricingBreakdown = useMemo(() => {
    if (!vehicle) return null;
    
    // Calculate days duration
    let number_of_days = 1;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      number_of_days = Math.max(1, diffDays);
    }

    const base_charge = vehicle.base_price;
    const distance_charge = distance * vehicle.price_per_km;
    const driver_charge = driverIncluded ? (vehicle.driver_cost * number_of_days) : 0.0;
    
    const subtotal = Math.max(200.0, base_charge + distance_charge + driver_charge);
    const taxes = Math.round(subtotal * 0.18 * 100) / 100;
    const total_price = Math.round((subtotal + taxes) * 100) / 100;

    return {
      base_charge,
      distance_charge: Math.round(distance_charge * 100) / 100,
      driver_charge,
      subtotal: Math.round(subtotal * 100) / 100,
      taxes,
      total_price,
      number_of_days
    };
  }, [vehicle, distance, startDate, endDate, driverIncluded]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select pickup and return dates.");
      return;
    }
    
    if (startDate < todayString) {
      alert("Pickup date cannot be in the past.");
      return;
    }

    if (endDate < startDate) {
      alert("Return date cannot be before pickup date.");
      return;
    }

    if (isDateRangeBooked(startDate, endDate)) {
      setDateError("This vehicle is already booked for the selected dates.");
      return;
    }
    setDateError("");

    const queryParams = new URLSearchParams({
      start: startDate,
      end: endDate,
      pickup: pickup,
      drop: drop,
      driver: driverIncluded ? "true" : "false"
    });
    
    router.push(`/booking/${id}?${queryParams.toString()}`);
  };

  const confirmPayment = async () => {
    if (!bookingId || !pricingBreakdown) return;
    setIsPaying(true);
    try {
      await api.post("/api/payments/create", {
        booking_id: bookingId,
        amount: pricingBreakdown.total_price,
        transaction_id: transactionId
      });
      
      alert("Payment successful! Booking confirmed.");
      setShowPaymentModal(false);
      router.push("/bookings");
    } catch (error) {
      alert("Payment recording failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-primary-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="font-bold text-red-600 dark:text-red-400">{error || "Vehicle profile not found."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Specs, Image and Route Maps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Image Card */}
          <div className="bg-white border border-neutral-200/50 rounded-3xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
            <div className="relative aspect-[21/9] w-full bg-slate-100 dark:bg-neutral-800">
              <img
                src={vehicle.images ? (vehicle.images.startsWith('http') ? vehicle.images : (vehicle.images.startsWith('/static/') ? `http://localhost:8000${vehicle.images}` : vehicle.images)) : "/vehicles/placeholder.jpg"}
                alt={vehicle.vehicle_name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/vehicles/placeholder.jpg";
                }}
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white capitalize">
                    {vehicle.vehicle_name}
                  </h1>
                  <p className="text-sm text-neutral-400 mt-1 capitalize">
                    {vehicle.brand} • {vehicle.model} • {vehicle.registration_number}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 px-2 py-1 rounded text-xs text-yellow-600 dark:text-yellow-400 font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>4.8 (12 Reviews)</span>
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-xl dark:bg-neutral-850">
                  <User2 className="h-5 w-5 text-primary-500 mb-1" />
                  <span className="font-bold text-neutral-800 dark:text-white mt-1">{vehicle.seating_capacity} Seats</span>
                  <span className="text-[10px] text-neutral-400">Seating Limit</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-xl dark:bg-neutral-850">
                  <Fuel className="h-5 w-5 text-primary-500 mb-1" />
                  <span className="font-bold text-neutral-800 dark:text-white mt-1">{vehicle.fuel_type}</span>
                  <span className="text-[10px] text-neutral-400">Fuel Type</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-xl dark:bg-neutral-850">
                  <Gauge className="h-5 w-5 text-primary-500 mb-1" />
                  <span className="font-bold text-neutral-800 dark:text-white mt-1">
                    {vehicle.load_capacity > 0 ? `${vehicle.load_capacity} Tons` : "N/A"}
                  </span>
                  <span className="text-[10px] text-neutral-400">Load Capacity</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-xl dark:bg-neutral-850">
                  <MapPin className="h-5 w-5 text-primary-500 mb-1" />
                  <span className="font-bold text-neutral-800 dark:text-white mt-1 truncate max-w-[110px]">{vehicle.location ? vehicle.location.split(",")[0] : "Base"}</span>
                  <span className="text-[10px] text-neutral-400">Location Base</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Dynamic SVG Route Planning Map */}
          <DynamicMap pickup={pickup} drop={drop} onDistanceChange={setDistance} />
        </div>

        {/* Right Column: Booking panel */}
        <aside className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80 sticky top-20">
          <h2 className="text-lg font-extrabold text-neutral-950 dark:text-white mb-6">Rent Booking Form</h2>

          <form onSubmit={handleBooking} className="space-y-4">
            {/* Pickup Location Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pickup Station
              </label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200/50 px-3 rounded-xl text-xs outline-none text-neutral-800 focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-neutral-200"
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Drop Location Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Drop-off Station
              </label>
              <select
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200/50 px-3 rounded-xl text-xs outline-none text-neutral-800 focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-neutral-200"
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Pickup Date
                </label>
                <input
                  type="date"
                  required
                  min={todayString}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200/50 px-3 rounded-xl text-xs outline-none text-neutral-800 focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-neutral-200"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Return Date
                </label>
                <input
                  type="date"
                  required
                  min={startDate || todayString}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateError("");
                  }}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200/50 px-3 rounded-xl text-xs outline-none text-neutral-800 focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-neutral-200"
                />
              </div>
            </div>

            {dateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">{dateError}</span>
              </div>
            )}

            {/* Optional Driver Toggle */}
            {vehicle.driver_available && (
              <div className="flex items-center justify-between p-3 bg-primary-50/50 border border-primary-100 rounded-xl dark:bg-primary-950/20 dark:border-primary-900/30 mt-4">
                <div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Need Driver Service?
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Add vetted driver at ₹{vehicle.driver_cost}/day
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={driverIncluded}
                  onChange={(e) => setDriverIncluded(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary-500 focus:ring-primary-400 border-neutral-300 rounded"
                />
              </div>
            )}

            {/* Fare Breakdown Summary */}
            {pricingBreakdown && (
              <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs mt-6 space-y-2">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200/50 dark:border-neutral-800/80 pb-2 mb-2">
                  Pricing Breakdown
                </h3>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Base Rental Fare</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">₹{pricingBreakdown.base_charge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Distance Cost ({distance} KM)</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">₹{pricingBreakdown.distance_charge}</span>
                </div>
                {driverIncluded && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Driver Cost ({pricingBreakdown.number_of_days} Days)</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">₹{pricingBreakdown.driver_charge}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200/50 dark:border-neutral-800/80 pt-2 font-medium">
                  <span className="text-neutral-400">Taxes & GST (18%)</span>
                  <span className="text-neutral-700 dark:text-neutral-300">₹{pricingBreakdown.taxes}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200/50 dark:border-neutral-800/80 pt-2 text-sm font-extrabold">
                  <span className="text-neutral-800 dark:text-neutral-100">Total Price</span>
                  <span className="text-primary-600 dark:text-primary-400">₹{pricingBreakdown.total_price}</span>
                </div>
              </div>
            )}

            {/* Book trigger button */}
            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.99] transition mt-6"
            >
              <span>{token ? "Book & Pay Now" : "Sign In to Book"}</span>
            </button>
          </form>
        </aside>
      </div>

      {/* Razorpay Simulated Sandbox Overlay Modal */}
      {showPaymentModal && pricingBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 w-full max-w-md shadow-2xl relative dark:bg-neutral-900 dark:border-neutral-800/80">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-4 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary-500" />
              <div>
                <h3 className="font-extrabold text-neutral-900 dark:text-white leading-tight">Razorpay Checkout Sandbox</h3>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Secure Payment Gateway</span>
              </div>
            </div>

            {/* Amount details */}
            <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-neutral-400">Merchant</span>
                <span className="font-bold text-neutral-850 dark:text-neutral-200">FlexiRide Logistics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Transaction ID</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-neutral-250">
                <span className="text-neutral-850 dark:text-neutral-100">Amount Payable</span>
                <span className="text-primary-600 dark:text-primary-400">₹{pricingBreakdown.total_price}</span>
              </div>
            </div>

            {/* Dummy Input Card details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Simulated Payment Method</label>
                <div className="h-10 bg-slate-100 border border-slate-200 rounded-xl px-3 flex items-center text-xs text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-neutral-300">
                  💳 Debit Card (Simulated Sandbox)
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Dummy Card Number</label>
                <input
                  type="text"
                  disabled
                  value="4111 2222 3333 4444"
                  className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs outline-none text-neutral-400 dark:bg-neutral-850 dark:border-neutral-800/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Expiry</label>
                  <input
                    type="text"
                    disabled
                    value="12/28"
                    className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs outline-none text-neutral-400 dark:bg-neutral-850 dark:border-neutral-800/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">CVV</label>
                  <input
                    type="text"
                    disabled
                    value="***"
                    className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs outline-none text-neutral-400 dark:bg-neutral-850 dark:border-neutral-800/80"
                  />
                </div>
              </div>

              {/* Checkout Controls */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/2 border border-neutral-200 hover:bg-neutral-50 h-11 rounded-xl text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={isPaying}
                  className="w-1/2 bg-primary-500 hover:bg-primary-600 text-white font-semibold h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-primary-500/10 transition"
                >
                  {isPaying ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>Confirm Pay</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
