"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { Vehicle } from "@/types";
import VehicleCard from "@/components/VehicleCard";
import HeroNavbar from "@/components/HeroNavbar";
import { useAuthStore } from "@/store/authStore";
import { Search, Loader2, Info, MapPin, Calendar, Filter } from "lucide-react";

function VehiclesBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state variables
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [fuelType, setFuelType] = useState(searchParams.get("fuel_type") || "");

  useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true);
      setError(null);

      // Build parameters query string
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (location) params.append("location", location);
      if (fuelType) params.append("fuel_type", fuelType);

      try {
        const response = await api.get(`/api/vehicles?${params.toString()}`);
        setVehicles(response.data);
      } catch (err: any) {
        setError("Could not load vehicles. Please ensure the backend server is running.");
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicles();
  }, [category, location, fuelType]);

  // Derived filters for pills
  const toggleCategory = (cat: string) => {
    setCategory(category === cat ? "" : cat);
  };
  
  const toggleFuel = (fuel: string) => {
    setFuelType(fuelType === fuel ? "" : fuel);
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <HeroNavbar />
      
      {/* FlexiRide-style Top Search Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Location & Time Summary */}
            <div className="flex items-center gap-4 bg-[#f5f5f5] px-4 py-2 rounded-xl w-full md:w-auto">
              <div className="flex items-center gap-2 pr-4 border-r border-neutral-300">
                <MapPin className="w-5 h-5 text-[#10a310]" />
                <span className="font-bold text-neutral-900 text-sm">{location || "Anywhere"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#10a310]" />
                <span className="text-xs font-medium text-neutral-600">
                  {start ? new Date(start).toLocaleDateString() : "Start"} - {end ? new Date(end).toLocaleDateString() : "End"}
                </span>
              </div>
              <button 
                onClick={() => router.push("/")}
                className="ml-auto md:ml-4 text-xs font-bold text-[#10a310] hover:text-[#0d8c0d]"
              >
                Change
              </button>
            </div>

            {/* Quick Filter Pills (FlexiRide style) */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar py-1">
              <div className="flex items-center gap-1 mr-2 text-neutral-400">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
              </div>
              
              <button 
                onClick={() => toggleCategory("car")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${category === 'car' ? 'bg-[#10a310]/10 border-[#10a310] text-[#10a310]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                Cars
              </button>
              <button 
                onClick={() => toggleCategory("suv")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${category === 'suv' ? 'bg-[#10a310]/10 border-[#10a310] text-[#10a310]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                SUVs
              </button>
              <button 
                onClick={() => toggleCategory("two_wheeler")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${category === 'two_wheeler' ? 'bg-[#10a310]/10 border-[#10a310] text-[#10a310]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                2-Wheelers
              </button>
              <button 
                onClick={() => toggleFuel("Petrol")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${fuelType === 'Petrol' ? 'bg-[#10a310]/10 border-[#10a310] text-[#10a310]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                Petrol
              </button>
              <button 
                onClick={() => toggleFuel("Diesel")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${fuelType === 'Diesel' ? 'bg-[#10a310]/10 border-[#10a310] text-[#10a310]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                Diesel
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-xl font-black text-neutral-900 mb-6">Available Vehicles</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-4 h-[350px] animate-pulse flex flex-col justify-between">
                <div className="w-full h-40 bg-neutral-100 rounded-lg" />
                <div className="h-4 bg-neutral-100 rounded w-2/3 mt-4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2 mt-2" />
                <div className="h-10 bg-neutral-100 rounded-lg w-full mt-6" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <Info className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-neutral-800 font-bold">{error}</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-sm">
            <Info className="h-10 w-10 text-[#10a310] mx-auto mb-4" />
            <p className="font-bold text-neutral-900 text-lg mb-2">No vehicles found</p>
            <p className="text-neutral-500 mb-6">Try adjusting your filters or location to see more options.</p>
            <button
              onClick={() => { setCategory(""); setFuelType(""); }}
              className="bg-[#10a310] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[#0d8c0d] transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isOwnVehicle={!!user && user.role === "host" && vehicle.owner_id === user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesBrowse() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-[#10a310]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    }>
      <VehiclesBrowseContent />
    </Suspense>
  );
}
