"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { Vehicle } from "@/types";
import VehicleCard from "@/components/VehicleCard";
import HeroNavbar from "@/components/HeroNavbar";
import { Loader2, Info, MapPin, Calendar, Filter, Map as MapIcon, List } from "lucide-react";

function SearchBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state variables
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [tripType, setTripType] = useState(searchParams.get("trip_type") || "");
  const [fuelType, setFuelType] = useState(searchParams.get("fuel_type") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true);
      setError(null);

      // Build parameters query string
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (location) params.append("location", location);
      if (fuelType) params.append("fuel_type", fuelType);
      // Backend expects `is_driver_available` boolean, we map trip_type
      if (tripType === "with_driver" || tripType === "operator") {
        params.append("is_driver_available", "true");
      }
      if (searchQuery) params.append("search", searchQuery);

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
  }, [category, location, fuelType, tripType, searchQuery]);

  // Derived filters for pills
  const toggleCategory = (cat: string) => setCategory(category === cat ? "" : cat);
  const toggleTripType = (type: string) => setTripType(tripType === type ? "" : type);

  return (
    <div className="bg-surface min-h-screen pb-20">
      <HeroNavbar />
      
      {/* Top Search Bar */}
      <div className="bg-white border-b border-border sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Location & Time Summary */}
            <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-input border border-border w-full md:w-auto">
              <div className="flex items-center gap-2 pr-4 border-r border-border">
                <MapPin className="w-4 h-4 text-accent-amber" />
                <span className="font-bold text-primary-dark text-sm">{location || "Anywhere"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-amber" />
                <span className="text-xs font-bold text-text-muted">
                  {start ? new Date(start).toLocaleDateString() : "Any Date"} - {end ? new Date(end).toLocaleDateString() : "Any Date"}
                </span>
              </div>
              <button 
                onClick={() => router.push("/")}
                className="ml-auto md:ml-4 text-xs font-bold text-primary-dark hover:text-accent-amber transition-colors"
              >
                Change
              </button>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar py-1">
              <div className="flex items-center gap-1 mr-2 text-text-muted border-r border-border pr-2">
                <Filter className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
              </div>
              
              <button onClick={() => toggleCategory("two_wheeler")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${category === 'two_wheeler' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>2-Wheeler</button>
              <button onClick={() => toggleCategory("car")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${category === 'car' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>Cars</button>
              <button onClick={() => toggleCategory("commercial")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${category === 'commercial' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>Commercial</button>
              <button onClick={() => toggleCategory("machinery")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${category === 'machinery' ? 'bg-primary-dark text-white border-primary-dark' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>Machinery</button>
              
              <div className="border-l border-border pl-2 flex items-center gap-2">
                <button onClick={() => toggleTripType("self")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${tripType === 'self' ? 'bg-accent-amber/20 text-accent-amber border-accent-amber' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>Self Drive</button>
                <button onClick={() => toggleTripType("with_driver")} className={`whitespace-nowrap px-3 py-1.5 rounded-badge text-xs font-bold border transition-colors ${tripType === 'with_driver' ? 'bg-driver-gold/20 text-driver-gold border-driver-gold' : 'bg-white border-border text-text-muted hover:border-text-primary'}`}>With Driver</button>
              </div>

              {/* View Toggle */}
              <div className="ml-auto flex items-center gap-1 bg-surface border border-border p-1 rounded-badge">
                <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-dark' : 'text-text-muted'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("map")} className={`p-1 rounded ${viewMode === 'map' ? 'bg-white shadow-sm text-primary-dark' : 'text-text-muted'}`}>
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 ${viewMode === 'map' ? 'flex gap-6 h-[calc(100vh-140px)] overflow-hidden' : ''}`}>
        
        {/* Results Section */}
        <div className={`flex-1 ${viewMode === 'map' ? 'overflow-y-auto pr-2' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-primary-dark uppercase">
              {category ? category.replace('_', ' ') : 'All Vehicles'} in {location || 'Kerala'}
            </h2>
            <span className="text-sm font-bold text-text-muted">{vehicles.length} results found</span>
          </div>
          
          {isLoading ? (
            <div className={`grid grid-cols-1 ${viewMode === 'map' ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="bg-white border border-border rounded-card p-4 h-[350px] animate-pulse flex flex-col justify-between">
                  <div className="w-full h-40 bg-neutral-100 rounded-lg" />
                  <div className="h-4 bg-neutral-100 rounded w-2/3 mt-4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2 mt-2" />
                  <div className="h-10 bg-neutral-100 rounded-input w-full mt-6" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-card p-8 text-center shadow-sm">
              <Info className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-text-primary font-bold">{error}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white border border-border rounded-card p-12 text-center shadow-sm">
              <Info className="h-10 w-10 text-accent-amber mx-auto mb-4" />
              <p className="font-bold text-primary-dark text-lg mb-2">No vehicles found</p>
              <p className="text-text-muted mb-6">Try adjusting your filters or location to see more options.</p>
              <button
                onClick={() => { setCategory(""); setFuelType(""); setTripType(""); }}
                className="bg-primary-dark text-white font-bold px-6 py-2.5 rounded-input hover:bg-black transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${viewMode === 'map' ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>

        {/* Map View Placeholder */}
        {viewMode === 'map' && (
          <div className="hidden lg:block w-[400px] xl:w-[500px] h-full bg-neutral-200 rounded-card overflow-hidden relative border border-border">
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/b0/OpenStreetMap_default_map_example.png')] bg-cover bg-center opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center bg-primary-dark/20 backdrop-blur-sm">
              <div className="bg-white p-4 rounded-card shadow-card text-center border border-border">
                <MapPin className="w-8 h-8 text-accent-amber mx-auto mb-2" />
                <h3 className="font-bold text-primary-dark mb-1">Interactive Map</h3>
                <p className="text-xs text-text-muted">Map integration will be enabled<br/>in production build.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchBrowse() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-accent-amber">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    }>
      <SearchBrowseContent />
    </Suspense>
  );
}
