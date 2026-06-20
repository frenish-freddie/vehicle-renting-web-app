/**
 * adminApi.ts — Typed service layer for all /api/admin/* endpoints.
 * Uses the shared axios instance (with auth header injection) from api.ts.
 */

import api from "@/services/api";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  total_vehicles: number;
  total_bookings: number;
  total_drivers: number;
  pending_vehicle_approvals: number;
  pending_driver_approvals: number;
  suspended_hosts: number;
  total_commission: number;
  gross_revenue: number;
  booking_status_counts: Record<string, number>;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  is_host_approved: boolean;
  dl_verified: boolean;
  aadhaar_verified: boolean;
  user_dl_url: string | null;
  user_aadhaar_url: string | null;
  user_kyc_status: string;
  created_at: string | null;
}

export interface AdminVehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  category: string;
  sub_type: string;
  registration_no: string;
  fuel_type: string;
  price_daily: number;
  is_approved: boolean;
  is_available: boolean;
  images: string | null;
  rc_url: string | null;
  insurance_url: string | null;
  host_name: string;
  host_email: string;
  created_at: string | null;
}

export interface AdminDriver {
  id: number;
  name: string;
  experience_years: number;
  daily_rate: number;
  rating_avg: number;
  total_trips: number;
  is_approved: boolean;
  verification_status: string;
  is_active: boolean;
  license_url: string | null;
  is_police_verified: boolean;
  is_medically_fit: boolean;
  user_email: string;
  dl_classes: string;
  created_at: string | null;
}

export interface AdminBooking {
  id: number;
  status: string;
  user_name: string;
  user_email: string;
  vehicle_name: string;
  vehicle_category: string;
  from_dt: string | null;
  to_dt: string | null;
  base_amount: number;
  total_amount: number;
  commission_amount: number;
  trip_type: string;
  pickup_address: string;
  created_at: string | null;
}

export interface AdminTransaction {
  payment_id: number;
  booking_id: number;
  amount: number;
  method: string;
  gateway_ref: string;
  status: string;
  platform_commission: number;
  user_name: string;
  vehicle_name: string;
  booking_status: string;
  created_at: string | null;
}

export interface AdminHostKyc {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  host_kyc_status: "unsubmitted" | "pending" | "approved" | "rejected";
  host_aadhaar_url: string | null;
  host_pan_url: string | null;
  is_host_approved: boolean;
  aadhaar_name: string | null;
  aadhaar_dob: string | null;
  aadhaar_gender: string | null;
  aadhaar_number: string | null;
  aadhaar_address: string | null;
  created_at: string | null;
}

export interface AdminUserKyc {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  user_dl_url: string | null;
  user_aadhaar_url: string | null;
  user_kyc_status: string;
  dl_verified: boolean;
  aadhaar_verified: boolean;
  aadhaar_name: string | null;
  aadhaar_dob: string | null;
  aadhaar_gender: string | null;
  aadhaar_number: string | null;
  aadhaar_address: string | null;
  created_at: string | null;
}

// ─── API Calls ──────────────────────────────────────────────────────────────

export const adminApi = {
  /** Platform-wide overview stats */
  getStats: (): Promise<AdminStats> =>
    api.get("/api/admin/stats").then((r) => r.data),

  /** Users list (paginated, optional role filter) */
  getUsers: (page = 1, limit = 20, role?: string) =>
    api
      .get("/api/admin/users", { params: { page, limit, role } })
      .then((r) => r.data as { total: number; users: AdminUser[] }),

  approveUser: (userId: number) =>
    api.patch(`/api/admin/users/${userId}/approve`).then((r) => r.data),

  rejectUser: (userId: number) =>
    api.patch(`/api/admin/users/${userId}/reject`).then((r) => r.data),

  approveUserKyc: async (id: number) => {
    const res = await api.patch(`/api/admin/users/${id}/approve-kyc`);
    return res.data;
  },

  rejectUserKyc: async (id: number) => {
    const res = await api.patch(`/api/admin/users/${id}/reject-kyc`);
    return res.data;
  },

  deleteUser: (userId: number) =>
    api.delete(`/api/admin/users/${userId}`).then((r) => r.data),

  /** Vehicles list (paginated, optional approved filter) */
  getVehicles: (page = 1, limit = 20, approved?: boolean) =>
    api
      .get("/api/admin/vehicles", {
        params: { page, limit, ...(approved !== undefined && { approved }) },
      })
      .then((r) => r.data as { total: number; vehicles: AdminVehicle[] }),

  approveVehicle: (vehicleId: number) =>
    api.patch(`/api/admin/vehicles/${vehicleId}/approve`).then((r) => r.data),

  rejectVehicle: (vehicleId: number) =>
    api.patch(`/api/admin/vehicles/${vehicleId}/reject`).then((r) => r.data),

  /** Drivers list (paginated, optional approved filter) */
  getDrivers: (page = 1, limit = 20, approved?: boolean) =>
    api
      .get("/api/admin/drivers", {
        params: { page, limit, ...(approved !== undefined && { approved }) },
      })
      .then((r) => r.data as { total: number; drivers: AdminDriver[] }),

  approveDriver: (driverId: number) =>
    api.patch(`/api/admin/drivers/${driverId}/approve`).then((r) => r.data),

  rejectDriver: (driverId: number) =>
    api.patch(`/api/admin/drivers/${driverId}/reject`).then((r) => r.data),

  /** All bookings log */
  getBookings: (page = 1, limit = 20, status?: string) =>
    api
      .get("/api/admin/bookings", {
        params: { page, limit, ...(status && { booking_status: status }) },
      })
      .then((r) => r.data as { total: number; bookings: AdminBooking[] }),

  /** Payment transaction history */
  getHistory: (page = 1, limit = 25) =>
    api
      .get("/api/admin/history", { params: { page, limit } })
      .then(
        (r) => r.data as { total: number; transactions: AdminTransaction[] }
      ),

  /** Host KYC document review */
  getHostKyc: (page = 1, limit = 20, kyc_status?: string) =>
    api
      .get("/api/admin/host-kyc", {
        params: { page, limit, ...(kyc_status && { kyc_status }) },
      })
      .then((r) => r.data as { total: number; hosts: AdminHostKyc[] }),

  /** User KYC document review */
  getUserKyc: (page = 1, limit = 20, status?: string) =>
    api
      .get("/api/admin/user-kyc", {
        params: { page, limit, ...(status && { status }) },
      })
      .then((r) => r.data as { total: number; users: AdminUserKyc[] }),

  approveHostKyc: (userId: number) =>
    api.patch(`/api/admin/users/${userId}/approve-kyc`).then((r) => r.data),

  rejectHostKyc: (userId: number) =>
    api.patch(`/api/admin/users/${userId}/reject-kyc`).then((r) => r.data),
};
