import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

export interface TripStatusLog {
  id: number;
  booking_id: number;
  status: string;
  updated_by_role: string;
  updated_by_id: number;
  note?: string;
  created_at: string;
}

export interface PaymentInfo {
  partial_amount: number;
  remaining_amount: number;
  balance_payment_status: string;
  trip_duration_hours: number;
  is_delayed: boolean;
  delay_minutes: number;
}

export interface ActiveTrip {
  id: number;
  user_id: number;
  current_status: string;
  expected_return_at?: string;
  actual_return_at?: string;
  is_delayed: boolean;
  delay_minutes: number;
  from_dt: string;
  to_dt: string;
  vehicle: any; // Using any for brevity; normally type imported from schemas
  driver_total_cost: number;
  total_amount: number;
  pickup_address: string;
  delivery_address?: string;
  user?: any;
}

export function useActiveTrips() {
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveTrips = useCallback(async () => {
    try {
      const response = await api.get('/api/trips/active');
      setActiveTrips(response.data);
    } catch (error) {
      console.error('Failed to fetch active trips', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrips();
    const interval = setInterval(fetchActiveTrips, 30000); // 30 second polling
    return () => clearInterval(interval);
  }, [fetchActiveTrips]);

  return { activeTrips, isLoading, refetch: fetchActiveTrips };
}

export function useActiveTripStatus(bookingId: number | undefined) {
  const [timeline, setTimeline] = useState<TripStatusLog[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const fetchTripDetails = useCallback(async () => {
    if (!bookingId) return;
    try {
      const [statusRes, paymentRes] = await Promise.all([
        api.get(`/api/trips/${bookingId}/status`),
        api.get(`/api/trips/${bookingId}/payment-info`)
      ]);
      setTimeline(statusRes.data);
      setPaymentInfo(paymentRes.data);
    } catch (error) {
      console.error(`Failed to fetch status for booking ${bookingId}`, error);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchTripDetails();
    const interval = setInterval(fetchTripDetails, 30000); // 30 second polling
    return () => clearInterval(interval);
  }, [fetchTripDetails]);

  const updateStatus = async (status: string, note?: string, is_delayed?: boolean, delay_minutes?: number) => {
    if (!bookingId) return;
    await api.post(`/api/trips/${bookingId}/update-status`, {
      status,
      note,
      is_delayed,
      delay_minutes
    });
    await fetchTripDetails();
  };

  return { timeline, paymentInfo, updateStatus, refetch: fetchTripDetails };
}
