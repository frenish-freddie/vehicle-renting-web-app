"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { Vehicle } from "@/types";
import HeroSection from "@/components/HeroSection";
import HeroNavbar from "@/components/HeroNavbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight, ArrowUpRight, Apple, Play } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const response = await api.get("/api/vehicles/featured");
        setFeaturedVehicles(response.data);
      } catch (error) {
        console.error("Failed to load featured vehicles");
      }
    }
    loadFeatured();

    // Scroll reveal logic
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="bg-brand-bg min-h-screen text-brand-text font-sans selection:bg-brand-green/20">
      <HeroNavbar />
      <HeroSection />

      {/* 4. FIND POPULAR VEHICLES SECTION */}
      <section className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[1.6rem] font-bold text-brand-text mb-6">Find Popular Vehicles in Kerala</h2>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4">
            {[
              { label: "Professional Host", query: "category=car" },
              { label: "Home Delivery", query: "category=car" },
              { label: "SUV", query: "search=SUV" },
              { label: "Hatchback", query: "search=Hatchback" },
              { label: "MUV/MPV", query: "search=MPV" },
              { label: "Sedan", query: "search=Sedan" },
              { label: "Electric", query: "fuel_type=Electric" },
              { label: "Guest Favorite", query: "category=car" }
            ].map(pill => (
              <button
                key={pill.label}
                onClick={() => router.push(`/search?${pill.query}`)}
                className="relative whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border shadow-sm bg-brand-card text-brand-text border-brand-border hover:border-brand-green hover:text-brand-green hover:shadow-md hover:-translate-y-0.5"
              >
                {pill.label === "Professional Host" && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">New</span>
                )}
                {pill.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {featuredVehicles.length > 0 ? featuredVehicles.map(vehicle => (
              <div key={vehicle.id} className="bg-brand-card rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
                <div className="h-48 overflow-hidden relative">
                  <img src={vehicle.images} alt={vehicle.brand} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{vehicle.brand} {vehicle.model}</h3>
                    <div className="flex items-center gap-1 text-sm font-bold bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                      ⭐ 4.9
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted mb-4">
                    {vehicle.vehicle_category ? vehicle.vehicle_category.replace("_", " ") : "Vehicle"} • {vehicle.fuel_type} • {vehicle.seating_capacity} Seats
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t border-brand-border">
                    <div>
                      <span className="font-extrabold text-xl">₹{vehicle.base_price}</span>
                      <span className="text-xs text-brand-muted">/day</span>
                    </div>
                    <Link href={`/vehicles/${vehicle.id}`} className="font-bold text-brand-green hover:text-green-700">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center text-brand-muted py-10 bg-brand-card rounded-[16px] border border-brand-border">No vehicles available in this category</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. POPULAR DESTINATIONS SECTION */}
      <section className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-[1.8rem] font-bold text-brand-text mb-3">Explore Popular Destinations</h2>
            <p className="text-brand-muted leading-relaxed">Explore popular destinations across Kerala with a self drive vehicle rental. Plan road trips, weekend getaways, and scenic drives with comfort and flexibility.</p>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-6 snap-x">
            {[
              { name: "Munnar", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80" },
              { name: "Wayanad", img: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=400&q=80" },
              { name: "Athirappilly", img: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?w=400&q=80" },
              { name: "Fort Kochi", img: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&q=80" },
              { name: "Vagamon", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" }
            ].map(dest => (
              <Link href={`/destinations/${dest.name.toLowerCase().replace(' ', '-')}`} key={dest.name} className="min-w-[240px] h-[300px] rounded-[16px] overflow-hidden relative group cursor-pointer snap-start shadow-[0_2px_12px_rgba(0,0,0,0.08)] block">
                <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <h3 className="absolute bottom-5 left-5 text-white font-bold text-xl">{dest.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. OUR SERVICES SECTION */}
      <section className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[1.8rem] font-bold text-brand-text mb-8">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🚗", title: "Self-drive freedom", desc: "Pick a car, unlock it, and go — no driver, no limits." },
              { icon: "📦", title: "Car at your doorstep", desc: "Get your ride delivered wherever you are." },
              { icon: "₹", title: "Drive longer, pay less", desc: "Perfect for weeks or months at better prices." },
              { icon: "🏢", title: "Smart travel for teams", desc: "Flexible, reliable mobility for work trips." }
            ].map(svc => (
              <div key={svc.title} className="bg-brand-card p-6 rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-[rgba(27,139,59,0.1)] flex items-center justify-center text-2xl mb-5 text-brand-green">
                  {svc.icon}
                </div>
                <h3 className="font-bold text-[1.2rem] mb-2">{svc.title}</h3>
                <p className="text-[0.9rem] text-brand-muted">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[1.8rem] font-bold text-brand-text mb-12 text-center">How FlexiRide Works?</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-between relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0"></div>
            {[
              { num: 1, title: "Choose your car & dates", desc: "Select from our wide range of vehicles for your dates." },
              { num: 2, title: "Pick up or get it delivered", desc: "Collect the vehicle from a hub or enjoy home delivery." },
              { num: 3, title: "Drive freely, return on time", desc: "Enjoy your trip. Return the car to the designated spot." }
            ].map(step => (
              <div key={step.num} className="flex flex-col items-center text-center relative z-10 flex-1">
                <div className="w-16 h-16 rounded-full bg-brand-green text-white font-bold text-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-green/30">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-brand-muted text-sm px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FEATURES HIGHLIGHT SECTION */}
      <section className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="bg-brand-card rounded-[24px] p-8 md:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            
            <div className="flex flex-col md:flex-row gap-10 items-center mb-16 border-b border-brand-border pb-12">
              <div className="w-full md:w-1/2">
                <img src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80" alt="Verified hosts" className="w-full h-48 object-cover rounded-[12px] shadow-sm" />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <h3 className="text-3xl font-extrabold text-brand-accent">Verified cars. Trusted hosts.</h3>
                <p className="text-brand-muted text-lg">Every host on our platform undergoes a rigorous KYC check. Vehicles are inspected regularly to ensure they meet our high quality and safety standards.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse gap-10 items-center">
              <div className="w-full md:w-1/2">
                <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80" alt="Safety first" className="w-full h-48 object-cover rounded-[12px] shadow-sm" />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <h3 className="text-3xl font-extrabold text-brand-accent">Drive safe. Every time.</h3>
                <p className="text-brand-muted text-lg mb-6">Built-in safety features so you can focus on the road ahead.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-green" />
                    <span className="font-semibold text-brand-text">Keyless entry</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-green" />
                    <span className="font-semibold text-brand-text">Real-time tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-green" />
                    <span className="font-semibold text-brand-text">24/7 support</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. READ ABOUT US / BLOG SECTION */}
      <section className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[1.8rem] font-bold text-brand-text mb-8">Read about us</h2>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-6">
            {[
              { img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80", date: "May 20, 2026", title: "Top 10 Road Trips to take from Kochi this Monsoon" },
              { img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80", date: "May 15, 2026", title: "How to choose the perfect SUV for your family trip" },
              { img: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&q=80", date: "May 10, 2026", title: "Guide to renting cars without a security deposit" },
              { img: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80", date: "May 05, 2026", title: "EV Rentals: Why electric is the future of road trips" }
            ].map(blog => {
              const slug = blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              return (
                <Link href={`/blog/${slug}`} key={blog.title} className="w-[300px] shrink-0 bg-brand-card rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden group cursor-pointer block hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow">
                  <div className="h-[170px] overflow-hidden">
                    <img src={blog.img} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-brand-muted mb-3 font-semibold">{blog.date}</p>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-[15px] leading-tight line-clamp-2">{blog.title}</h3>
                      <button className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center shrink-0 group-hover:bg-brand-green group-hover:border-brand-green group-hover:text-white transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. GET THE APP SECTION */}
      <section id="app" className="py-[60px] reveal opacity-0 translate-y-10 transition-all duration-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
            {/* Left */}
            <div className="w-full md:w-1/2 bg-gray-100 p-12 flex justify-center items-center relative overflow-hidden">
              <div className="w-64 h-[500px] bg-white rounded-[32px] shadow-xl border-8 border-gray-800 relative z-10 flex flex-col overflow-hidden translate-y-12">
                {/* Mockup Screen content */}
                <div className="bg-brand-card flex-1 p-6 flex flex-col items-center pt-10 text-center h-full">
                  <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-green/20">
                    <span className="text-white font-extrabold text-3xl font-display">F</span>
                  </div>
                  <h4 className="font-extrabold text-brand-green text-2xl tracking-tight mb-2">FlexiRide</h4>
                  <p className="text-xs text-brand-muted font-medium mb-8 leading-relaxed px-2">
                    The universal platform for self-drive vehicle rentals. Book instantly and drive anywhere!
                  </p>
                  
                  <div className="w-full bg-brand-bg rounded-xl p-4 mb-3 text-left border border-gray-100 flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0"></div>
                     <div className="flex-1">
                       <div className="h-2 w-16 bg-gray-300 rounded mb-2"></div>
                       <div className="h-3 w-24 bg-gray-400 rounded"></div>
                     </div>
                  </div>
                  
                  <div className="w-full bg-brand-green text-white rounded-full py-3.5 font-bold text-sm shadow-md shadow-brand-green/30 mt-auto mb-4 transition-transform hover:scale-105 cursor-pointer">
                     Start Driving
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/10 to-transparent"></div>
            </div>
            {/* Right */}
            <div className="w-full md:w-1/2 bg-[#1A1A1A] p-12 md:p-16 flex flex-col justify-center">
              <p className="text-xs text-brand-muted uppercase font-bold tracking-widest mb-4">Experience convenience at your fingertips</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-10 leading-tight">Get Our Mobile App!</h2>
              <div className="flex flex-wrap gap-4">
                <button className="bg-black border border-gray-800 hover:border-gray-600 text-white px-6 py-3.5 rounded-[10px] flex items-center gap-3 transition-colors">
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-70">Download on the</div>
                    <div className="font-semibold text-lg leading-none mt-0.5">App Store</div>
                  </div>
                </button>
                <button className="bg-black border border-gray-800 hover:border-gray-600 text-white px-6 py-3.5 rounded-[10px] flex items-center gap-3 transition-colors">
                  <Play className="w-7 h-7" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-70">GET IT ON</div>
                    <div className="font-semibold text-lg leading-none mt-0.5">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <Footer />
    </div>
  );
}
