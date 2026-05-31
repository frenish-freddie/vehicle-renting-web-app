"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Vehicle } from "@/types";
import DynamicMap from "@/components/DynamicMap";
import HeroNavbar from "@/components/HeroNavbar";
import { Calendar, Users, Fuel, MapPin, Gauge, Star, AlertTriangle, ShieldCheck, Heart, Loader2 } from "lucide-react";

const STATIONS = [
  "Kochi Airport (COK)",
  "Trivandrum Central",
  "Sakthan Nagar",
  "Chalakudy",
  "Guruvayur",
  "Irinjalakuda",
  "Kunnamkulam",
];

export default function VehicleDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking fields state variables
  const [pickup, setPickup] = useState("Kochi Airport (COK)");
  const [drop, setDrop] = useState("Kochi Airport (COK)");
  const [distance, setDistance] = useState(15);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverIncluded, setDriverIncluded] = useState(false);

  // Payment simulation state variables
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/vehicles/${id}`);
        setVehicle(response.data);
      } catch (err: any) {
        setError("Could not load vehicle details. Please make sure the backend is active.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [id]);

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

    const base_charge = vehicle.base_price * number_of_days;
    const distance_charge = 0; // Removing distance logic for now as price is per day
    const driver_charge = driverIncluded ? (vehicle.driver_cost * number_of_days) : 0.0;
    
    const subtotal = base_charge + distance_charge + driver_charge;
    const taxes = Math.round(subtotal * 0.18 * 100) / 100;
    const deposit = 2000; // Hardcoded default sandbox deposit
    const total_price = Math.round((subtotal + taxes + deposit) * 100) / 100;

    return {
      base_charge,
      distance_charge: Math.round(distance_charge * 100) / 100,
      driver_charge,
      deposit,
      subtotal: Math.round(subtotal * 100) / 100,
      taxes,
      total_price,
      number_of_days
    };
  }, [vehicle, distance, startDate, endDate, driverIncluded]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push("/login?redirect=true");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select pickup and return dates.");
      return;
    }

    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      pickup: pickup,
      drop: drop,
      driver: driverIncluded ? "true" : "false"
    });
    
    router.push(`/booking/${id}?${params.toString()}`);
  };

  // Payment simulation has been moved to /booking/[id] flow.

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-accent-amber">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="font-bold text-red-600">{error || "Vehicle profile not found."}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-20">
      <HeroNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Image and Specs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-border rounded-card overflow-hidden shadow-sm">
              <div className="relative aspect-[21/9] w-full bg-neutral-100">
                <img
                  src={vehicle.images || "/vehicles/placeholder.jpg"}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/vehicles/placeholder.jpg";
                  }}
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary-dark text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{vehicle.vehicle_category}</span>
                      <span className="bg-surface border border-border text-text-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{vehicle.fuel_type}</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-primary-dark capitalize">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <p className="text-sm text-text-muted mt-1 uppercase tracking-wide font-bold">
                      Registration: {vehicle.registration_number}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-amber-50 border border-accent-amber px-3 py-1.5 rounded-badge text-sm text-accent-amber font-bold mb-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span>4.9 (12 Trips)</span>
                    </div>
                  </div>
                </div>

                {/* Grid Specifications */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {vehicle.seating_capacity && (
                    <div className="flex flex-col items-center p-4 bg-surface border border-border rounded-card text-center">
                      <Users className="h-6 w-6 text-text-muted mb-2" />
                      <span className="font-bold text-primary-dark">{vehicle.seating_capacity} Seats</span>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Capacity</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center p-4 bg-surface border border-border rounded-card text-center">
                    <Fuel className="h-6 w-6 text-text-muted mb-2" />
                    <span className="font-bold text-primary-dark">{vehicle.fuel_type}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Fuel Type</span>
                  </div>
                  {vehicle.load_capacity && (
                    <div className="flex flex-col items-center p-4 bg-surface border border-border rounded-card text-center">
                      <Gauge className="h-6 w-6 text-text-muted mb-2" />
                      <span className="font-bold text-primary-dark">{vehicle.load_capacity} Tons</span>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Payload</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center p-4 bg-surface border border-border rounded-card text-center">
                    <ShieldCheck className="h-6 w-6 text-text-muted mb-2" />
                    <span className="font-bold text-primary-dark">{vehicle.driver_available ? "Optional Driver" : "Self Drive"}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Service Mode</span>
                  </div>
                </div>

                {/* Docs Required */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-bold text-primary-dark mb-4">Documents Required</h3>
                  <div className="flex gap-2">
                    <span className="bg-surface border border-border px-3 py-1 rounded text-sm font-bold text-text-muted">Aadhaar Card</span>
                    <span className="bg-surface border border-border px-3 py-1 rounded text-sm font-bold text-text-muted">Driving License</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Dynamic SVG Route Planning Map */}
            <div className="hidden lg:block">
              <DynamicMap pickup={pickup} drop={drop} onDistanceChange={setDistance} />
            </div>
          </div>

          {/* Right Column: Booking panel */}
          <aside className="bg-white border border-border rounded-card p-6 shadow-card sticky top-24">
            <h2 className="text-xl font-display font-bold text-primary-dark mb-6 border-b border-border pb-4">Rent this Vehicle</h2>

            <form onSubmit={handleBooking} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Pickup Location</label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full h-12 bg-surface border border-border px-4 rounded-input font-bold text-primary-dark focus:border-accent-amber outline-none transition-colors"
                >
                  {STATIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Return Location</label>
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full h-12 bg-surface border border-border px-4 rounded-input font-bold text-primary-dark focus:border-accent-amber outline-none transition-colors"
                >
                  {STATIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Pickup Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-12 bg-surface border border-border px-4 rounded-input font-bold text-primary-dark focus:border-accent-amber outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Return Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-12 bg-surface border border-border px-4 rounded-input font-bold text-primary-dark focus:border-accent-amber outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Optional Driver Toggle */}
              {vehicle.driver_available && (
                <div className="flex items-center justify-between p-4 bg-driver-gold/10 border border-driver-gold rounded-card mt-2">
                  <div>
                    <span className="font-bold text-primary-dark block">Include Operator/Driver?</span>
                    <span className="text-xs font-bold text-driver-gold mt-0.5 block">+ ₹{vehicle.driver_cost}/day</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={driverIncluded}
                    onChange={(e) => setDriverIncluded(e.target.checked)}
                    className="h-5 w-5 accent-driver-gold cursor-pointer"
                  />
                </div>
              )}

              {/* Fare Breakdown Summary */}
              {pricingBreakdown && (
                <div className="bg-surface p-5 rounded-card border border-border text-sm mt-6 space-y-3">
                  <h3 className="font-bold text-primary-dark border-b border-border pb-3 mb-3 uppercase tracking-wider text-[11px]">Pricing Summary</h3>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold">Rental Fare ({pricingBreakdown.number_of_days} Days)</span>
                    <span className="font-numbers font-bold text-primary-dark">₹{pricingBreakdown.base_charge}</span>
                  </div>
                  
                  {driverIncluded && (
                    <div className="flex justify-between items-center">
                      <span className="text-driver-gold font-bold">Driver Fee</span>
                      <span className="font-numbers font-bold text-driver-gold">₹{pricingBreakdown.driver_charge}</span>
                    </div>
                  )}

                  {pricingBreakdown.deposit > 0 && (
                    <div className="flex justify-between items-center text-accent-blue">
                      <span className="font-bold">Security Deposit (Refundable)</span>
                      <span className="font-numbers font-bold">₹{pricingBreakdown.deposit}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="text-text-muted font-bold">Taxes & GST (18%)</span>
                    <span className="font-numbers font-bold text-primary-dark">₹{pricingBreakdown.taxes}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-border pt-3 mt-1">
                    <span className="font-bold text-primary-dark text-base uppercase">Total Payable</span>
                    <span className="font-numbers font-bold text-2xl text-accent-amber">₹{pricingBreakdown.total_price}</span>
                  </div>
                </div>
              )}

              {/* Book trigger button */}
              <button
                type="submit"
                className="w-full h-14 mt-4 bg-accent-amber hover:bg-yellow-500 text-primary-dark font-display font-bold text-xl uppercase tracking-wider rounded-input shadow-md transition-all flex items-center justify-center gap-2"
              >
                {token ? "Book & Pay" : "Sign In to Book"}
              </button>
            </form>
          </aside>
        </div>

        </div>
    </div>
  );
}
