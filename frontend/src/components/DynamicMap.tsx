"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Info } from "lucide-react";

interface DynamicMapProps {
  pickup: string;
  drop: string;
  onDistanceChange?: (distance: number) => void;
}

// Dummy nodes coordinates in SVG space
const LOCATIONS_COORDS: { [key: string]: { x: number; y: number } } = {
  "Peenya, Bangalore": { x: 100, y: 80 },
  "Koramangala, Bangalore": { x: 280, y: 220 },
  "Indiranagar, Bangalore": { x: 300, y: 150 },
  "Whitefield, Bangalore": { x: 420, y: 180 },
  "Yeshwanthpur, Bangalore": { x: 140, y: 110 },
  "Bandra, Mumbai": { x: 150, y: 190 },
  "Andheri West, Mumbai": { x: 130, y: 140 },
  "Thane, Mumbai": { x: 240, y: 90 },
  "Connaught Place, Delhi": { x: 260, y: 160 },
};

export default function DynamicMap({ pickup, drop, onDistanceChange }: DynamicMapProps) {
  const [distance, setDistance] = useState(15);
  const [pickupCoord, setPickupCoord] = useState({ x: 150, y: 120 });
  const [dropCoord, setDropCoord] = useState({ x: 300, y: 200 });

  useEffect(() => {
    // Attempt coordinate matching or generate stable fallback coordinates
    const pCoord = LOCATIONS_COORDS[pickup] || { x: 150, y: 120 };
    let dCoord = LOCATIONS_COORDS[drop] || { x: 300, y: 200 };

    if (pickup === drop) {
      dCoord = { x: pCoord.x + 50, y: pCoord.y + 50 };
    }

    setPickupCoord(pCoord);
    setDropCoord(dCoord);

    // Estimate realistic distance based on coordinates delta (scaled for Bangalore geography)
    const dx = dCoord.x - pCoord.x;
    const dy = dCoord.y - pCoord.y;
    const calculatedDistance = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.15);
    const finalDistance = Math.max(3, calculatedDistance); // minimum 3 km
    setDistance(finalDistance);
    
    if (onDistanceChange) {
      onDistanceChange(finalDistance);
    }
  }, [pickup, drop, onDistanceChange]);

  return (
    <div className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col items-center dark:bg-neutral-900 dark:border-neutral-800/80">
      {/* Route Info Badge */}
      <div className="w-full flex items-center justify-between bg-white border border-slate-100 dark:bg-neutral-800 dark:border-neutral-700/50 px-4 py-2.5 rounded-xl mb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Route Planning Engine
          </span>
        </div>
        <div className="text-xs text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
          Est. Distance: {distance} KM
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-[220px] bg-slate-100 border border-slate-200/50 rounded-xl overflow-hidden shadow-inner flex items-center justify-center dark:bg-neutral-950 dark:border-neutral-900/50">
        {/* Animated Map Grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />

        <svg className="w-full h-full absolute inset-0">
          {/* Connecting route line */}
          <line
            x1={pickupCoord.x}
            y1={pickupCoord.y}
            x2={dropCoord.x}
            y2={dropCoord.y}
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="6,4"
            className="animate-[dash_2s_linear_infinite]"
          />

          {/* SVG coordinate animation keyframes inside style tag */}
          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -20;
              }
            }
          `}</style>
        </svg>

        {/* Pickup Pin */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500"
          style={{ left: `${pickupCoord.x}px`, top: `${pickupCoord.y}px` }}
        >
          <div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-md flex items-center justify-center border border-white">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white px-1.5 py-0.5 rounded shadow mt-1 border border-neutral-100 dark:border-neutral-700/50 truncate max-w-[80px]">
            Pickup
          </span>
        </div>

        {/* Dropoff Pin */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500"
          style={{ left: `${dropCoord.x}px`, top: `${dropCoord.y}px` }}
        >
          <div className="bg-red-500 text-white rounded-full p-1.5 shadow-md flex items-center justify-center border border-white">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white px-1.5 py-0.5 rounded shadow mt-1 border border-neutral-100 dark:border-neutral-700/50 truncate max-w-[80px]">
            Drop-off
          </span>
        </div>
      </div>

      <div className="w-full flex items-start gap-1.5 mt-3 text-[10px] text-neutral-400">
        <Info className="h-3.5 w-3.5 text-primary-500 shrink-0 mt-0.5" />
        <p className="leading-tight">
          This panel is pre-configured to simulate routes and compute travel distances based on pickup coordinates, updating the totals instantly.
        </p>
      </div>
    </div>
  );
}
