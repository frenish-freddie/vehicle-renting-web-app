"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { Sparkles, Landmark, CalendarRange, Plus, ShieldCheck, Settings, Loader2, ArrowRight } from "lucide-react";

export default function OwnerDashboard() {
  const { dashboardStats, isLoading, fetchDashboardStats } = useAuthStore();
  
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
  const [imageUrl, setImageUrl] = useState("");

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
        images: imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
      });

      alert("Vehicle listed successfully!");
      setShowAddForm(false);
      
      // Clear inputs
      setVehicleName("");
      setBrand("");
      setModel("");
      setRegNo("");
      setImageUrl("");

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
    } catch (error) {
      alert("Failed to update booking status.");
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

  const { total_vehicles, active_bookings, total_earnings, recent_requests, vehicles } = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Overview Analytics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Earnings */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Revenue</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              ₹{total_earnings}
            </span>
          </div>
        </div>

        {/* Fleet size */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">My Fleet</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {total_vehicles} Vehicles
            </span>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="bg-white border border-neutral-200/50 p-5 rounded-2xl shadow-sm flex items-center gap-4 dark:bg-neutral-900 dark:border-neutral-800">
          <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CalendarRange className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Active Bookings</span>
            <span className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5 block">
              {active_bookings} Reserv.
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions panel */}
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Active Fleet & Listings</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs px-4 h-9 rounded-lg flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Add Vehicle Form overlay */}
      {showAddForm && (
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-md dark:bg-neutral-900 dark:border-neutral-800">
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

            <div>
              <label className="block font-bold text-neutral-500 mb-1">Image URL (Optional)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full h-10 border rounded-xl px-3 outline-none dark:bg-neutral-800 dark:border-neutral-700 focus:border-primary-500"
              />
            </div>

            {/* Form actions */}
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
                {isSubmitting ? (
                  <Loader2 className="h-4 animate-spin" />
                ) : (
                  <span>Submit Listing</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fleet List */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-4">My Fleet Listings</h3>
          {vehicles.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No vehicles listed under this account.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {vehicles.map((v: any) => (
                <div key={v.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4">
                  <div>
                    <h4 className="font-bold text-neutral-850 dark:text-white capitalize">{v.vehicle_name}</h4>
                    <p className="text-neutral-400 mt-0.5">{v.registration_number} • {v.location}</p>
                  </div>
                  <span className="font-extrabold text-neutral-800 dark:text-neutral-300">₹{v.base_price} base</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Bookings requests */}
        <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800/80">
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-4">Customer Requests</h3>
          {recent_requests.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No reservations found on your fleet.</p>
          ) : (
            <div className="space-y-4">
              {recent_requests.map((req: any) => (
                <div key={req.id} className="p-3 border border-neutral-100 rounded-2xl dark:border-neutral-800 text-[11px] space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-neutral-850 dark:text-white">{req.vehicle?.vehicle_name}</span>
                    <span className="text-primary-600">₹{req.total_amount}</span>
                  </div>
                  <div className="text-neutral-400">
                    <p>Client: {req.user?.name}</p>
                    <p className="mt-0.5 truncate">Route: {req.pickup_address?.split(",")[0] || "Pickup"} → {req.delivery_address?.split(",")[0] || "Delivery"}</p>
                  </div>

                  {req.status === "confirmed" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateBookingStatus(req.id, "ongoing")}
                        className="w-1/2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-1.5 rounded-lg shadow-sm"
                      >
                        Start Trip
                      </button>
                      <button
                        onClick={() => handleUpdateBookingStatus(req.id, "cancelled")}
                        className="w-1/2 border border-neutral-200 hover:bg-neutral-50 py-1.5 rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {req.status === "ongoing" && (
                    <button
                      onClick={() => handleUpdateBookingStatus(req.id, "completed")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg mt-2"
                    >
                      Complete Ride
                    </button>
                  )}
                  {req.status !== "confirmed" && req.status !== "ongoing" && (
                    <span className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold capitalize mt-1">
                      Status: {req.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
