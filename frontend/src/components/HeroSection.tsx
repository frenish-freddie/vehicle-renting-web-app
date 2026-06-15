"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=400&h=500", 
  "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=400&h=500",
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400&h=500",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400&h=500",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400&h=500",
];

const ROTATIONS = ["-rotate-6", "rotate-0", "rotate-6", "-rotate-3", "rotate-3"];

export default function HeroSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <section className="bg-brand-bg pt-12 pb-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* 3a. Heading */}
        <div className="text-center max-w-[800px] mx-auto mb-6">
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-[800] text-brand-text leading-tight mb-4">
            Vehicle Rentals Across Kerala — Book Affordable Rides Instantly
          </h1>
          
          {/* 3b. Stats Row */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm md:text-base text-brand-muted">
            <div><strong className="text-brand-text font-extrabold">50,00,000+</strong> Trips</div>
            <span className="hidden sm:inline">|</span>
            <div><strong className="text-brand-text font-extrabold">30,00,000+</strong> User Ratings</div>
            <span className="hidden sm:inline">|</span>
            <div><strong className="text-brand-text font-extrabold">4.8+</strong> Average Trip Rating</div>
          </div>
        </div>

        {/* 3c. Rotating/Tilted Carousel */}
        <div className="relative w-full h-[280px] md:h-[320px] mt-10 mb-12 flex justify-center items-center">
          <div className="flex justify-center items-center">
            {HERO_IMAGES.map((src, idx) => (
              <div 
                key={idx}
                className={`relative w-[140px] md:w-[180px] h-[220px] md:h-[260px] rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)] ${ROTATIONS[idx]} -ml-6 md:-ml-8 first:ml-0 transition-transform duration-300 hover:z-10 hover:-translate-y-4 cursor-pointer`}
                style={{ zIndex: HERO_IMAGES.length - Math.abs(2 - idx) }}
              >
                <img src={src} alt="Travel lifestyle" className="w-full h-full object-cover" loading={idx === 0 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
        </div>

        {/* 3d. Booking Type Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setActiveTab("daily")}
              className={`flex flex-col items-center justify-center px-6 py-3 rounded-full transition-colors border ${
                activeTab === "daily" 
                  ? "bg-brand-green text-white border-brand-green" 
                  : "bg-brand-card text-brand-muted border-brand-border hover:border-brand-green/50"
              }`}
            >
              <span className="font-bold text-sm">Daily Drives</span>
              <span className="text-[10px] opacity-80">Upto 7 days</span>
            </button>
            <button 
              onClick={() => setActiveTab("sub")}
              className={`flex flex-col items-center justify-center px-6 py-3 rounded-full transition-colors border ${
                activeTab === "sub" 
                  ? "bg-brand-green text-white border-brand-green" 
                  : "bg-brand-card text-brand-muted border-brand-border hover:border-brand-green/50"
              }`}
            >
              <span className="font-bold text-sm">Subscription</span>
              <span className="text-[10px] opacity-80">7 day+ rides</span>
            </button>
            <button 
              onClick={() => setActiveTab("pass")}
              className={`relative flex flex-col items-center justify-center px-6 py-3 rounded-full transition-colors border ${
                activeTab === "pass" 
                  ? "bg-brand-green text-white border-brand-green" 
                  : "bg-brand-card text-brand-muted border-brand-border hover:border-brand-green/50"
              }`}
            >
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">New</span>
              <span className="font-bold text-sm">Weekday Pass</span>
              <span className="text-[10px] opacity-80">Mon-Fri with Ltd Kms</span>
            </button>
          </div>
        </div>

        {/* 3e. Search Bar */}
        <div className="max-w-[900px] mx-auto">
          <div className="bg-brand-card rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-2 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0 border border-brand-border">
            
            <div className="flex flex-col sm:flex-row w-full lg:w-auto flex-1">
              {/* City */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 sm:border-r border-brand-border">
                <span className="block text-[11px] text-brand-muted font-semibold uppercase tracking-wider mb-1">City</span>
                <select className="w-full bg-transparent text-brand-text font-bold focus:outline-none cursor-pointer appearance-none">
                  <option>Ernakulam</option>
                  <option>Thiruvananthapuram</option>
                  <option>Kozhikode</option>
                  <option>Thrissur</option>
                  <option>Palakkad</option>
                </select>
              </div>
              
              {/* Location */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 lg:border-r border-brand-border">
                <span className="block text-[11px] text-brand-muted font-semibold uppercase tracking-wider mb-1">Location</span>
                <input type="text" placeholder="Search Location" className="w-full bg-transparent text-brand-text font-bold placeholder-gray-400 focus:outline-none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full lg:w-auto flex-1">
              {/* Start Date */}
              <div className="flex-1 px-4 py-2 border-b sm:border-b-0 sm:border-r border-brand-border">
                <span className="block text-[11px] text-brand-muted font-semibold uppercase tracking-wider mb-1">Trip Start</span>
                <input type="datetime-local" className="w-full bg-transparent text-brand-text font-bold focus:outline-none text-sm" />
              </div>
              
              {/* End Date */}
              <div className="flex-1 px-4 py-2">
                <span className="block text-[11px] text-brand-muted font-semibold uppercase tracking-wider mb-1">Trip End</span>
                <input type="datetime-local" className="w-full bg-transparent text-brand-text font-bold focus:outline-none text-sm" />
              </div>
            </div>

            {/* Search Button */}
            <div className="px-4 w-full lg:w-auto flex justify-end lg:block">
              <button 
                onClick={() => router.push('/search')}
                className="bg-brand-green hover:bg-green-700 text-white p-4 rounded-full transition-colors flex items-center justify-center w-full lg:w-auto shadow-sm"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 px-2">
            <input type="checkbox" id="delivery" className="w-4 h-4 rounded text-brand-green focus:ring-brand-green" />
            <label htmlFor="delivery" className="text-sm text-brand-text font-medium cursor-pointer">
              Delivery & Pick-up, from anywhere
            </label>
          </div>
        </div>

      </div>
    </section>
  );
}
