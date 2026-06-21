import Link from "next/link";
import { Vehicle } from "@/types";
import { Star, MapPin, Zap, Home } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
  isOwnVehicle?: boolean;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  two_wheeler: "Two Wheeler",
  car: "Car/SUV",
  commercial: "Commercial",
  machinery: "Machinery",
  special: "Special",
};

const BACKEND = "http://127.0.0.1:8000";
const toAbsUrl = (url: string | null | undefined) => {
  if (!url) return "/vehicles/placeholder.jpg";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/static/")) return `${BACKEND}${url}`;
  return url;
};

export default function VehicleCard({ vehicle, isOwnVehicle = false }: VehicleCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden bg-white border border-border rounded-card shadow-sm hover:shadow-card transition-all">
      {/* Vehicle Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
        <img
          src={toAbsUrl(vehicle.images?.split(',')[0])}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "/vehicles/placeholder.jpg";
          }}
        />
        {/* "Your Vehicle" badge — top-left, only for host's own listing */}
        {isOwnVehicle && (
          <div className="absolute top-2 left-2 bg-neutral-900/85 backdrop-blur-sm text-white px-2 py-1 rounded badge text-[9px] font-bold uppercase tracking-wider z-10 shadow-sm flex items-center gap-1">
            <Home className="w-2.5 h-2.5" />
            Your Vehicle
          </div>
        )}
        {/* Rating Badge — only shown when NOT own vehicle (avoid badge overlap) */}
        {!isOwnVehicle && (
          <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded badge flex items-center gap-1 z-10 shadow-sm border border-border">
            <Star className="w-3 h-3 text-accent-amber fill-accent-amber" />
            <span className="text-[10px] font-bold text-text-primary">4.9</span>
          </div>
        )}
        {/* Category Label */}
        <div className="absolute top-2 right-2 bg-primary-dark/80 text-white backdrop-blur-sm px-2 py-1 rounded badge text-[9px] font-bold uppercase tracking-wider z-10 shadow-sm">
          {CATEGORY_LABELS[vehicle.category || vehicle.vehicle_category as string] || vehicle.category || vehicle.vehicle_category}
        </div>
        {vehicle.driver_available && (
          <div className="absolute bottom-2 left-2 bg-driver-gold/90 backdrop-blur-sm text-primary-dark px-2 py-1 rounded badge text-[9px] font-bold uppercase tracking-wider z-10 shadow-sm">
            Operator/Driver Available
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col p-4 flex-1">
        {/* Name */}
        <h3 className="font-bold text-lg text-text-primary leading-tight mb-1 truncate">
          {vehicle.brand} {vehicle.model}
        </h3>
        
        {/* Specifications Badges */}
        <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] font-bold text-text-muted">
          <span className="bg-surface border border-border px-1.5 py-0.5 rounded">{vehicle.fuel_type}</span>
          <span className="bg-surface border border-border px-1.5 py-0.5 rounded">{vehicle.is_driver_available || vehicle.driver_available ? "With Operator" : "Self Drive"}</span>
          {(vehicle.seats || vehicle.seating_capacity) && <span className="bg-surface border border-border px-1.5 py-0.5 rounded">{vehicle.seats || vehicle.seating_capacity} Seats</span>}
          {(vehicle.payload_capacity || vehicle.load_capacity) > 0 && <span className="bg-surface border border-border px-1.5 py-0.5 rounded">{vehicle.payload_capacity || vehicle.load_capacity}T Payload</span>}
        </div>

        {/* Pricing and Button */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-numbers text-xl font-bold text-primary-dark">
                ₹{vehicle.price_daily || vehicle.base_price}
              </span>
              <span className="text-xs text-text-muted font-normal">
                /day
              </span>
            </div>
          </div>

          {isOwnVehicle ? (
            <span className="bg-neutral-100 text-neutral-400 font-bold px-5 py-2 rounded-input text-sm cursor-not-allowed opacity-60 select-none border border-neutral-200">
              Your Listing
            </span>
          ) : (
            <Link
              href={`/search/${vehicle.id}`}
              className="bg-primary-dark text-white hover:bg-black font-bold px-5 py-2 rounded-input text-sm shadow-sm transition-colors flex items-center justify-center"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

