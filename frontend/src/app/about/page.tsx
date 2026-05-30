"use client";

import HeroNavbar from "@/components/HeroNavbar";
import Footer from "@/components/Footer";
import { ShieldCheck, MapPin, Users, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-brand-bg min-h-screen text-brand-text font-sans selection:bg-brand-green/20">
      <HeroNavbar />
      
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative max-w-[1200px] mx-auto px-6 text-center text-white z-10 pt-16">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Redefining Mobility <br/>
            <span className="text-brand-green">Across Kerala</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed">
            FlexiRide was built on a simple premise: renting a vehicle should be as easy, accessible, and transparent as driving your own. We connect people with the perfect ride for every journey.
          </p>
        </div>
      </section>

      {/* 2. Stats Section (Overlap) */}
      <section className="relative -mt-16 z-20 max-w-[1000px] mx-auto px-6 mb-24">
        <div className="bg-brand-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 md:p-12 border border-brand-border flex flex-wrap justify-between gap-8 text-center">
          <div className="flex-1 min-w-[150px]">
            <div className="text-4xl font-extrabold text-brand-accent mb-2">50+</div>
            <div className="text-sm font-bold text-brand-muted uppercase tracking-wider">Premium Vehicles</div>
          </div>
          <div className="w-px bg-brand-border hidden md:block"></div>
          <div className="flex-1 min-w-[150px]">
            <div className="text-4xl font-extrabold text-brand-accent mb-2">5</div>
            <div className="text-sm font-bold text-brand-muted uppercase tracking-wider">Major Hubs</div>
          </div>
          <div className="w-px bg-brand-border hidden md:block"></div>
          <div className="flex-1 min-w-[150px]">
            <div className="text-4xl font-extrabold text-brand-accent mb-2">50M+</div>
            <div className="text-sm font-bold text-brand-muted uppercase tracking-wider">Safe KMs Driven</div>
          </div>
          <div className="w-px bg-brand-border hidden md:block"></div>
          <div className="flex-1 min-w-[150px]">
            <div className="text-4xl font-extrabold text-brand-accent mb-2">4.9/5</div>
            <div className="text-sm font-bold text-brand-muted uppercase tracking-wider">Average Rating</div>
          </div>
        </div>
      </section>

      {/* 3. Our Mission & Vision */}
      <section className="py-16 max-w-[1200px] mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-brand-green uppercase tracking-widest">Our Mission</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-brand-text leading-tight">
              To make self-drive accessible, secure, and infinitely scalable.
            </h3>
            <p className="text-brand-muted text-lg leading-relaxed">
              We started FlexiRide because we noticed a massive gap in the Indian mobility sector. Whether you needed a quick two-wheeler to cut through Kochi traffic or a heavy-duty BharatBenz truck in Palakkad, the rental process was riddled with paperwork, hidden fees, and unreliable hosts.
            </p>
            <p className="text-brand-muted text-lg leading-relaxed">
              We are building a unified ecosystem where every vehicle owner can be a micro-entrepreneur, and every traveler has instant access to a reliable, verified vehicle with zero friction.
            </p>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800" alt="Driving in Kerala" className="rounded-2xl shadow-xl z-10 relative" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-brand-green/10 rounded-full z-0 blur-3xl"></div>
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-brand-accent/10 rounded-full z-0 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* 4. Core Values */}
      <section className="py-24 bg-brand-card border-y border-brand-border">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text mb-4">Our Core Values</h2>
            <p className="text-brand-muted text-lg max-w-2xl mx-auto">The principles that drive every product update, every host verification, and every customer support ticket.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-bg p-8 rounded-2xl border border-brand-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-brand-green" />
              </div>
              <h4 className="text-xl font-bold text-brand-text mb-3">Trust & Safety First</h4>
              <p className="text-brand-muted leading-relaxed">Every vehicle on our platform undergoes a rigorous 40-point safety check. We verify both hosts and guests with government-issued IDs for a seamless, secure experience.</p>
            </div>
            
            <div className="bg-brand-bg p-8 rounded-2xl border border-brand-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-brand-green" />
              </div>
              <h4 className="text-xl font-bold text-brand-text mb-3">Hyper-Local Presence</h4>
              <p className="text-brand-muted leading-relaxed">We don't just operate from a single garage. Our decentralized host network means you can pick up a vehicle exactly where you need it, anywhere across Kerala.</p>
            </div>
            
            <div className="bg-brand-bg p-8 rounded-2xl border border-brand-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-brand-green" />
              </div>
              <h4 className="text-xl font-bold text-brand-text mb-3">Community Driven</h4>
              <p className="text-brand-muted leading-relaxed">We empower local vehicle owners to monetize their idle assets. By choosing FlexiRide, you are supporting a community of micro-entrepreneurs in your own state.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call to Action */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-accent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative max-w-[800px] mx-auto px-6 text-center text-white z-10">
          <Heart className="w-12 h-12 text-brand-green mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to hit the road?</h2>
          <p className="text-xl text-gray-300 mb-10 font-medium">
            Join thousands of happy travelers and hosts. Your perfect ride is just a tap away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/search" className="bg-brand-green text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg shadow-brand-green/30 w-full sm:w-auto justify-center">
              Find a Vehicle <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="bg-white/10 text-white border border-white/20 font-bold text-lg px-8 py-4 rounded-full hover:bg-white/20 transition-colors w-full sm:w-auto justify-center flex">
              Become a Host
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
