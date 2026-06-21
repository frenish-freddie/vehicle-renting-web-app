"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const toAbsUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/static/")) return `${BACKEND}${url}`;
  return url;
};
import {
  Sparkles, Landmark, Plus, CheckCircle2, XCircle, Clock, Loader2,
  ArrowRight, AlertTriangle, X, FileImage, Car, CarFront,
  Fuel, IndianRupee, Users, FileText, Image, ShieldCheck,
  Eye, LayoutGrid, PlusCircle, Zap, Filter, Search
} from "lucide-react";
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
  label, hint, accept, state, onChange, required = false,
}: {
  label: string; hint: string; accept: string;
  state: DocUploadState; onChange: (file: File) => void; required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[100px] group
          ${state.uploadedUrl
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-neutral-200 dark:border-neutral-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10"
          }`}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
        {state.uploading ? (
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
        ) : state.uploadedUrl ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Uploaded ✓</p>
            {state.preview && <img src={state.preview} alt="preview" className="h-8 w-auto rounded object-cover opacity-70" />}
          </>
        ) : (
          <>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-primary-100 transition">
              <FileImage className="h-4 w-4 text-neutral-400 group-hover:text-primary-500" />
            </div>
            <p className="text-[10px] font-semibold text-neutral-500 text-center">
              Drop or <span className="text-primary-500">browse</span>
            </p>
            <p className="text-[9px] text-neutral-400">{hint}</p>
          </>
        )}
        {state.error && <p className="text-[9px] text-red-500 font-semibold">{state.error}</p>}
      </div>
    </div>
  );
}

type Tab = "overview" | "fleet" | "add";

export default function OwnerDashboard() {
  const { dashboardStats, isLoading, fetchDashboardStats } = useAuthStore();
  const { activeTrips, isLoading: activeTripsLoading, refetch } = useActiveTrips();

  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showKycBanner, setShowKycBanner] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetFilter, setFleetFilter] = useState("all");

  // Refresh dashboard when switching to fleet tab
  const handleTabChange = useCallback(async (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "fleet") {
      await fetchDashboardStats();
    }
  }, [fetchDashboardStats]);

  // Add Vehicle Form State
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("car");
  const [subType, setSubType] = useState("Sedan");
  const [regNo, setRegNo] = useState("");
  const [color, setColor] = useState("");
  const [fuel, setFuel] = useState("Petrol");
  const [transmission, setTransmission] = useState("Manual");
  const [seats, setSeats] = useState(5);
  const [priceDaily, setPriceDaily] = useState(1500);
  const [priceHourly, setPriceHourly] = useState(200);
  const [deposit, setDeposit] = useState(5000);
  const [excessKmCharge, setExcessKmCharge] = useState(10);
  const [driverAvailable, setDriverAvailable] = useState(false);
  const [driverRate, setDriverRate] = useState(800);
  const [photoState, setPhotoState] = useState<DocUploadState>(initialUploadState());
  const [rcState, setRcState] = useState<DocUploadState>(initialUploadState());
  const [insuranceState, setInsuranceState] = useState<DocUploadState>(initialUploadState());

  useEffect(() => {
    api.get("/api/host-kyc/status")
      .then((r) => setKycStatus(r.data.host_kyc_status))
      .catch(() => {});
  }, []);

  const handleUploadFile = async (file: File, setter: React.Dispatch<React.SetStateAction<DocUploadState>>) => {
    setter(prev => ({ ...prev, file, preview: URL.createObjectURL(file), uploading: true, error: null }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/vehicles/upload-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setter(prev => ({ ...prev, uploading: false, uploadedUrl: res.data.url }));
    } catch {
      setter(prev => ({ ...prev, uploading: false, error: "Upload failed. Try again." }));
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcState.uploadedUrl) {
      alert("RC Book document is required before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/vehicles", {
        category,
        sub_type: subType,
        brand,
        model,
        year: Number(year),
        description,
        registration_no: regNo,
        color,
        fuel_type: fuel,
        transmission,
        seats: Number(seats),
        price_daily: Number(priceDaily),
        price_hourly: Number(priceHourly),
        security_deposit: Number(deposit),
        excess_km_charge: Number(excessKmCharge),
        is_driver_available: driverAvailable,
        driver_daily_rate: driverAvailable ? Number(driverRate) : 0.0,
        images: photoState.uploadedUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600",
        rc_url: rcState.uploadedUrl,
        insurance_url: insuranceState.uploadedUrl || null,
        documents_required: "{}",
      });
      setSubmitSuccess(true);
      await fetchDashboardStats();
      // Reset form
      setBrand(""); setModel(""); setDescription(""); setRegNo(""); setColor("");
      setPhotoState(initialUploadState()); setRcState(initialUploadState()); setInsuranceState(initialUploadState());
      setTimeout(() => { setSubmitSuccess(false); setActiveTab("fleet"); }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit listing. Check all required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}`, { status });
      alert(`Booking status updated to ${status}.`);
      await fetchDashboardStats();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to update booking status.");
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      await fetchDashboardStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete vehicle.");
    }
  };

  if (isLoading || !dashboardStats) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-neutral-200/50 rounded-3xl p-6 h-[120px] animate-pulse dark:bg-neutral-900 dark:border-neutral-800" />
        ))}
      </div>
    );
  }

  const { total_vehicles, active_bookings, total_earnings, vehicles = [], chart_data = [], pending_requests = [] } = dashboardStats;

  const filteredFleet = vehicles.filter((v: any) => {
    const matchSearch = `${v.vehicle_name} ${v.registration_number}`.toLowerCase().includes(fleetSearch.toLowerCase());
    const matchFilter = fleetFilter === "all" || 
      (fleetFilter === "available" && v.current_status === "Available") ||
      (fleetFilter === "on_rent" && v.current_status === "On Rent") ||
      (fleetFilter === "pending" && !v.is_approved);
    return matchSearch && matchFilter;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-xl shadow-lg dark:bg-neutral-800 dark:border-neutral-700">
          <p className="text-xs font-bold text-neutral-500 mb-1">{label}</p>
          <p className="text-sm font-extrabold text-primary-600">₹{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const subTypeOptions: Record<string, string[]> = {
    two_wheeler: ["Scooter", "Motorcycle", "Sports Bike"],
    car: ["Sedan", "Hatchback", "SUV", "MUV", "Coupe", "Convertible"],
    commercial: ["Mini Truck", "Pickup", "Van"],
    machinery: ["JCB", "Crane", "Loader"],
    special: ["Ambulance", "Camper"],
  };

  return (
    <div className="space-y-5">
      {/* KYC Banner */}
      {showKycBanner && kycStatus && kycStatus !== "approved" && (
        <div className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-sm ${
          kycStatus === "unsubmitted" ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300" :
          kycStatus === "pending" ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300" :
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300"
        }`}>
          {kycStatus === "unsubmitted" && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
          {kycStatus === "pending" && <Clock className="h-4 w-4 shrink-0 mt-0.5" />}
          {kycStatus === "rejected" && <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-bold text-sm">
              {kycStatus === "unsubmitted" && "Action Required: Upload your host KYC documents"}
              {kycStatus === "pending" && "Host KYC Under Review — Hang tight!"}
              {kycStatus === "rejected" && "KYC Rejected — Please re-upload valid documents"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {kycStatus === "unsubmitted" && "Your host account won't be activated until your Aadhaar is verified."}
              {kycStatus === "pending" && "Documents are being reviewed. You'll be notified within 24 hrs."}
              {kycStatus === "rejected" && "One or more documents were rejected. Please upload valid documents again."}
            </p>
            {(kycStatus === "unsubmitted" || kycStatus === "rejected") && (
              <Link href="/onboarding/host" className="inline-flex items-center gap-1 text-xs font-bold mt-1.5 underline underline-offset-2">
                Upload Documents <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button onClick={() => setShowKycBanner(false)} className="opacity-50 hover:opacity-100 transition shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 gap-1">
          {([
            { id: "overview", icon: LayoutGrid, label: "Overview" },
            { id: "fleet", icon: Car, label: `My Fleet (${total_vehicles})` },
            { id: "add", icon: PlusCircle, label: "Add Vehicle" },
          ] as {id: Tab; icon: any; label: string}[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab !== "add" && (
          <button
            onClick={() => setActiveTab("add")}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-4 h-9 rounded-xl shadow transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Vehicle
          </button>
        )}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          {/* Active Trips */}
          {!activeTripsLoading && activeTrips.length > 0 && (
            <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase mb-4">Active Trips</h3>
              {activeTrips.map(trip => (
                <ActiveTripCard key={trip.id} trip={trip} role="host" onRefresh={refetch} />
              ))}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Revenue", value: `₹${total_earnings}`, icon: Landmark, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600" },
              { label: "Active Bookings", value: active_bookings, icon: Zap, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
              { label: "Fleet Size", value: total_vehicles, icon: Car, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-neutral-200/50 rounded-2xl p-4 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                <div className={`h-9 w-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-bold text-neutral-400">{stat.label}</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue Chart */}
            <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase mb-5">Revenue — Last 7 Days</h3>
              <div className="h-[220px] w-full min-w-0">
                {chart_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart_data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3}
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs font-bold text-neutral-400">No revenue data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-neutral-500 text-xs tracking-wider uppercase">Pending Requests</h3>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pending_requests.length} New</span>
              </div>
              {pending_requests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-bold">All caught up!</p>
                  <p className="text-[10px]">No pending requests right now.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[220px]">
                  {pending_requests.map((req: any) => (
                    <div key={req.id} className="p-3.5 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{req.user?.name || "Guest"}</h4>
                          <p className="text-[11px] font-semibold text-primary-600">{req.vehicle?.brand} {req.vehicle?.model}</p>
                        </div>
                        <span className="font-extrabold text-neutral-900 dark:text-white text-sm">₹{req.total_amount}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(req.from_dt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })} – {new Date(req.to_dt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateBookingStatus(req.id, "confirmed")}
                          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-1.5 rounded-xl text-xs transition">Approve</button>
                        <button onClick={() => handleUpdateBookingStatus(req.id, "cancelled")}
                          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-1.5 rounded-xl text-xs transition">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MY FLEET ── */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name or reg. no..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 outline-none focus:border-primary-400"
              />
            </div>
            <select
              value={fleetFilter}
              onChange={(e) => setFleetFilter(e.target.value)}
              className="h-9 px-3 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 outline-none focus:border-primary-400 font-semibold"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="on_rent">On Rent</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          {filteredFleet.length === 0 ? (
            <div className="bg-white border border-neutral-200/50 rounded-3xl p-12 text-center dark:bg-neutral-900 dark:border-neutral-800">
              <Car className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-bold text-neutral-500 dark:text-neutral-400">
                {vehicles.length === 0 ? "No vehicles in your fleet yet" : "No vehicles match your filter"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {vehicles.length === 0 ? "Click \"Add New Vehicle\" to list your first vehicle." : "Try a different search or filter."}
              </p>
              {vehicles.length === 0 && (
                <button onClick={() => setActiveTab("add")}
                  className="mt-4 inline-flex items-center gap-1.5 bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl">
                  <Plus className="h-3.5 w-3.5" /> Add Your First Vehicle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFleet.map((v: any) => {
                const status = !v.is_approved ? "Pending Approval" : v.current_status || "Available";
                const statusColor = status === "On Rent" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                  status === "Pending Approval" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
                return (
                  <div key={v.id} className="bg-white border border-neutral-200/50 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-36 w-full bg-neutral-100 dark:bg-neutral-800 relative">
                      {v.images ? (
                        <img
                          src={toAbsUrl(v.images.split(',')[0]) || ''}
                          alt={v.vehicle_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="font-black text-neutral-900 text-lg leading-tight dark:text-white">{v.vehicle_name}</h3>
                        <p className="text-xs font-bold text-neutral-400 mt-0.5 tracking-wider uppercase">{v.registration_number}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                        <div>
                          <p className="text-[10px] text-neutral-400">Daily Rate</p>
                          <p className="text-sm font-extrabold text-primary-600">₹{v.base_price}<span className="text-[9px] font-normal text-neutral-400">/day</span></p>
                        </div>
                        <div className="text-center border-x border-neutral-100 dark:border-neutral-800">
                          <p className="text-[10px] text-neutral-400">Trips</p>
                          <p className="text-sm font-extrabold text-neutral-900 dark:text-white">{v.total_trips}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-neutral-400">Earned</p>
                          <p className="text-sm font-extrabold text-emerald-600">₹{v.total_earned}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition dark:bg-red-900/20 dark:hover:bg-red-900/40"
                        >
                          Remove Vehicle
                        </button>
                      </div>
                    </div>
                      {status === "Pending Approval" && (
                        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">⏳ Awaiting RC book verification by admin</p>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ADD VEHICLE ── */}
      {activeTab === "add" && (
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="font-extrabold text-xl text-neutral-900 dark:text-white">Vehicle Listed!</h3>
              <p className="text-sm text-neutral-500 text-center max-w-xs">Your vehicle has been submitted for RC verification. It'll be active once an admin approves it.</p>
              <p className="text-xs text-primary-500 font-bold animate-pulse">Redirecting to fleet view…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <CarFront className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 dark:text-white">List a New Vehicle</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Fill in the details below. RC Book upload is mandatory for approval.</p>
                </div>
              </div>

              <form onSubmit={handleAddVehicle} className="space-y-6 text-xs">
                {/* Section 1: Basic Info */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Car className="h-3.5 w-3.5" /> Vehicle Identity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Brand <span className="text-red-500">*</span></label>
                      <input required value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Toyota"
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Model <span className="text-red-500">*</span></label>
                      <input required value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Innova Crysta"
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Year <span className="text-red-500">*</span></label>
                      <input required type="number" min={2000} max={new Date().getFullYear()} value={year} onChange={e => setYear(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Category <span className="text-red-500">*</span></label>
                      <select value={category} onChange={e => { setCategory(e.target.value); setSubType(subTypeOptions[e.target.value]?.[0] || ""); }}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500">
                        <option value="two_wheeler">Two Wheeler</option>
                        <option value="car">Car / SUV</option>
                        <option value="commercial">Commercial Vehicle</option>
                        <option value="machinery">Machinery / Heavy Equipment</option>
                        <option value="special">Special Vehicle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Sub-Type <span className="text-red-500">*</span></label>
                      <select value={subType} onChange={e => setSubType(e.target.value)}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500">
                        {(subTypeOptions[category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Registration No. <span className="text-red-500">*</span></label>
                      <input required value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="KL-07-AB-1234"
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Color</label>
                      <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Pearl White"
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Seats</label>
                      <input type="number" min={1} max={60} value={seats} onChange={e => setSeats(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Engine & Transmission */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Fuel className="h-3.5 w-3.5" /> Engine & Specs
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Fuel Type <span className="text-red-500">*</span></label>
                      <select value={fuel} onChange={e => setFuel(e.target.value)}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500">
                        <option>Petrol</option>
                        <option>Diesel</option>
                        <option>CNG</option>
                        <option>Electric</option>
                        <option>Hybrid</option>
                        <option>LPG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Transmission</label>
                      <select value={transmission} onChange={e => setTransmission(e.target.value)}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500">
                        <option>Manual</option>
                        <option>Automatic</option>
                        <option>CVT</option>
                        <option>AMT</option>
                        <option>DCT</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Description */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> Description
                  </h4>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    placeholder="Describe your vehicle — condition, features, special notes for renters..."
                    className="w-full border rounded-xl p-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500 resize-none" />
                </div>

                {/* Section 4: Pricing */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5" /> Pricing & Rates
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Daily Rate (₹) <span className="text-red-500">*</span></label>
                      <input required type="number" min={0} value={priceDaily} onChange={e => setPriceDaily(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Hourly Rate (₹)</label>
                      <input type="number" min={0} value={priceHourly} onChange={e => setPriceHourly(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Security Deposit (₹)</label>
                      <input type="number" min={0} value={deposit} onChange={e => setDeposit(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300 mb-1">Excess KM Charge (₹)</label>
                      <input type="number" min={0} value={excessKmCharge} onChange={e => setExcessKmCharge(Number(e.target.value))}
                        className="w-full h-10 border rounded-xl px-3 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                    <input type="checkbox" id="driver-toggle" checked={driverAvailable} onChange={e => setDriverAvailable(e.target.checked)}
                      className="h-4 w-4 text-primary-500 border-neutral-300 rounded" />
                    <label htmlFor="driver-toggle" className="font-bold text-neutral-700 dark:text-neutral-300 flex-1 cursor-pointer">
                      Offer Driver with this Vehicle
                    </label>
                    {driverAvailable && (
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">Driver Daily Rate:</span>
                        <input type="number" min={0} value={driverRate} onChange={e => setDriverRate(Number(e.target.value))}
                          className="w-24 h-8 border rounded-lg px-2 outline-none text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500" />
                        <span className="text-neutral-400">₹/day</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Documents & Photos */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Documents & Photos
                  </h4>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mb-3">
                    ⚠ RC Book is required. Your vehicle will be hidden from listings until an admin verifies it.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DocumentUploadZone label="Vehicle Photo" hint="Clear exterior shot (JPG/PNG)" accept="image/*"
                      state={photoState} onChange={f => handleUploadFile(f, setPhotoState)} />
                    <DocumentUploadZone label="RC Book" hint="Registration Certificate (PDF/Image)" accept="image/*,.pdf"
                      state={rcState} onChange={f => handleUploadFile(f, setRcState)} required />
                    <DocumentUploadZone label="Insurance Document" hint="Valid insurance copy (optional)" accept="image/*,.pdf"
                      state={insuranceState} onChange={f => handleUploadFile(f, setInsuranceState)} />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button type="button" onClick={() => setActiveTab("overview")}
                    className="border border-neutral-200 dark:border-neutral-700 px-5 h-10 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 h-10 rounded-xl font-bold flex items-center gap-2 shadow transition disabled:opacity-60">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CarFront className="h-4 w-4" /> Submit Listing</>}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
