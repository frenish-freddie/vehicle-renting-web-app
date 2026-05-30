"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Car } from "lucide-react";
import HeroNavbar from "@/components/HeroNavbar";
import Footer from "@/components/Footer";

// Data mapping for blogs based on slugs
const BLOG_DATA: Record<string, any> = {
  "top-10-road-trips-to-take-from-kochi-this-monsoon": {
    title: "Top 10 Road Trips to take from Kochi this Monsoon",
    date: "May 20, 2026",
    heroImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
    readTime: "6 min read",
    content: (
      <>
        <p className="mb-4">
          The monsoon season transforms Kerala into a lush, vibrant paradise, making it the perfect time for a scenic road trip. Starting from Kochi, there are numerous destinations you can explore that offer breathtaking views and refreshing experiences.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">1. The Munnar Mist</h3>
        <p className="mb-4">
          Drive through the winding roads to Munnar and witness the majestic waterfalls and tea gardens enveloped in mist. The drive itself is as mesmerizing as the destination. Ensure your brakes and tires are in top condition for the wet roads!
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">2. Coastal Cruise to Alappuzha</h3>
        <p className="mb-4">
          If you prefer the coast, the drive to Alappuzha during the rains is simply magical. The backwaters swell with fresh rain, and the lush greenery along the highway is a sight to behold.
        </p>
        <p className="mt-8 italic text-brand-muted">
          Renting an SUV for these trips is highly recommended to handle the monsoon terrain comfortably. Enjoy the drive, and remember to drive safely!
        </p>
      </>
    )
  },
  "how-to-choose-the-perfect-suv-for-your-family-trip": {
    title: "How to choose the perfect SUV for your family trip",
    date: "May 15, 2026",
    heroImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80",
    readTime: "5 min read",
    content: (
      <>
        <p className="mb-4">
          Planning a family trip is exciting, but choosing the right vehicle can make or break the experience. SUVs are often the go-to choice for families due to their space, safety, and versatility.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Space and Comfort</h3>
        <p className="mb-4">
          Consider the number of passengers and the amount of luggage. A 7-seater might be necessary for larger families, while a compact SUV could suffice for a family of four. Look for features like rear AC vents and ample legroom.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Safety First</h3>
        <p className="mb-4">
          When traveling with family, safety is paramount. Opt for SUVs equipped with multiple airbags, ABS, and electronic stability control. A high ground clearance is also beneficial if you're planning to venture off the beaten path.
        </p>
        <p className="mt-8 italic text-brand-muted">
          At FlexiRide, we offer a wide range of SUVs to suit every family's needs. Filter by 'SUV' in our search page to find your perfect match.
        </p>
      </>
    )
  },
  "guide-to-renting-cars-without-a-security-deposit": {
    title: "Guide to renting cars without a security deposit",
    date: "May 10, 2026",
    heroImage: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200&q=80",
    readTime: "4 min read",
    content: (
      <>
        <p className="mb-4">
          Renting a car can sometimes involve hefty security deposits that tie up your funds. However, the industry is evolving, and it's now possible to rent vehicles without blocking significant amounts on your credit card.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Look for 'Zero Deposit' Options</h3>
        <p className="mb-4">
          Many modern rental platforms, including FlexiRide, have introduced 'Zero Deposit' policies for verified users. This usually requires a thorough KYC (Know Your Customer) process upfront.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Insurance is Key</h3>
        <p className="mb-4">
          Opting for comprehensive insurance coverage can often waive the need for a security deposit. While it might increase the daily rental rate slightly, it provides peace of mind and frees up your cash for the trip.
        </p>
        <p className="mt-8 italic text-brand-muted">
          Always read the terms and conditions carefully. A hassle-free rental experience is just a few clicks away!
        </p>
      </>
    )
  },
  "ev-rentals-why-electric-is-the-future-of-road-trips": {
    title: "EV Rentals: Why electric is the future of road trips",
    date: "May 05, 2026",
    heroImage: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80",
    readTime: "7 min read",
    content: (
      <>
        <p className="mb-4">
          Electric Vehicles (EVs) are no longer just for daily city commutes. With advancements in battery technology and an expanding charging infrastructure, EVs are becoming an excellent choice for road trips.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Eco-Friendly Exploration</h3>
        <p className="mb-4">
          Traveling in an EV allows you to explore nature without polluting it. The silent drive enhances the experience, allowing you to connect more deeply with your surroundings.
        </p>
        <h3 className="text-2xl font-bold mt-8 mb-4 text-brand-text">Cost Efficiency</h3>
        <p className="mb-4">
          With rising fuel prices, the cost per kilometer for an EV is significantly lower. Charging at public stations or your hotel can drastically reduce your travel expenses.
        </p>
        <p className="mt-8 italic text-brand-muted">
          Ready to make the switch? Check out our EV fleet for your next adventure and experience the smooth, silent power of electric driving.
        </p>
      </>
    )
  }
};

export default function BlogDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    if (slug && BLOG_DATA[slug]) {
      setBlog(BLOG_DATA[slug]);
    } else if (slug) {
      // Fallback for unknown blog post
      const title = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBlog({
        title: title,
        date: "Recently Published",
        heroImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
        readTime: "5 min read",
        content: (
          <p className="mb-4 text-brand-muted">
            We are currently updating this article. Please check back later for the full guide on "{title}".
          </p>
        )
      });
    }
  }, [slug]);

  if (!blog) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
      <HeroNavbar />
      
      <main className="flex-1">
        {/* Header / Hero */}
        <div className="max-w-[1000px] mx-auto px-6 pt-12 pb-8">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-8 w-fit transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </button>
          
          <div className="flex items-center gap-6 text-sm text-brand-muted mb-4 font-medium">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {blog.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {blog.readTime}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-text mb-8 leading-tight">
            {blog.title}
          </h1>
        </div>

        {/* Hero Image */}
        <div className="max-w-[1200px] mx-auto px-6 mb-12">
          <div className="w-full h-[60vh] min-h-[400px] rounded-3xl overflow-hidden shadow-xl">
            <img 
              src={blog.heroImage} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[800px] mx-auto px-6 pb-20">
          <article className="prose prose-lg dark:prose-invert prose-green max-w-none text-brand-muted leading-relaxed">
            {blog.content}
          </article>
          
          <hr className="my-12 border-brand-border" />
          
          {/* Call to Action */}
          <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-3xl border border-green-100 dark:border-green-900/30 text-center">
            <h3 className="text-2xl font-bold text-brand-text mb-3">Ready for your next adventure?</h3>
            <p className="text-brand-muted mb-8 max-w-[500px] mx-auto">
              Book the perfect vehicle for your trip today. Experience the freedom of the open road with FlexiRide.
            </p>
            <button 
              onClick={() => router.push('/search')}
              className="bg-brand-green hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg shadow-brand-green/20"
            >
              <Car className="w-5 h-5" />
              Start Your Journey
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
