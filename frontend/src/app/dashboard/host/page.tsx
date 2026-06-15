"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import Link from "next/link";
import { Sparkles, Landmark, CalendarRange, Plus, CheckCircle2, XCircle, Clock, Loader2, ArrowRight, AlertTriangle, ShieldCheck, X, FileImage } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ActiveTripCard from "@/components/trips/ActiveTripCard";
import { useActiveTrips } from "@/hooks/useActiveTripStatus";

interface DocUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploadedUrl: string | null;
  error: string | null;
}

const initialUploadState = (): DocUploadState => ({
  file: null, preview: null, uploading: false, uploadedUrl: null, error: null
});

function DocumentUploadZone({
  label, hint, accept, state, onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  state: DocUploadState;
  onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-neutral-500 dark:text-neutral-400">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[120px] group
          ${state.uploadedUrl
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-neutral-200 dark:border-neutral-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
        />

        {state.uploading ? (
          <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
        ) : state.uploadedUrl ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Uploaded</p>
          </>
        ) : (
          <>
            {state.preview ? (
              <img src={state.preview} alt="preview" className="h-12 w-auto rounded-lg object-cover opacity-80" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-white transition">
                <FileImage className="h-5 w-5 text-neutral-400" />
              </div>
            )}
            <div className="text-center">
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Drag & drop or <span className="text-primary-500">browse</span></p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{hint}</p>
            </div>
          </>
        )}
        {state.error && <p className="text-[10px] text-red-500 font-semibold mt-1">{state.error}</p>}
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { dashboardStats, isLoading, fetchDashboardStats } = useAuthStore();
  const { activeTrips, isLoading: activeTripsLoading, refetch } = useActiveTrips();
  
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showKycBanner, setShowKycBanner] = useState(true);

  useEffect(() => {
    api.get("/api/host-kyc/status")
      .then((r) => setKycStatus(r.data.host_kyc_status))
      .catch(() => {});
  }, []);
  
  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input fields
  const [vehicleName, setVehicleName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("car");
  const [regNo, setRegNo] = useState("");
  const [fuel, setFuel] = useState("Petrol");
  const [seats, setSeats] = useState(5);
  const [load, setLoad] = useState(0.0);
  const [basePrice, setBasePrice] = useState(1000.0);
  const [pricePerKm, setPricePerKm] = useState(10.0);
  const [driverAvailable, setDriverAvailable] = useState(false);
  const [driverCost, setDriverCost] = useState(800.0);
  const [location, setLocation] = useState("Indiranagar, Bangalore");
  const [photoState, setPhotoState] = useState<DocUploadState>(initialUploadState());
  const [rcState, setRcState] = useState<DocUploadState>(initialUploadState());
  const [insuranceState, setInsuranceState] = useState<DocUploadState>(initialUploadState());

  const handleUploadFile = async (file: File, stateSetter: React.Dispatch<React.SetStateAction<DocUploadState>>) => {
    stateSetter(prev => ({
      ...prev,
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      error: null
    }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/vehicles/upload-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      stateSetter(prev => ({ ...prev, uploading: false, uploadedUrl: res.data.url }));
    } catch (error) {
      stateSetter(prev => ({ ...prev, uploading: false, error: "Upload failed" }));
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/api/vehicles", {
        vehicle_name: vehicleName,
        vehicle_category: category,
        brand,
        model,
        registration_number: regNo,
        fuel_type: fuel,
        seating_capacity: Number(seats),
        load_capacity: Number(load),
        base_price: Number(basePrice),
        price_per_km: Number(pricePerKm),
        driver_available: driverAvailable,
        driver_cost: driverAvailable ? Number(driverCost) : 0.0,
        location,
        images: photoState.uploadedUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600",
        rc_url: rcState.uploadedUrl,
        insurance_url: insuranceState.uploadedUrl
      });

      alert("Vehicle listed successfully!");
      setShowAddForm(false);
      
      // Clear inputs
      setVehicleName("");
      setBrand("");
      setModel("");
      setRegNo("");
      setPhotoState(initialUploadState());
      setRcState(initialUploadState());
      setInsuranceState(initialUploadState());

      // Reload analytics & vehicles lists
      await fetchDashboardStats();
    } catch (error) {
      alert("Failed to submit listing. Please review input fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}`, {
        status: status
      });
      alert(`Trip status updated to ${status}.`);
      await fetchDashboardStats();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to update booking status.");
    }
  };

  if (isLoading || !dashboardStats) {
    return (
      <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 h-[250px] animate-pulse flex flex-col justify-between dark:bg-neutral-900 dark:border-neutral-800">
        <div className="h-6 bg-slate-100 rounded w-1/4 dark:bg-neutral-800" />
        <div className="h-12 bg-slate-100 rounded-xl dark:bg-neutral-800 mt-6" />
      </div>
    );
  }

  const { total_vehicles, active_bookings, total_earnings, vehicles = [], chart_data = [], pending_requests = [] } = dashboardStats;

  // Render chart tooltip nicely
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-xl shadow-lg dark:bg-neutral-800 dark:border-neutral-700">
          <p className="text-xs font-bold text-neutral-500 mb-1">{label}</p>
          <p className="text-sm font-extrabold text-primary-600">₹{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KYC Status Banner */}
      {showKycBanner && kycStatus && kycStatus !== "approved" && (
        <div className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-sm ${
          kycStatus === "unsubmitted" ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300" :
          kycStatus === "pending"     ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300" :
                                        "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300"
        }`}>
          {kycStatus === "unsubmitted" && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
          {kycStatus === "pending"     && <Clock className="h-4 w-4 shrink-0 mt-0.5" />}
          {kycStatus === "rejected"    && <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-bold">
              {kycStatus === "unsubmitted" && "Action Required: Upload your KYC documents"}
              {kycStatus === "pending"     && "KYC Under Review"}
              {kycStatus === "rejected"    && "KYC Rejected — Re-upload required"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {kycStatus === "unsubmitted" && "Your host account won't be activated until Aadhaar and PAN documents are verified."}
              {kycStatus === "pending"     && "Your documents are being reviewed. You'll be notified once approved (within 24 hrs)."}
              {kycStatus === "rejected"    && "One or more documents were rejected. Please upload valid documents again."}
            </p>
            {(kycStatus === "unsubmitted" || kycStatus === "rejected") && (
              <Link href="/onboarding/host" className="inline-flex items-center gap-1 text-xs font-bold mt-2 underline underline-offset-2">
                Upload Documents <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button onClick={() => setShowKycBanner(false)} className="opacity-50 hover:opacity-100 transition shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Host Dashboard</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs px-4 h-9 rounded-lg flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">List a New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Vehicle Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Royal Enfield Classic"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Brand</label>
                <input
                  type="text"
                  required
                  placeholder="Royal Enfield"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Model</label>
                <input
                  type="text"
                  required
                  placeholder="Classic 350"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                >
                  <option value="two_wheeler">Two Wheeler</option>
                  <option value="three_wheeler">Three Wheeler</option>
                  <option value="car">Car/SUV</option>
                  <option value="van">Cargo Van</option>
                  <option value="pickup">Pickup Truck</option>
                  <option value="heavy_goods">Heavy Goods vehicle</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Registration number</label>
                <input
                  type="text"
                  required
                  placeholder="KA-03-HA-4321"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Fuel Type</label>
                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Base Price (INR)</label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Price per KM (INR)</label>
                <input
                  type="number"
                  required
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(Number(e.target.value))}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Seats Limit</label>
                <input
                  type="number"
                  required
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Load tons (Optional)</label>
                <input
                  type="number"
                  value={load}
                  onChange={(e) => setLoad(Number(e.target.value))}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 border rounded-xl px-3 h-10 dark:border-neutral-700">
                <input
                  type="checkbox"
                  checked={driverAvailable}
                  onChange={(e) => setDriverAvailable(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary-500 border-neutral-300 rounded"
                />
                <span className="font-bold text-neutral-600">Provide Driver Option</span>
              </div>
              {driverAvailable && (
                <div>
                  <label className="block font-bold text-neutral-500 mb-1">Driver Daily Fares (INR)</label>
                  <input
                    type="number"
                    value={driverCost}
                    onChange={(e) => setDriverCost(Number(e.target.value))}
                    className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                  />
                </div>
              )}
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Pickup Station Base</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DocumentUploadZone 
                label="Vehicle Photo" 
                hint="Clear exterior picture" 
                accept="image/*" 
                state={photoState} 
                onChange={(f) => handleUploadFile(f, setPhotoState)} 
              />
              <DocumentUploadZone 
                label="RC Document" 
                hint="Registration Certificate" 
                accept="image/*,.pdf" 
                state={rcState} 
                onChange={(f) => handleUploadFile(f, setRcState)} 
              />
              <DocumentUploadZone 
                label="Insurance" 
                hint="Valid vehicle insurance" 
                accept="image/*,.pdf" 
                state={insuranceState} 
                onChange={(f) => handleUploadFile(f, setInsuranceState)} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="border px-4 h-9 rounded-lg font-semibold text-neutral-600 dark:border-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-500 text-white px-4 h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow"
              >
                {isSubmitting ? <Loader2 className="h-4 animate-spin" /> : <span>Submit Listing</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout conforming to Reference Layout (4 Quadrants) */}
      <div className="flex flex-col gap-6">
        
        {/* Phase 5: Ongoing Host Trips Panel */}
        {!activeTripsLoading && activeTrips.length > 0 && (
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase mb-6">Active Bookings</h3>
            {activeTrips.map(trip => (
              <ActiveTripCard key={trip.id} trip={trip} role="host" onRefresh={refetch} />
            ))}
          </div>
        )}

        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top-Left: Host Analytics Card */}
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase mb-6">Host Analytics</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-400">Total Revenue</p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white">₹{total_earnings}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-400">Completed Bookings</p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white">
                        {vehicles.reduce((acc: number, v: any) => acc + (v.total_trips || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-400">Active Vehicles</p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white">{total_vehicles}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top-Right: Host's Uploaded Vehicles */}
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase">My Vehicles</h3>
              <span className="text-xs font-bold text-primary-500 cursor-pointer">View All</span>
            </div>
            
            {vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-bold">No vehicles uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 h-[250px] overflow-y-auto pr-1">
                {vehicles.map((v: any) => (
                  <div key={v.id} className="relative group bg-neutral-50 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700 flex flex-col">
                    <div className="h-24 w-full bg-neutral-200 dark:bg-neutral-700 relative shrink-0">
                      {v.images ? (
                        <img src={v.images.split(',')[0]} alt={v.vehicle_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                          v.current_status === "On Rent" ? "bg-blue-500/90 text-white border-blue-600/50" :
                          v.current_status === "Pending Approval" ? "bg-amber-500/90 text-white border-amber-600/50" :
                          "bg-emerald-500/90 text-white border-emerald-600/50"
                        }`}>
                          {v.current_status}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white text-xs truncate">{v.vehicle_name}</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{v.registration_number}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-extrabold text-primary-600 text-xs truncate mr-1">₹{v.total_earned} <span className="text-[9px] text-neutral-400 font-normal">earned</span></span>
                        <span className="text-[10px] bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 font-semibold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {v.total_trips} Trips
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bottom-Left: Line Chart (Revenue Over Time) */}
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase mb-6">Revenue Over Time (7 Days)</h3>
            <div className="h-[250px] w-full">
              {chart_data && chart_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart_data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs font-bold text-neutral-400">No chart data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Right: Pending Booking Requests */}
          <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase">Pending Booking Requests</h3>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pending_requests.length} New
              </span>
            </div>
            
            {pending_requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-bold">You're all caught up!</p>
                <p className="text-[10px]">No pending requests right now.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[250px]">
                {pending_requests.map((req: any) => (
                  <div key={req.id} className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 transition hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{req.user?.name || "Guest"}</h4>
                        <p className="text-[11px] font-semibold text-primary-600">{req.vehicle?.vehicle_name}</p>
                      </div>
                      <span className="font-extrabold text-neutral-900 dark:text-white">₹{req.total_amount}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4 text-[10px] font-bold text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(req.from_dt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })} - {new Date(req.to_dt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">
                          {req.pickup_address?.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateBookingStatus(req.id, "confirmed")}
                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateBookingStatus(req.id, "cancelled")}
                        className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold py-2 rounded-xl text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
