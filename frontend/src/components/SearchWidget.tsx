"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Search } from "lucide-react";

const CATEGORIES = [
  { id: "two_wheeler", label: "Two-Wheeler", icon: "🛵" },
  { id: "car", label: "Cars", icon: "🚗" },
  { id: "commercial", label: "Commercial", icon: "🚛" },
  { id: "machinery", label: "Machinery", icon: "🏗️" },
  { id: "special", label: "Special", icon: "🚌" },
];

const TRIP_TYPES = [
  { id: "self", label: "Self-Drive / Self-Operate" },
  { id: "with_driver", label: "With Driver" },
  { id: "operator", label: "Operator Included" },
];

export default function SearchWidget() {
  const router = useRouter();
  const [category, setCategory] = useState("car");
  const [location, setLocation] = useState("Ernakulam");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripType, setTripType] = useState("self");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (location) params.append("location", location);
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);
    if (tripType) params.append("trip_type", tripType);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-surface-card rounded-card shadow-card p-6 w-full max-w-3xl mx-auto relative z-20">
      <form onSubmit={handleSearch} className="flex flex-col gap-5">
        
        {/* Row 1: Category Selector */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-badge border font-bold text-sm transition-colors ${
                category === c.id 
                  ? "bg-primary-dark text-white border-primary-dark shadow-sm" 
                  : "bg-surface text-text-muted border-border hover:border-text-muted"
              }`}
            >
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Row 2: Location */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted">
            <MapPin className="h-5 w-5" />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-surface border border-border rounded-input text-text-primary font-bold appearance-none focus:outline-none focus:border-accent-amber transition-colors"
          >
            <option value="Ernakulam">Ernakulam (Kochi)</option>
            <option value="Thiruvananthapuram">Thiruvananthapuram</option>
            <option value="Kozhikode">Kozhikode</option>
            <option value="Thrissur">Thrissur</option>
            <option value="Palakkad">Palakkad</option>
          </select>
        </div>

        {/* Row 3: Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted">
              <Calendar className="h-5 w-5" />
            </div>
            <input
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface border border-border rounded-input text-text-primary font-bold focus:outline-none focus:border-accent-amber transition-colors"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted">
              <Calendar className="h-5 w-5" />
            </div>
            <input
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface border border-border rounded-input text-text-primary font-bold focus:outline-none focus:border-accent-amber transition-colors"
            />
          </div>
        </div>

        {/* Row 4: Trip Type */}
        <div className="flex flex-wrap gap-3">
          {TRIP_TYPES.map(type => (
            <label key={type.id} className={`flex items-center gap-2 cursor-pointer p-2 rounded-badge border transition-colors ${
              tripType === type.id ? "bg-accent-amber/10 border-accent-amber text-accent-amber font-bold" : "bg-transparent border-transparent text-text-muted hover:text-text-primary font-medium"
            }`}>
              <input 
                type="radio" 
                name="trip_type" 
                value={type.id} 
                checked={tripType === type.id}
                onChange={(e) => setTripType(e.target.value)}
                className="hidden" 
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                tripType === type.id ? "border-accent-amber" : "border-border"
              }`}>
                {tripType === type.id && <div className="w-2 h-2 rounded-full bg-accent-amber"></div>}
              </div>
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>

        {/* Row 5: CTA */}
        <button
          type="submit"
          className="w-full h-14 mt-2 bg-accent-amber hover:bg-yellow-500 text-primary-dark font-display font-bold text-xl uppercase tracking-wider rounded-input shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-6 h-6" />
          Search Vehicles
        </button>

      </form>
    </div>
  );
}
