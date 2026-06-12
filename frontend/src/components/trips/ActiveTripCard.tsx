import React, { useState } from 'react';
import { useActiveTripStatus, ActiveTrip } from '@/hooks/useActiveTripStatus';
import { Car, MapPin, Clock, AlertTriangle, CheckCircle, ArrowRight, Wallet } from 'lucide-react';
import api from '@/services/api';

interface Props {
  trip: ActiveTrip;
  role: 'user' | 'driver' | 'host';
  onRefresh?: () => void;
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  driver_pickup: "Driver On The Way",
  car_delivered: "Car Delivered",
  trip_started: "Trip In Progress",
  trip_ended: "Trip Ended",
  completed: "Completed"
};

export default function ActiveTripCard({ trip, role, onRefresh }: Props) {
  const { timeline, paymentInfo, updateStatus } = useActiveTripStatus(trip.id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayMins, setDelayMins] = useState(30);
  const [showDelayForm, setShowDelayForm] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    await updateStatus(newStatus);
    setIsUpdating(false);
    if (onRefresh) onRefresh();
  };

  const handleMarkDelayed = async () => {
    setIsUpdating(true);
    await updateStatus(trip.current_status, `Delayed: ${delayReason}`, true, delayMins);
    setIsUpdating(false);
    setShowDelayForm(false);
    if (onRefresh) onRefresh();
  };

  const payBalance = async () => {
    setIsUpdating(true);
    // Sandbox payment flow
    try {
      await api.post(`/api/payments/pay-balance`, { booking_id: trip.id });
      // In a real flow, this redirects to stripe. For sandbox, we'll just mark it paid via update
      await handleStatusUpdate("completed");
    } catch (e) {
      console.error(e);
    }
    setIsUpdating(false);
  };

  // Next logical status for Drivers
  let nextDriverAction = null;
  if (role === 'driver') {
    if (trip.current_status === 'confirmed') nextDriverAction = { status: 'driver_pickup', label: 'Start Pickup' };
    else if (trip.current_status === 'driver_pickup') nextDriverAction = { status: 'trip_started', label: 'Trip Started' };
    else if (trip.current_status === 'trip_started') nextDriverAction = { status: 'trip_ended', label: 'End Trip' };
  }

  return (
    <div className={`bg-white rounded-card shadow-sm border-l-4 p-5 mb-6 ${trip.is_delayed ? 'border-l-red-500' : 'border-l-accent-green'} border-y border-r border-y-border border-r-border relative overflow-hidden`}>
      <div className="absolute top-0 right-0 bg-accent-green/10 text-accent-green text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
        {statusLabels[trip.current_status] || trip.current_status}
      </div>

      <div className="flex gap-4">
        {/* Thumbnail */}
        {trip.vehicle && (
          <div className="w-24 h-16 rounded bg-neutral-100 shrink-0 overflow-hidden hidden sm:block">
            <img src={trip.vehicle.images || "/vehicles/placeholder.jpg"} alt="Car" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-bold text-primary-dark text-lg mb-1">
            {trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model}` : `Booking #${trip.id}`}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted mb-4">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(trip.from_dt).toLocaleString()} — {trip.expected_return_at ? new Date(trip.expected_return_at).toLocaleString() : new Date(trip.to_dt).toLocaleString()}</span>
            {(role === 'driver' || role === 'host') && trip.user && (
              <span className="flex items-center gap-1 font-bold text-primary-dark">Renter: {trip.user.full_name}</span>
            )}
          </div>

          {/* Delay Banner */}
          {trip.is_delayed && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs font-bold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" />
              This trip is running {trip.delay_minutes} mins over the expected time.
            </div>
          )}

          {/* Role specific content */}
          <div className="bg-surface rounded-card p-4 border border-border flex flex-col sm:flex-row justify-between gap-4">
            
            {/* Payment Summary */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Payment Status</div>
              {paymentInfo ? (
                <>
                  <div className="text-sm font-bold text-primary-dark">Paid: <span className="font-numbers">₹{paymentInfo.partial_amount}</span></div>
                  <div className="text-sm font-bold text-accent-amber">Balance Due: <span className="font-numbers">₹{paymentInfo.remaining_amount}</span></div>
                </>
              ) : (
                <div className="text-sm text-text-muted animate-pulse">Loading...</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              {role === 'user' && trip.current_status === 'trip_ended' && paymentInfo && paymentInfo.remaining_amount > 0 && (
                <button onClick={payBalance} disabled={isUpdating} className="bg-primary-dark text-white text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-input hover:bg-black transition-colors flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Pay Balance ₹{paymentInfo.remaining_amount}
                </button>
              )}

              {role === 'driver' && nextDriverAction && (
                <button onClick={() => handleStatusUpdate(nextDriverAction!.status)} disabled={isUpdating} className="bg-accent-green text-white text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-input hover:bg-[#10a310] transition-colors flex items-center gap-2">
                  {nextDriverAction.label} <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {role === 'driver' && trip.current_status !== 'trip_ended' && !trip.is_delayed && (
                <button onClick={() => setShowDelayForm(!showDelayForm)} className="border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-input transition-colors">
                  Report Delay
                </button>
              )}
            </div>
          </div>

          {/* Delay Form */}
          {showDelayForm && (
            <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-card animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Mark Trip as Delayed</h4>
              <div className="flex gap-3">
                <input type="number" value={delayMins} onChange={e => setDelayMins(parseInt(e.target.value) || 0)} className="w-24 px-3 py-2 rounded border border-red-200 text-sm focus:outline-none" placeholder="Mins" />
                <input type="text" value={delayReason} onChange={e => setDelayReason(e.target.value)} className="flex-1 px-3 py-2 rounded border border-red-200 text-sm focus:outline-none" placeholder="Reason for delay..." />
                <button onClick={handleMarkDelayed} disabled={isUpdating || !delayMins || delayMins <= 0} className="bg-red-500 text-white font-bold text-xs uppercase px-4 rounded hover:bg-red-600 disabled:opacity-50">Submit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
