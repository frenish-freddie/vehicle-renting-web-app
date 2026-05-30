import axios from "axios";

// Standard local FastAPI backend URL
const API_URL = "http://localhost:8000";

const mapBackendVehicleToFrontend = (v: any) => {
  if (!v || typeof v !== "object") return v;
  return {
    ...v,
    owner_id: v.host_id !== undefined ? v.host_id : v.owner_id,
    vehicle_name: v.vehicle_name !== undefined ? v.vehicle_name : (v.brand && v.model ? `${v.brand} ${v.model}` : ""),
    vehicle_category: v.category !== undefined ? v.category : v.vehicle_category,
    registration_number: v.registration_no !== undefined ? v.registration_no : v.registration_number,
    seating_capacity: v.seats !== undefined ? v.seats : v.seating_capacity,
    load_capacity: v.payload_capacity !== undefined ? v.payload_capacity : v.load_capacity,
    base_price: v.price_daily !== undefined ? v.price_daily : v.base_price,
    driver_available: v.is_driver_available !== undefined ? v.is_driver_available : v.driver_available,
    driver_cost: v.driver_daily_rate !== undefined ? v.driver_daily_rate : v.driver_cost,
    location: v.location !== undefined ? v.location : "Kerala"
  };
};

const mapFrontendVehicleToBackend = (v: any) => {
  if (!v || typeof v !== "object") return v;
  return {
    ...v,
    host_id: v.owner_id !== undefined ? v.owner_id : v.host_id,
    category: v.vehicle_category !== undefined ? v.vehicle_category : v.category,
    registration_no: v.registration_number !== undefined ? v.registration_number : v.registration_no,
    seats: v.seating_capacity !== undefined ? v.seating_capacity : v.seats,
    payload_capacity: v.load_capacity !== undefined ? v.load_capacity : v.payload_capacity,
    price_daily: v.base_price !== undefined ? v.base_price : v.price_daily,
    is_driver_available: v.driver_available !== undefined ? v.driver_available : v.is_driver_available,
    driver_daily_rate: v.driver_cost !== undefined ? v.driver_cost : v.driver_daily_rate
  };
};

const mapBackendBookingToFrontend = (b: any) => {
  if (!b || typeof b !== "object") return b;
  return {
    ...b,
    start_date: b.from_dt !== undefined ? b.from_dt : b.start_date,
    end_date: b.to_dt !== undefined ? b.to_dt : b.end_date,
    pickup_location: b.pickup_address !== undefined ? b.pickup_address : b.pickup_location,
    drop_location: b.delivery_address !== undefined ? b.delivery_address : b.drop_location,
    booking_status: b.status !== undefined ? b.status : b.booking_status,
    total_price: b.total_amount !== undefined ? b.total_amount : b.total_price,
    driver_included: b.trip_type !== undefined ? (b.trip_type === "with_driver") : b.driver_included,
    vehicle: b.vehicle ? mapBackendVehicleToFrontend(b.vehicle) : b.vehicle
  };
};

const mapFrontendBookingToBackend = (b: any) => {
  if (!b || typeof b !== "object") return b;
  return {
    ...b,
    from_dt: b.start_date !== undefined ? b.start_date : b.from_dt,
    to_dt: b.end_date !== undefined ? b.end_date : b.to_dt,
    pickup_address: b.pickup_location !== undefined ? b.pickup_location : b.pickup_address,
    delivery_address: b.drop_location !== undefined ? b.drop_location : b.delivery_address,
    status: b.booking_status !== undefined ? b.booking_status : b.status,
    total_amount: b.total_price !== undefined ? b.total_price : b.total_amount,
    trip_type: b.driver_included !== undefined ? (b.driver_included ? "with_driver" : "self") : b.trip_type
  };
};

function transformResponse(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => transformResponse(item));
  } else if (data !== null && typeof data === "object") {
    let transformed = { ...data };
    
    // Check if it matches Backend Vehicle response fields
    if ("category" in transformed || "price_daily" in transformed || "seats" in transformed) {
      transformed = mapBackendVehicleToFrontend(transformed);
    }
    // Check if it matches Backend Booking response fields
    if ("from_dt" in transformed || "pickup_address" in transformed || "total_amount" in transformed) {
      transformed = mapBackendBookingToFrontend(transformed);
    }

    // Recursively transform children keys
    const result: any = {};
    for (const key in transformed) {
      if (Object.prototype.hasOwnProperty.call(transformed, key)) {
        result[key] = transformResponse(transformed[key]);
      }
    }
    return result;
  }
  return data;
}

function transformRequest(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => transformRequest(item));
  } else if (data !== null && typeof data === "object") {
    let transformed = { ...data };
    
    // Check if it matches Frontend Vehicle request fields
    if ("vehicle_category" in transformed || "base_price" in transformed || "seating_capacity" in transformed) {
      transformed = mapFrontendVehicleToBackend(transformed);
    }
    // Check if it matches Frontend Booking request fields
    if ("start_date" in transformed || "pickup_location" in transformed || "total_price" in transformed) {
      transformed = mapFrontendBookingToBackend(transformed);
    }

    // Recursively transform children keys
    const result: any = {};
    for (const key in transformed) {
      if (Object.prototype.hasOwnProperty.call(transformed, key)) {
        result[key] = transformRequest(transformed[key]);
      }
    }
    return result;
  }
  return data;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT Token if logged in
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("flexiride_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Automatically transform outgoing frontend model data into backend model format
    if (config.data) {
      config.data = transformRequest(config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatically transform incoming backend model data into frontend model format
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformResponse(response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
