"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Vehicle, DriverOption } from "@/types";
import HeroNavbar from "@/components/HeroNavbar";
import { CheckCircle, ArrowRight, ShieldCheck, CreditCard, Loader2, Star, Car, User as UserIcon, MapPin, Truck } from "lucide-react";

export default function BookingCheckoutFlow() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // URL params parsed
  const startParam = searchParams.get("start") || "";
  const endParam = searchParams.get("end") || "";
  const pickupParam = searchParams.get("pickup") || "Kochi Airport (COK)";
  const dropParam = searchParams.get("drop") || "Kochi Airport (COK)";
  const driverParam = searchParams.get("driver") === "true";

  const [step, setStep] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Phase 2: trip type + driver selection
  const [tripType, setTripType] = useState<"self_drive" | "with_driver">("self_drive");
  const [availableDrivers, setAvailableDrivers] = useState<DriverOption[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverOption | null>(null);

  // Phase 3: pickup / delivery
  const [pickupType, setPickupType] = useState<"self_pickup" | "host_delivery">("self_pickup");
  const [userDeliveryAddress, setUserDeliveryAddress] = useState("");
  const [deliveryOptions, setDeliveryOptions] = useState<{
    host_delivery_available: boolean;
    delivery_fee_per_km: number;
    max_delivery_radius_km: number;
    delivery_charge_flat: number;
    host_location: string | null;
    host_lat: number | null;
    host_lng: number | null;
  } | null>(null);
  const [deliveryOptionsLoading, setDeliveryOptionsLoading] = useState(false);
  
  // Addons state
  const [addOns, setAddOns] = useState({
    insurance: true,
    helmet: false,
    fuel_prepay: false
  });

  useEffect(() => {
    if (!token) {
      router.push("/login?redirect=true");
    }
  }, [token, router]);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        const response = await api.get(`/api/vehicles/${id}`);
        setVehicle(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVehicle();
  }, [id]);

  // Phase 2: fetch available drivers when trip type switches to 'with_driver'
  useEffect(() => {
    if (tripType !== "with_driver") return;
    setDriversLoading(true);
    api.get("/api/drivers/available")
      .then(res => setAvailableDrivers(res.data))
      .catch(() => setAvailableDrivers([]))
      .finally(() => setDriversLoading(false));
  }, [tripType]);

  // Phase 3: fetch delivery options when vehicle loads
  useEffect(() => {
    if (!id) return;
    setDeliveryOptionsLoading(true);
    api.get(`/api/vehicles/${id}/delivery-options`)
      .then(res => setDeliveryOptions(res.data))
      .catch(() => setDeliveryOptions(null))
      .finally(() => setDeliveryOptionsLoading(false));
  }, [id]);

  // Reset pickup type when switching to with_driver
  useEffect(() => {
    if (tripType === "with_driver") {
      setPickupType("self_pickup");
      setUserDeliveryAddress("");
    }
  }, [tripType]);

  // Deterministic mock offset based on address input string length and character codes
  const getMockOffsetFromAddress = (address: string) => {
    if (!address) return { latOffset: 0, lngOffset: 0 };
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Limit range of offset to roughly 3-12km (0.027 to 0.11 degrees)
    const multiplier = hash % 2 === 0 ? 1 : -1;
    const multiplierLng = (hash >> 1) % 2 === 0 ? 1 : -1;
    const latOffset = (((Math.abs(hash) % 70) + 25) / 1000) * multiplier;
    const lngOffset = (((Math.abs(hash >> 3) % 70) + 25) / 1000) * multiplierLng;
    return { latOffset, lngOffset };
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const pricing = useMemo(() => {
    if (!vehicle) return null;
    let days = 1;
    let hours = 24;
    if (startParam && endParam) {
      const s = new Date(startParam).getTime();
      const e = new Date(endParam).getTime();
      const ms = Math.abs(e - s);
      days = Math.max(1, Math.ceil(ms / (1000 * 3600 * 24)));
      hours = Math.max(1, Math.ceil(ms / (1000 * 3600)));
    }

    const base = vehicle.base_price * days;

    // Phase 2: driver cost per HOUR
    const driverHourlyRate = selectedDriver ? selectedDriver.hourly_rate : 0;
    const driver = tripType === "with_driver" && selectedDriver
      ? Math.round(driverHourlyRate * hours * 100) / 100
      : 0;

    // Phase 3: delivery fee (only for self_drive + host_delivery)
    let deliveryCost = 0;
    let deliveryDistance = 0;
    let isOutOfDeliveryRange = false;

    if (tripType === "self_drive" && pickupType === "host_delivery" && deliveryOptions && userDeliveryAddress.trim().length > 3) {
      if (deliveryOptions.host_lat && deliveryOptions.host_lng) {
        const { latOffset, lngOffset } = getMockOffsetFromAddress(userDeliveryAddress);
        const deliveryLat = deliveryOptions.host_lat + latOffset;
        const deliveryLng = deliveryOptions.host_lng + lngOffset;
        deliveryDistance = calculateHaversineDistance(
          deliveryOptions.host_lat,
          deliveryOptions.host_lng,
          deliveryLat,
          deliveryLng
        );
        
        if (deliveryOptions.max_delivery_radius_km > 0 && deliveryDistance > deliveryOptions.max_delivery_radius_km) {
          isOutOfDeliveryRange = true;
        }
        
        const perKmFee = deliveryOptions.delivery_fee_per_km || 0;
        const flatCharge = deliveryOptions.delivery_charge_flat || 0;
        deliveryCost = Math.round((flatCharge + deliveryDistance * perKmFee) * 100) / 100;
      } else {
        deliveryCost = deliveryOptions.delivery_charge_flat || 0;
      }
    }

    let addonCost = 0;
    if (addOns.insurance) addonCost += 199 * days;
    if (addOns.helmet) addonCost += 50 * days;
    if (addOns.fuel_prepay) addonCost += 1500;

    const subtotal = base + driver + deliveryCost + addonCost;
    const taxes = Math.round(subtotal * 0.18 * 100) / 100;
    const deposit = 2000;
    const total = Math.round((subtotal + taxes + deposit) * 100) / 100;
    const partial = Math.round(total * 0.30 * 100) / 100;
    const remaining = Math.round(total * 0.70 * 100) / 100;

    return {
      days, hours, base, driver, driverHourlyRate, deliveryCost, deliveryDistance, isOutOfDeliveryRange, addonCost, subtotal, taxes, deposit,
      total, partial, remaining,
    };
  }, [vehicle, startParam, endParam, tripType, selectedDriver, pickupType, deliveryOptions, userDeliveryAddress, addOns]);

  const handlePayment = async () => {
    if (!pricing || !vehicle) return;
    setIsPaying(true);
    try {
      let deliveryLat: number | null = null;
      let deliveryLng: number | null = null;
      if (pickupType === "host_delivery" && deliveryOptions?.host_lat && deliveryOptions?.host_lng && userDeliveryAddress.trim().length > 3) {
        const { latOffset, lngOffset } = getMockOffsetFromAddress(userDeliveryAddress);
        deliveryLat = deliveryOptions.host_lat + latOffset;
        deliveryLng = deliveryOptions.host_lng + lngOffset;
      }

      // 1. Create Booking
      const bookingRes = await api.post("/api/bookings", {
        vehicle_id: vehicle.id,
        from_dt: new Date(startParam).toISOString(),
        to_dt: new Date(endParam).toISOString(),
        pickup_address: pickupParam,
        // Phase 3: pickup_type + delivery_address
        pickup_type: tripType === "with_driver" ? "driver_pickup" : pickupType,
        delivery_address: pickupType === "host_delivery" ? userDeliveryAddress : dropParam,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        delivery_fee: pricing.deliveryCost,
        // Phase 2: trip_type and driver details
        trip_type: tripType,
        driver_id: selectedDriver?.id || null,
        base_amount: pricing.base,
        driver_fee: pricing.driver,
        driver_hourly_rate: pricing.driverHourlyRate,
        driver_total_cost: pricing.driver,
        gst_amount: pricing.taxes,
        deposit_amount: pricing.deposit,
        total_amount: pricing.total
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookingId = bookingRes.data.id;
      const transactionId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Simulate Payment — charge only 30% (partial_amount) now
      await api.post("/api/payments/create", {
        booking_id: bookingId,
        amount: pricing.partial,
        method: paymentMethod === "card" ? "sandbox_card" : "sandbox_upi",
        gateway_ref: transactionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStep(4); // Success step
    } catch (err) {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent-amber w-10 h-10" /></div>;
  }

  if (!vehicle || !pricing) {
    return <div className="p-20 text-center">Vehicle or booking details invalid.</div>;
  }

  return (
    <div className="bg-surface min-h-screen">
      <HeroNavbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-16">
        
        {/* Stepper Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-primary-dark uppercase mb-6">Checkout</h1>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 h-1 bg-border top-1/2 -translate-y-1/2 z-0"></div>
            {[
              { num: 1, title: "Review" },
              { num: 2, title: "Add-ons" },
              { num: 3, title: "Payment" },
              { num: 4, title: "Done" }
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                  step > s.num ? "bg-accent-green border-accent-green text-white" :
                  step === s.num ? "bg-primary-dark border-primary-dark text-white" : "bg-white border-border text-text-muted"
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.num ? "text-primary-dark" : "text-text-muted"}`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Flow Area */}
          <div className="lg:col-span-2">
            
            {step === 1 && (
              <div className="bg-white p-8 rounded-card border border-border shadow-sm">
                <h2 className="text-xl font-display font-bold text-primary-dark uppercase mb-6 border-b border-border pb-4">1. Review Trip Details</h2>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Pickup</span>
                    <span className="font-bold text-primary-dark block text-lg">{pickupParam}</span>
                    <span className="text-sm text-text-muted">{new Date(startParam).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Drop-off</span>
                    <span className="font-bold text-primary-dark block text-lg">{dropParam}</span>
                    <span className="text-sm text-text-muted mb-1 block">{new Date(endParam).toLocaleString()}</span>
                    {startParam && endParam && (
                      <span className="text-xs text-text-muted/70 block">
                        Duration: {Math.floor(Math.abs(new Date(endParam).getTime() - new Date(startParam).getTime()) / (1000 * 3600 * 24))} Day(s), {Math.floor((Math.abs(new Date(endParam).getTime() - new Date(startParam).getTime()) / (1000 * 3600)) % 24)} Hour(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Phase 2: Interactive Trip Type Selector */}
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-3">Trip Type</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Self Drive card */}
                    <button
                      onClick={() => { setTripType("self_drive"); setSelectedDriver(null); }}
                      className={`relative flex flex-col items-start gap-2 p-4 rounded-card border-2 transition-all duration-200 text-left ${
                        tripType === "self_drive"
                          ? "border-primary-dark bg-primary-dark/5"
                          : "border-border hover:border-text-muted"
                      }`}
                    >
                      {tripType === "self_drive" && <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-primary-dark" />}
                      <Car className="w-5 h-5 text-primary-dark" />
                      <span className="font-bold text-primary-dark text-sm">Self Drive</span>
                      <span className="text-xs text-text-muted">You operate the vehicle yourself</span>
                    </button>

                    {/* With Driver card */}
                    <button
                      onClick={() => setTripType("with_driver")}
                      className={`relative flex flex-col items-start gap-2 p-4 rounded-card border-2 transition-all duration-200 text-left ${
                        tripType === "with_driver"
                          ? "border-driver-gold bg-driver-gold/5"
                          : "border-border hover:border-text-muted"
                      }`}
                    >
                      {tripType === "with_driver" && <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-driver-gold" />}
                      <UserIcon className="w-5 h-5 text-driver-gold" />
                      <span className="font-bold text-primary-dark text-sm">With Driver</span>
                      <span className="text-xs text-text-muted">Professional operator included</span>
                    </button>
                  </div>
                </div>

                {/* Phase 2: Driver Picker — only visible when 'with_driver' selected */}
                {tripType === "with_driver" && (
                  <div className="mb-6 border border-driver-gold/30 rounded-card bg-driver-gold/5 p-4 transition-all">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-driver-gold mb-3">Select a Driver</p>
                    {driversLoading ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-text-muted text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading available drivers…
                      </div>
                    ) : availableDrivers.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-4">No drivers currently available. Try Self Drive.</p>
                    ) : (
                      <div className="space-y-2">
                        {availableDrivers.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => setSelectedDriver(d)}
                            className={`flex items-center gap-4 p-3 rounded-input border cursor-pointer transition-all ${
                              selectedDriver?.id === d.id
                                ? "border-driver-gold bg-driver-gold/10"
                                : "border-border bg-white hover:border-driver-gold/50"
                            }`}
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {d.photo_url ? (
                                <img src={d.photo_url} alt={d.name} className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-primary-dark text-sm truncate">{d.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < Math.round(d.rating_avg) ? "text-driver-gold fill-driver-gold" : "text-neutral-300"}`} />
                                ))}
                                <span className="text-[10px] text-text-muted ml-1">{d.experience_years}yr exp</span>
                              </div>
                            </div>
                            {/* Rate */}
                            <div className="text-right shrink-0">
                              <p className="font-numbers font-bold text-driver-gold text-sm">₹{d.hourly_rate}<span className="text-xs font-sans text-text-muted">/hr</span></p>
                              {selectedDriver?.id === d.id && (
                                <span className="text-[10px] text-driver-gold font-bold">Selected ✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 3: Pickup / Delivery — only for self_drive */}
                {tripType === "self_drive" && (
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-3">How to Get the Car?</span>
                    <div className="grid grid-cols-2 gap-3">
                      {/* I'll Pick Up */}
                      <button
                        onClick={() => { setPickupType("self_pickup"); setUserDeliveryAddress(""); }}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-card border-2 transition-all duration-200 text-left ${
                          pickupType === "self_pickup"
                            ? "border-primary-dark bg-primary-dark/5"
                            : "border-border hover:border-text-muted"
                        }`}
                      >
                        {pickupType === "self_pickup" && <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-primary-dark" />}
                        <MapPin className="w-5 h-5 text-primary-dark" />
                        <span className="font-bold text-primary-dark text-sm">I'll Pick Up</span>
                        <span className="text-xs text-text-muted">Go to the host's location</span>
                      </button>

                      {/* Host Delivers */}
                      <button
                        onClick={() => {
                          if (deliveryOptions?.host_delivery_available) setPickupType("host_delivery");
                        }}
                        disabled={!deliveryOptions?.host_delivery_available}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-card border-2 transition-all duration-200 text-left ${
                          !deliveryOptions?.host_delivery_available
                            ? "border-border opacity-50 cursor-not-allowed"
                            : pickupType === "host_delivery"
                              ? "border-accent-green bg-accent-green/5"
                              : "border-border hover:border-text-muted"
                        }`}
                      >
                        {pickupType === "host_delivery" && <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-accent-green" />}
                        <Truck className="w-5 h-5 text-accent-green" />
                        <span className="font-bold text-primary-dark text-sm">Host Delivers</span>
                        <span className="text-xs text-text-muted">
                          {deliveryOptions?.host_delivery_available
                            ? `Car brought to you${deliveryOptions.delivery_charge_flat > 0 ? ` • ₹${deliveryOptions.delivery_charge_flat} fee` : ""}`
                            : "Not available for this vehicle"}
                        </span>
                      </button>
                    </div>

                    {/* Self-pickup: show host location */}
                    {pickupType === "self_pickup" && (
                      <div className="mt-3 bg-primary-dark/5 border border-primary-dark/20 rounded-input p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-dark shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block">Pickup Location</span>
                            <span className="text-sm font-bold text-primary-dark">
                              {deliveryOptions?.host_location || pickupParam}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Host delivery: show address input */}
                    {pickupType === "host_delivery" && (
                      <div className="mt-3 bg-accent-green/5 border border-accent-green/20 rounded-input p-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-accent-green block mb-2">
                          Your Delivery Address
                        </label>
                        <input
                          type="text"
                          value={userDeliveryAddress}
                          onChange={(e) => setUserDeliveryAddress(e.target.value)}
                          placeholder="Enter your address for car delivery"
                          className="w-full bg-white border border-border rounded-input px-3 py-2.5 text-sm text-primary-dark placeholder-text-muted focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green"
                        />
                        {pricing.isOutOfDeliveryRange && (
                          <p className="text-xs text-red-500 font-bold mt-2">
                            ⚠️ Out of delivery range: {pricing.deliveryDistance.toFixed(1)} km (Max {deliveryOptions?.max_delivery_radius_km} km)
                          </p>
                        )}
                        {!pricing.isOutOfDeliveryRange && pricing.deliveryDistance > 0 && (
                          <p className="text-xs text-accent-green font-bold mt-2">
                            Estimated distance: {pricing.deliveryDistance.toFixed(1)} km • Delivery fee: ₹{pricing.deliveryCost} (₹{deliveryOptions?.delivery_charge_flat} flat + ₹{deliveryOptions?.delivery_fee_per_km}/km)
                          </p>
                        )}
                        {!pricing.isOutOfDeliveryRange && pricing.deliveryDistance === 0 && deliveryOptions && deliveryOptions.delivery_charge_flat > 0 && (
                          <p className="text-xs text-accent-green font-bold mt-2">
                            Delivery fee: ₹{deliveryOptions.delivery_charge_flat}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={(tripType === "with_driver" && !selectedDriver) || (pickupType === "host_delivery" && (!userDeliveryAddress || pricing.isOutOfDeliveryRange))}
                  className="mt-4 bg-primary-dark text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-black w-full md:w-auto ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-8 rounded-card border border-border shadow-sm">
                <h2 className="text-xl font-display font-bold text-primary-dark uppercase mb-6 border-b border-border pb-4">2. Select Add-ons</h2>
                
                <div className="space-y-4">
                  <label className={`flex items-start gap-4 p-4 border rounded-card cursor-pointer transition-colors ${addOns.insurance ? "border-accent-amber bg-accent-amber/5" : "border-border hover:border-text-muted"}`}>
                    <input type="checkbox" checked={addOns.insurance} onChange={(e) => setAddOns({...addOns, insurance: e.target.checked})} className="mt-1 w-5 h-5 accent-accent-amber" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-primary-dark">Comprehensive Trip Insurance</span>
                        <span className="font-numbers font-bold text-primary-dark">₹199<span className="text-xs font-sans text-text-muted">/day</span></span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">Zero liability on damages up to ₹5 Lakhs.</p>
                    </div>
                  </label>
                  
                  {vehicle.vehicle_category === "two_wheeler" && (
                    <label className={`flex items-start gap-4 p-4 border rounded-card cursor-pointer transition-colors ${addOns.helmet ? "border-accent-amber bg-accent-amber/5" : "border-border hover:border-text-muted"}`}>
                      <input type="checkbox" checked={addOns.helmet} onChange={(e) => setAddOns({...addOns, helmet: e.target.checked})} className="mt-1 w-5 h-5 accent-accent-amber" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-primary-dark">Extra Helmet</span>
                          <span className="font-numbers font-bold text-primary-dark">₹50<span className="text-xs font-sans text-text-muted">/day</span></span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">Pillion rider helmet for safety.</p>
                      </div>
                    </label>
                  )}

                  <label className={`flex items-start gap-4 p-4 border rounded-card cursor-pointer transition-colors ${addOns.fuel_prepay ? "border-accent-amber bg-accent-amber/5" : "border-border hover:border-text-muted"}`}>
                    <input type="checkbox" checked={addOns.fuel_prepay} onChange={(e) => setAddOns({...addOns, fuel_prepay: e.target.checked})} className="mt-1 w-5 h-5 accent-accent-amber" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-primary-dark">Prepaid Fuel</span>
                        <span className="font-numbers font-bold text-primary-dark">₹1500<span className="text-xs font-sans text-text-muted"> flat</span></span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">Return empty without penalties.</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(1)} className="border border-border text-text-muted h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-surface">Back</button>
                  <button onClick={() => setStep(3)} className="bg-primary-dark text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-black">
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white p-8 rounded-card border border-border shadow-sm">
                <h2 className="text-xl font-display font-bold text-primary-dark uppercase mb-6 border-b border-border pb-4">3. Payment (Sandbox)</h2>
                
                <div className="bg-surface border border-border rounded-card p-6 flex items-center gap-4 mb-8">
                  <ShieldCheck className="w-8 h-8 text-accent-green" />
                  <div>
                    <h3 className="font-bold text-primary-dark">Secure Sandbox Environment</h3>
                    <p className="text-xs text-text-muted">No real charges will be made. Click "Simulate Payment".</p>
                  </div>
                </div>

                {/* Phase 1: Partial Payment Breakdown */}
                <div className="rounded-card border border-border bg-surface p-5 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Payment Breakdown</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-primary-dark">Pay Now (30%)</span>
                    <span className="font-numbers font-bold text-accent-green text-base">₹{pricing.partial}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text-muted">Balance After Trip (70%)</span>
                    <span className="font-numbers font-bold text-text-muted text-base">₹{pricing.remaining}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div 
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 border-2 rounded-card p-4 relative overflow-hidden cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary-dark bg-primary-dark/5" : "border-border hover:border-text-muted"}`}
                  >
                    {paymentMethod === "card" && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-primary-dark" /></div>}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Method</span>
                    <span className="font-bold text-primary-dark flex items-center gap-2"><CreditCard className="w-4 h-4" /> Saved Card</span>
                    <span className="text-sm text-text-muted block mt-4">**** **** **** 4242</span>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex-1 border-2 rounded-card p-4 relative overflow-hidden cursor-pointer transition-colors ${paymentMethod === "upi" ? "border-primary-dark bg-primary-dark/5" : "border-border hover:border-text-muted"}`}
                  >
                    {paymentMethod === "upi" && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-primary-dark" /></div>}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Method</span>
                    <span className="font-bold text-primary-dark">UPI / Netbanking</span>
                    <span className="text-sm text-text-muted block mt-4">Add new</span>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(2)} className="border border-border text-text-muted h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-surface">Back</button>
                  <div className="flex flex-col items-end gap-1.5">
                    <button onClick={handlePayment} disabled={isPaying} className="bg-accent-green text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-[#10a310]">
                      {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${pricing.partial} Now →`}
                    </button>
                    <p className="text-[11px] text-text-muted">Remaining ₹{pricing.remaining} is collected after your trip ends.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white p-12 rounded-card border border-border shadow-sm text-center">
                <CheckCircle className="w-20 h-20 text-accent-green mx-auto mb-6" />
                <h2 className="text-3xl font-display font-bold text-primary-dark uppercase mb-2">Booking Confirmed!</h2>
                <p className="text-text-muted mb-8">Your transaction was successful. You can find your invoice and trip details in your dashboard.</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => router.push("/bookings")} className="bg-primary-dark text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-black">Go to My Bookings</button>
                  <button onClick={() => router.push("/")} className="border border-border text-primary-dark h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-surface">Home</button>
                </div>
              </div>
            )}

          </div>

          {/* Right Summary Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-card border border-border shadow-sm sticky top-24">
              <h3 className="font-display font-bold text-primary-dark uppercase border-b border-border pb-4 mb-4">Trip Summary</h3>
              
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-16 rounded bg-neutral-100 overflow-hidden">
                  <img
                    src={vehicle.images || "/vehicles/placeholder.jpg"}
                    alt={vehicle.model}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/vehicles/placeholder.jpg";
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark">{vehicle.brand} {vehicle.model}</h4>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{vehicle.vehicle_category} • {vehicle.fuel_type}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-text-muted font-bold">Rental Fare ({pricing.days} Days)</span>
                  <span className="font-numbers font-bold text-primary-dark">₹{pricing.base}</span>
                </div>
                {pricing.driver > 0 && (
                  <div className="flex justify-between">
                    <span className="text-driver-gold font-bold">
                      Driver ({pricing.hours}h × ₹{pricing.driverHourlyRate}/hr)
                    </span>
                    <span className="font-numbers font-bold text-driver-gold">₹{pricing.driver}</span>
                  </div>
                )}
                {/* Phase 3: Delivery Fee line */}
                {pricing.deliveryCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-accent-green font-bold">Delivery Fee</span>
                    <span className="font-numbers font-bold text-accent-green">₹{pricing.deliveryCost}</span>
                  </div>
                )}
                {pricing.addonCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted font-bold">Add-ons</span>
                    <span className="font-numbers font-bold text-primary-dark">₹{pricing.addonCost}</span>
                  </div>
                )}
                {pricing.deposit > 0 && (
                  <div className="flex justify-between text-accent-blue">
                    <span className="font-bold">Security Deposit</span>
                    <span className="font-numbers font-bold">₹{pricing.deposit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted font-bold">Taxes (18%)</span>
                  <span className="font-numbers font-bold text-primary-dark">₹{pricing.taxes}</span>
                </div>
                {/* Phase 1: Balance Due line */}
                <div className="flex justify-between text-accent-amber">
                  <span className="font-bold">Balance Due After Trip</span>
                  <span className="font-numbers font-bold">₹{pricing.remaining}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-primary-dark text-lg uppercase tracking-wider">Total</span>
                <span className="font-numbers font-bold text-2xl text-accent-amber">₹{pricing.total}</span>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
