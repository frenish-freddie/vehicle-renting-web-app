"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LayoutDashboard, Car, Landmark, Clock, Settings, Search, Bell, User as UserIcon, TrendingUp, ArrowRight, LogOut, CheckCircle2 } from "lucide-react";

export default function DriverDashboard() {
  const { user, dashboardStats, isLoading, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("Dashboard");

  if (isLoading || !dashboardStats || !user) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FC] flex items-center justify-center">
         <div className="text-primary-dark animate-pulse font-bold text-xl tracking-widest">LOADING DRIVER DASHBOARD...</div>
      </div>
    );
  }

  const { rating, total_trips, earnings, assigned_trips } = dashboardStats;

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8F9FC] flex overflow-hidden text-[#0F1923] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 shadow-sm z-20">
         {/* Profile */}
         <div className="p-8 border-b border-neutral-100 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-accent-amber/20 p-1 mb-4">
               <div className="w-full h-full rounded-full bg-primary-dark flex items-center justify-center overflow-hidden">
                 <UserIcon className="w-10 h-10 text-white" />
               </div>
            </div>
            <h2 className="font-bold text-lg tracking-wide text-primary-dark">{user.name}</h2>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-accent-amber bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
               <span>⭐ {rating} Rating</span>
            </div>
         </div>
         {/* Nav */}
         <nav className="flex-1 py-6 px-4 space-y-2 flex flex-col">
            {[
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Trip Requests", icon: Car },
              { name: "Earnings", icon: Landmark },
              { name: "History", icon: Clock },
              { name: "Settings", icon: Settings },
            ].map(item => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold tracking-wide text-sm ${
                  activeTab === item.name 
                    ? "bg-primary-dark text-white shadow-md"
                    : "text-neutral-500 hover:text-primary-dark hover:bg-neutral-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
            
            <div className="mt-auto pt-8">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold tracking-wide text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
         </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F8F9FC]">
        {/* Top bar */}
        <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 shadow-sm">
           <h1 className="text-2xl font-display font-bold tracking-wider text-primary-dark uppercase">
             {activeTab}
           </h1>
           <div className="flex items-center gap-6">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-dark transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search trips, locations..." 
                  className="bg-neutral-100 border border-transparent rounded-full pl-11 pr-4 py-2.5 text-sm text-primary-dark placeholder-neutral-500 focus:outline-none focus:bg-white focus:border-primary-dark focus:ring-1 focus:ring-primary-dark w-72 transition-all"
                />
             </div>
             <button className="relative p-2.5 rounded-full hover:bg-neutral-100 transition-colors border border-neutral-200 bg-white text-neutral-600">
               <Bell className="w-5 h-5" />
               <span className="absolute top-0 right-0 w-3 h-3 bg-accent-amber rounded-full border-2 border-white"></span>
             </button>
           </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
             
             {/* Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard 
                 title="Total Earnings" 
                 value={`₹${earnings}`} 
                 trend="+12%" 
                 color="#0F1923"
                 accent="#F59E0B"
               />
               <StatCard 
                 title="Trips Completed" 
                 value={total_trips} 
                 trend="+5" 
                 color="#0F1923"
                 accent="#3B82F6"
               />
               <StatCard 
                 title="Acceptance Rate" 
                 value="94%" 
                 trend="+2%" 
                 color="#0F1923"
                 accent="#10B981"
               />
             </div>

             {/* Charts Row */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Weekly Earnings Bar Chart */}
                <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
                   <h3 className="text-neutral-500 font-bold text-sm tracking-widest uppercase mb-6 flex justify-between items-center">
                     Weekly Earnings
                     <span className="text-primary-dark text-xs bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">This Week</span>
                   </h3>
                   <div className="h-48 flex items-end justify-between gap-3 mt-4">
                     {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                       <div key={i} className="w-full bg-neutral-100 rounded-t-lg relative group/bar hover:bg-neutral-200 transition-colors" style={{ height: '100%' }}>
                         <div 
                           className="absolute bottom-0 left-0 w-full bg-primary-dark rounded-t-lg transition-all duration-500 ease-out flex flex-col justify-end items-center pb-2 opacity-90 group-hover/bar:opacity-100" 
                           style={{ height: `${h}%` }}
                         >
                            {i === 6 && <span className="text-white text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">₹{earnings}</span>}
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between mt-4 text-xs text-neutral-400 font-bold uppercase tracking-widest">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                   </div>
                </div>

                {/* Donut Chart - Daily Goal */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative hover:border-neutral-300 transition-all duration-300">
                   <h3 className="text-neutral-500 font-bold text-sm tracking-widest uppercase mb-4 absolute top-6 left-6">Daily Goal</h3>
                   <div className="relative w-44 h-44 mt-8">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="88" cy="88" r="76" fill="none" stroke="#F8F9FC" strokeWidth="16" />
                       <circle cx="88" cy="88" r="76" fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round" strokeDasharray="477" strokeDashoffset="119" className="transition-all duration-1000 ease-out" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-extrabold text-primary-dark">75%</span>
                       <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">Completed</span>
                     </div>
                   </div>
                </div>

             </div>

             {/* Horizontal Progress - Breakdown & Trip Requests */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Trip Requests List */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-neutral-300 transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-neutral-500 font-bold text-sm tracking-widest uppercase">Live Requests</h3>
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-accent-amber rounded-full text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-accent-amber animate-pulse"></div> Searching
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {assigned_trips && assigned_trips.length > 0 ? assigned_trips.map((trip: any) => (
                      <div key={trip.id} className="bg-white border border-neutral-200 p-5 rounded-xl relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-amber"></div>
                        <div className="flex justify-between items-start mb-3 pl-2">
                           <div>
                             <h4 className="font-bold text-primary-dark tracking-wide text-lg">{trip.vehicle?.vehicle_name || "Assigned Vehicle"}</h4>
                             <span className="text-xs text-neutral-500 uppercase tracking-wider font-bold bg-neutral-100 px-2 py-0.5 rounded">{trip.status}</span>
                           </div>
                           <span className="text-primary-dark font-extrabold text-xl">₹{trip.total_amount}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-600 mb-5 pl-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                          <span className="truncate flex-1 font-semibold">{trip.pickup_address?.split(",")[0] || "Pickup"}</span>
                          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span className="truncate flex-1 font-semibold text-right">{trip.delivery_address?.split(",")[0] || "Delivery"}</span>
                        </div>
                        <div className="flex gap-3 pl-2">
                          <button className="flex-1 bg-primary-dark text-white font-bold py-2.5 rounded-lg text-sm hover:bg-black hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
                            Accept
                          </button>
                          <button className="flex-1 border border-neutral-200 text-primary-dark bg-white font-bold py-2.5 rounded-lg text-sm hover:bg-neutral-50 transition-all duration-200 shadow-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 bg-neutral-50 rounded-xl border border-neutral-100">
                        <Car className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm font-bold tracking-wide">No new requests in your area</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-neutral-300 transition-all duration-300">
                  <h3 className="text-neutral-500 font-bold text-sm tracking-widest uppercase mb-8">Earnings Breakdown</h3>
                  
                  <div className="space-y-8">
                    {/* Progress Bar Container */}
                    <div className="h-5 w-full bg-neutral-100 rounded-full overflow-hidden flex gap-1 shadow-inner">
                      <div className="h-full bg-primary-dark w-[70%] relative group"></div>
                      <div className="h-full bg-accent-amber w-[20%] relative group"></div>
                      <div className="h-full bg-accent-green w-[10%] relative group"></div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-4 bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                      <div className="flex justify-between items-center text-sm border-b border-neutral-200 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-primary-dark"></div>
                          <span className="text-neutral-600 font-bold tracking-wide">Base Fare</span>
                        </div>
                        <span className="font-extrabold text-primary-dark text-lg">70%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-neutral-200 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-accent-amber"></div>
                          <span className="text-neutral-600 font-bold tracking-wide">Bonus & Incentives</span>
                        </div>
                        <span className="font-extrabold text-primary-dark text-lg">20%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-accent-green"></div>
                          <span className="text-neutral-600 font-bold tracking-wide">Tips</span>
                        </div>
                        <span className="font-extrabold text-primary-dark text-lg">10%</span>
                      </div>
                    </div>
                  </div>
                </div>

             </div>

          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F8F9FC;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}} />
    </div>
  );
}

function StatCard({ title, value, trend, color, accent }: { title: string, value: string | number, trend: string, color: string, accent: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden shadow-sm group hover:border-neutral-300 transition-all duration-300 hover:shadow-md">
      <div className="relative z-10">
        <h3 className="text-neutral-500 font-bold text-sm tracking-widest uppercase mb-3">{title}</h3>
        <div className="flex items-end justify-between">
          <span className="text-4xl font-extrabold tracking-wide text-primary-dark">{value}</span>
          <span className="text-xs font-bold px-2 py-1.5 rounded-lg bg-green-50 border border-green-100 mb-1 text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        </div>
      </div>
      {/* Subtle Wave Chart Background */}
      <div className="absolute bottom-0 left-0 w-full h-[60%] opacity-10 pointer-events-none group-hover:opacity-20 transition-all duration-500 ease-out transform group-hover:scale-y-110 origin-bottom">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,50 L0,20 C20,40 40,0 60,20 C80,40 100,10 100,10 L100,50 Z" fill={`url(#gradient-${title.replace(/\s+/g, '')})`} />
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
