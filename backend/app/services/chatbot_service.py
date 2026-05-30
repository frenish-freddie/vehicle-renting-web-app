import re
from typing import Dict, List, Any

# FAQ Database
FAQS = [
    {
        "keywords": [r"price", r"pricing", r"cost", r"fare", r"charge", r"calculate"],
        "response": "FlexiRide calculates rental prices dynamically using this formula:\n"
                    "Total Price = Base Charge + (Distance × Price/KM) + Driver Add-on + 18% Tax.\n"
                    "Minimum bookings start at ₹200. Toggle the 'Driver' option in the booking panel to see real-time updates!",
        "suggestions": ["Show pricing formula", "Do you have driver cost?"]
    },
    {
        "keywords": [r"driver", r"chauffeur", r"add-on", r"helper"],
        "response": "Yes! FlexiRide offers an optional Driver Add-on service. When booking, select the 'Need Driver' option. "
                    "Owners configure the driver's daily rate, which will be automatically added to your booking receipt.",
        "suggestions": ["What are driver ratings?", "How do I become a driver?"]
    },
    {
        "keywords": [r"cancel", r"refund", r"cancellation", r"change"],
        "response": "You can cancel bookings from your Customer Dashboard. Refunds are processed automatically "
                    "back to your original payment method. If you run into issues, admin moderators can assist you.",
        "suggestions": ["Track my refunds", "Contact Customer Support"]
    },
    {
        "keywords": [r"book", r"rent", r"reserve", r"order"],
        "response": "Renting a vehicle is simple:\n"
                    "1. Search & filter on our browse page.\n"
                    "2. Select a vehicle and fill out the pickup/drop-off points.\n"
                    "3. Enter the estimated KMs and click 'Book & Pay'.\n"
                    "4. Complete payment to secure your ride immediately!",
        "suggestions": ["Browse vehicles", "Active Bookings"]
    },
    {
        "keywords": [r"hello", r"hi", r"hey", r"greetings", r"chatbot"],
        "response": "Hi there! I am the FlexiRide AI Assistant. How can I help you manage bookings, explain pricing, or find the right vehicles today?",
        "suggestions": ["Browse vehicles", "How does pricing work?", "Driver services"]
    },
    {
        "keywords": [r"payment", r"razorpay", r"pay", r"online", r"card", r"upi"],
        "response": "We support secure payments via Razorpay. You can pay using Credit/Debit Cards, UPI, Netbanking, or digital wallets. Booking confirmations are sent instantly after successful payment.",
        "suggestions": ["Is it safe?", "Razorpay details"]
    }
]

def process_chat_message(message: str) -> Dict[str, Any]:
    text = message.lower().strip()
    
    # Check regular expressions
    for faq in FAQS:
        for kw in faq["keywords"]:
            if re.search(kw, text):
                return {
                    "response": faq["response"],
                    "suggestions": faq["suggestions"]
                }
                
    # Fallback response
    return {
        "response": "I didn't quite catch that. You can ask me about bookings, distance-based pricing, driver services, or payments. Alternatively, you can browse vehicles from the navigation bar above!",
        "suggestions": ["Browse vehicles", "How does pricing work?", "Driver services"]
    }
