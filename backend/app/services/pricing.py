def calculate_total_price(
    base_price: float,
    price_per_km: float,
    distance_km: float,
    driver_included: bool,
    driver_cost_per_day: float,
    number_of_days: int = 1
) -> dict:
    """
    Calculates the detailed breakdown and final price of a booking.
    Formula:
        Distance Charge = Distance * Price Per KM
        Driver Charge = (Driver Cost Per Day * Number of Days) if Driver Included
        Subtotal = Base Charge + Distance Charge + Driver Charge
        Taxes = Subtotal * 18% (standard GST)
        Total Price = Subtotal + Taxes
    """
    distance_charge = max(0.0, distance_km * price_per_km)
    
    driver_charge = 0.0
    if driver_included:
        driver_charge = driver_cost_per_day * max(1, number_of_days)
    
    subtotal = base_price + distance_charge + driver_charge
    
    # Enforce minimum booking subtotal (e.g., 200 INR)
    subtotal = max(200.0, subtotal)
    
    taxes = round(subtotal * 0.18, 2)
    total_price = round(subtotal + taxes, 2)
    
    return {
        "base_charge": base_price,
        "distance_charge": round(distance_charge, 2),
        "driver_charge": round(driver_charge, 2),
        "subtotal": round(subtotal, 2),
        "taxes": taxes,
        "total_price": total_price
    }
