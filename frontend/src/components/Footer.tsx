import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white pt-16 mt-auto font-sans">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Top Section: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col">
            <Link href="/" className="flex items-center mb-4">
              <span className="text-3xl font-extrabold text-brand-green tracking-tight">
                FlexiRide
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The ultimate platform for self-drive car rentals. Pick a car, unlock it, and go — no driver, no limits.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-3">Company</h4>
            <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About Us</Link>
            <Link href="/careers" className="text-gray-400 hover:text-white text-sm transition-colors">Careers</Link>
            <Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
          </div>

          {/* Column 3: Our Services */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold mb-3">Our Services</h4>
            <Link href="/services/daily" className="text-gray-400 hover:text-white text-sm transition-colors">Daily Drives</Link>
            <Link href="/services/subscription" className="text-gray-400 hover:text-white text-sm transition-colors">Subscription</Link>
            <Link href="/services/weekday" className="text-gray-400 hover:text-white text-sm transition-colors">Weekday Pass</Link>
            <Link href="/services/delivery" className="text-gray-400 hover:text-white text-sm transition-colors">Home Delivery</Link>
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Host a Vehicle</Link>
          </div>

          {/* Column 4: Contact Us */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-2">Contact Us</h4>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <MapPin className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <p>123 Mobility Hub, MG Road<br/>Kochi, Kerala 682011</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Phone className="w-4 h-4 text-brand-green shrink-0" />
              <p>+91 1800 123 4567</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Mail className="w-4 h-4 text-brand-green shrink-0" />
              <p>support@flexiride.com</p>
            </div>
          </div>
          
        </div>

        {/* Bottom Section: SEO Links & Cities */}
        <div className="py-8">
          <h4 className="text-white font-bold text-sm mb-4">Self Drive Vehicle Rental Services in Kerala</h4>
          <div className="flex flex-wrap gap-2 text-xs text-brand-muted/70">
            {[
              "Car Rental in Kochi Airport", "Car Rental in Trivandrum Station", 
              "Two-Wheeler Rental in Kozhikode", "Heavy Machinery Rent Kerala", "Commercial Vehicle Rent Kochi",
              "SUV Rental in Ernakulam", "Hatchback Rental in Thrissur",
              "Sedan Rental in Palakkad", "Electric Car Rental in Kerala",
              "Monthly Car Rental Kochi", "Weekly Car Rental Trivandrum",
              "Car Rental at Cochin Airport", "Luxury Car Rental Kerala"
            ].map((link, idx) => (
              <a key={link} href="#" className="text-gray-400 text-[11px] md:text-xs hover:text-white hover:underline transition-colors line-clamp-1">
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center py-6 border-t border-white/10 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FlexiRide Mobility Solutions Pvt. Ltd.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>GSTIN: 32AABCU9603R1ZM</span>
            <span className="hidden md:inline">•</span>
            <span>All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
