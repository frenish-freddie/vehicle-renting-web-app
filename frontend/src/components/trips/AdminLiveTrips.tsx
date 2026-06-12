import React from 'react';
import { useActiveTrips, ActiveTrip } from '@/hooks/useActiveTripStatus';
import { AlertCircle, Clock, MapPin, Search } from 'lucide-react';

export default function AdminLiveTrips() {
  const { activeTrips, isLoading } = useActiveTrips();

  if (isLoading) {
    return <div className="text-white text-sm animate-pulse p-6">Loading Live Trips...</div>;
  }

  if (activeTrips.length === 0) {
    return (
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-center text-slate-500">
        No active trips running right now.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mt-6">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Trips Monitor</h3>
        <div className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Live (30s)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-[10px] uppercase text-slate-500 bg-slate-800/20">
            <tr>
              <th className="px-5 py-4 font-bold tracking-wider">ID</th>
              <th className="px-5 py-4 font-bold tracking-wider">Car</th>
              <th className="px-5 py-4 font-bold tracking-wider">Renter</th>
              <th className="px-5 py-4 font-bold tracking-wider">Status</th>
              <th className="px-5 py-4 font-bold tracking-wider">Platform Fee (10%)</th>
              <th className="px-5 py-4 font-bold tracking-wider">Delay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeTrips.map((trip: ActiveTrip) => (
              <tr key={trip.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4 font-numbers font-bold text-slate-400">#{trip.id}</td>
                <td className="px-5 py-4 font-bold text-white">
                  {trip.vehicle?.brand} {trip.vehicle?.model}
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{trip.pickup_address?.split(',')[0]}</div>
                </td>
                <td className="px-5 py-4">
                  {trip.user?.full_name}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                    trip.current_status === 'trip_ended' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    trip.current_status === 'trip_started' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-slate-700/50 text-slate-300 border-slate-600'
                  }`}>
                    {trip.current_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-4 font-numbers font-bold text-emerald-400">
                  ₹{(trip.total_amount * 0.1).toFixed(2)}
                </td>
                <td className="px-5 py-4">
                  {trip.is_delayed ? (
                    <span className="flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded-md w-max border border-red-400/20">
                      <AlertCircle className="w-3.5 h-3.5" /> +{trip.delay_minutes}m
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
