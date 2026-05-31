"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Vehicle } from "@/types";
import HeroNavbar from "@/components/HeroNavbar";
import { CheckCircle, ArrowRight, ShieldCheck, CreditCard, ReceiptText, Loader2, Star } from "lucide-react";

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

  const pricing = useMemo(() => {
    if (!vehicle) return null;
    let days = 1;
    if (startParam && endParam) {
      const s = new Date(startParam).getTime();
      const e = new Date(endParam).getTime();
      days = Math.max(1, Math.ceil(Math.abs(e - s) / (1000 * 3600 * 24)));
    }

    const base = vehicle.base_price * days;
    const driver = driverParam ? vehicle.driver_cost * days : 0;
    
    let addonCost = 0;
    if (addOns.insurance) addonCost += 199 * days;
    if (addOns.helmet) addonCost += 50 * days;
    if (addOns.fuel_prepay) addonCost += 1500;

    const subtotal = base + driver + addonCost;
    const taxes = subtotal * 0.18;
    const deposit = 2000; // Hardcoded default for now
    const total = subtotal + taxes + deposit;

    return {
      days, base, driver, addonCost, subtotal, taxes, deposit, total: Math.round(total * 100) / 100
    };
  }, [vehicle, startParam, endParam, driverParam, addOns]);

  const handlePayment = async () => {
    if (!pricing || !vehicle) return;
    setIsPaying(true);
    try {
      // 1. Create Booking
      const bookingRes = await api.post("/api/bookings", {
        vehicle_id: vehicle.id,
        from_dt: new Date(startParam).toISOString(),
        to_dt: new Date(endParam).toISOString(),
        pickup_address: pickupParam,
        delivery_address: dropParam,
        trip_type: driverParam ? "with_driver" : "self",
        base_amount: pricing.base,
        driver_fee: pricing.driver,
        gst_amount: pricing.taxes,
        deposit_amount: pricing.deposit,
        total_amount: pricing.total
      });

      const bookingId = bookingRes.data.id;
      const transactionId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Simulate Payment
      await api.post("/api/payments/create", {
        booking_id: bookingId,
        amount: pricing.total,
        transaction_id: transactionId
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
                    <span className="text-sm text-text-muted">{new Date(endParam).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-driver-gold/10 border border-driver-gold rounded-input p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-primary-dark block text-sm">Trip Type</span>
                    <span className="text-xs text-text-muted">{driverParam ? "Vehicle + Professional Operator" : "Self-Drive / Self-Operate"}</span>
                  </div>
                  {driverParam && <div className="bg-driver-gold text-primary-dark text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded badge">Driver Included</div>}
                </div>
                <button onClick={() => setStep(2)} className="mt-8 bg-primary-dark text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-black w-full md:w-auto ml-auto">
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

                <div className="flex gap-4">
                  <div className="flex-1 border-2 border-primary-dark rounded-card p-4 relative overflow-hidden bg-primary-dark/5">
                    <div className="absolute top-2 right-2"><CreditCard className="w-5 h-5 text-primary-dark" /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Method</span>
                    <span className="font-bold text-primary-dark">Saved Card</span>
                    <span className="text-sm text-text-muted block mt-4">**** **** **** 4242</span>
                  </div>
                  <div className="flex-1 border border-border rounded-card p-4 hover:border-text-muted cursor-pointer transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Method</span>
                    <span className="font-bold text-primary-dark">UPI / Netbanking</span>
                    <span className="text-sm text-text-muted block mt-4">Add new</span>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(2)} className="border border-border text-text-muted h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-surface">Back</button>
                  <button onClick={handlePayment} disabled={isPaying} className="bg-accent-green text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-[#10a310]">
                    {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${pricing.total}`}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white p-12 rounded-card border border-border shadow-sm text-center">
                <CheckCircle className="w-20 h-20 text-accent-green mx-auto mb-6" />
                <h2 className="text-3xl font-display font-bold text-primary-dark uppercase mb-2">Booking Confirmed!</h2>
                <p className="text-text-muted mb-8">Your transaction was successful. You can find your invoice and trip details in your dashboard.</p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => router.push("/dashboard")} className="bg-primary-dark text-white h-12 px-8 rounded-input font-bold uppercase tracking-wider text-sm hover:bg-black">Go to Dashboard</button>
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
                    <span className="text-driver-gold font-bold">Driver Service</span>
                    <span className="font-numbers font-bold text-driver-gold">₹{pricing.driver}</span>
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
