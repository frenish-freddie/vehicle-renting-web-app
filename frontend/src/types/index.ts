export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "owner" | "driver" | "admin" | "guest" | "host";
  phone_number?: string;
  profile_image?: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  owner_id: number;
  vehicle_name: string;
  vehicle_category: "two_wheeler" | "three_wheeler" | "car" | "van" | "pickup" | "heavy_goods";
  brand: string;
  model: string;
  registration_number: string;
  fuel_type: string;
  seating_capacity: number;
  load_capacity: number;
  base_price: number;
  price_per_km: number;
  driver_available: boolean;
  driver_cost: number;
  location: string;
  availability_status: "available" | "booked" | "maintenance";
  images?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  vehicle_id: number;
  pickup_location: string;
  drop_location: string;
  estimated_distance: number;
  start_date: string;
  end_date: string;
  driver_included: boolean;
  total_price: number;
  total_amount?: number;
  booking_status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  created_at: string;
  vehicle?: Vehicle;
  // Phase 1: Partial Payment
  partial_amount?: number;
  remaining_amount?: number;
  balance_payment_status?: "pending" | "paid";
  balance_paid_at?: string | null;
}

export interface Driver {
  id: number;
  user_id: number;
  name: string;
  license_number: string;
  experience_years: number;
  rating: number;
  availability: boolean;
}

// Phase 2: driver option returned by GET /api/drivers/available
export interface DriverOption {
  id: number;
  name: string;
  hourly_rate: number;
  rating_avg: number;
  experience_years: number;
  languages: string;
  dl_classes: string;
  photo_url?: string | null;
}

export interface Review {
  id: number;
  user_id: number;
  vehicle_id?: number;
  driver_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: User;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_status: "pending" | "completed" | "refunded" | "failed";
  transaction_id: string;
  created_at: string;
}
