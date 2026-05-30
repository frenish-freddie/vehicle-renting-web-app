"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Compass, ArrowLeft, Car, Mountain, Droplets, Sun, Wind } from "lucide-react";
import HeroNavbar from "@/components/HeroNavbar";
import Footer from "@/components/Footer";

// Data mapping for destinations
const DESTINATION_DATA: Record<string, any> = {
  "munnar": {
    name: "Munnar",
    heroImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80",
    description: "Munnar is a town and hill station located in the Idukki district of the southwestern Indian state of Kerala. Munnar is situated at around 1,600 metres above mean sea level, in the Western Ghats mountain range. It is famous for its sprawling tea plantations, picturesque towns, winding lanes, and holiday facilities.",
    weather: "15°C - 25°C",
    bestTime: "September to March",
    attractions: [
      { name: "Tea Gardens", icon: <Mountain className="w-5 h-5 text-green-600" /> },
      { name: "Eravikulam National Park", icon: <Compass className="w-5 h-5 text-green-600" /> },
      { name: "Mattupetty Dam", icon: <Droplets className="w-5 h-5 text-green-600" /> }
    ]
  },
  "wayanad": {
    name: "Wayanad",
    heroImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&q=80",
    description: "Wayanad is an Indian district in the north-east of Kerala state with administrative headquarters at the municipality of Kalpetta. Known for its soothing temperature all around the year, Wayanad is the ultimate destination to escape the scorching sun of North India. It boasts historical caves, comfortable resorts, and majestic waterfalls.",
    weather: "18°C - 28°C",
    bestTime: "October to May",
    attractions: [
      { name: "Edakkal Caves", icon: <Mountain className="w-5 h-5 text-green-600" /> },
      { name: "Chembra Peak", icon: <Compass className="w-5 h-5 text-green-600" /> },
      { name: "Soochipara Falls", icon: <Droplets className="w-5 h-5 text-green-600" /> }
    ]
  },
  "athirappilly": {
    name: "Athirappilly",
    heroImage: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?w=1200&q=80",
    description: "Athirappilly Falls is situated in Athirappilly Panchayat in Chalakudy Taluk of Thrissur District in Kerala, India on the Chalakudy River, which originates from the upper reaches of the Western Ghats at the entrance to the Sholayar ranges. It is the largest waterfall in Kerala, standing at 80 feet tall and is nicknamed 'The Niagara of India'.",
    weather: "22°C - 30°C",
    bestTime: "September to January",
    attractions: [
      { name: "Athirappilly Falls", icon: <Droplets className="w-5 h-5 text-green-600" /> },
      { name: "Vazhachal Falls", icon: <Droplets className="w-5 h-5 text-green-600" /> },
      { name: "Sholayar Dam", icon: <Mountain className="w-5 h-5 text-green-600" /> }
    ]
  },
  "fort-kochi": {
    name: "Fort Kochi",
    heroImage: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80",
    description: "Fort Kochi is a region in the city of Kochi in the state of Kerala, India. This is part of a handful of water-bound regions toward the south-west of the mainland Kochi, and collectively known as Old Kochi or West Kochi. It is known for its Dutch, Portuguese, and British colonial architecture, and elaborate bamboo fishing nets at Fort Kochi Beach.",
    weather: "24°C - 32°C",
    bestTime: "October to March",
    attractions: [
      { name: "Chinese Fishing Nets", icon: <Wind className="w-5 h-5 text-green-600" /> },
      { name: "Mattancherry Palace", icon: <Compass className="w-5 h-5 text-green-600" /> },
      { name: "St. Francis Church", icon: <Sun className="w-5 h-5 text-green-600" /> }
    ]
  },
  "vagamon": {
    name: "Vagamon",
    heroImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    description: "Vagamon is an Indian hill station located in Peerumade taluk of Idukki district, and also Meenachil taluk and Kanjirappally taluk of Kottayam district in the state of Kerala, India. It features a continually cool climate with the temperature hovering between 10 and 23 °C during a summer midday.",
    weather: "10°C - 23°C",
    bestTime: "March to June",
    attractions: [
      { name: "Vagamon Meadows", icon: <Mountain className="w-5 h-5 text-green-600" /> },
      { name: "Pine Hill", icon: <Compass className="w-5 h-5 text-green-600" /> },
      { name: "Kurisumala", icon: <Sun className="w-5 h-5 text-green-600" /> }
    ]
  }
};

export default function DestinationDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  const [destination, setDestination] = useState<any>(null);

  useEffect(() => {
    if (slug && DESTINATION_DATA[slug]) {
      setDestination(DESTINATION_DATA[slug]);
    } else if (slug) {
      // Fallback for unknown destination
      setDestination({
        name: slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        heroImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&q=80",
        description: "Explore the scenic beauty and vibrant culture of this beautiful destination in Kerala. Plan your perfect self-drive trip today.",
        weather: "20°C - 30°C",
        bestTime: "All year round",
        attractions: [
          { name: "Scenic Viewpoints", icon: <Mountain className="w-5 h-5 text-green-600" /> },
          { name: "Local Markets", icon: <Compass className="w-5 h-5 text-green-600" /> }
        ]
      });
    }
  }, [slug]);

  if (!destination) {
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
        {/* Hero Section */}
        <div className="relative w-full h-[50vh] min-h-[400px]">
          <img 
            src={destination.heroImage} 
            alt={destination.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="absolute inset-0 flex flex-col justify-center max-w-[1200px] mx-auto px-6 w-full">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6 w-fit transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 shadow-sm">
              {destination.name}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5 text-brand-green" />
              <span className="text-lg font-medium">Kerala, India</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h2 className="text-3xl font-bold text-brand-text mb-6">About {destination.name}</h2>
                <p className="text-brand-muted text-lg leading-relaxed">
                  {destination.description}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-brand-text mb-6">Top Attractions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destination.attractions.map((attr: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        {attr.icon}
                      </div>
                      <span className="font-semibold text-brand-text">{attr.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Travel Info & CTA */}
            <div className="space-y-6">
              <div className="bg-brand-card p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-brand-border">
                <h3 className="text-xl font-bold text-brand-text mb-6">Trip Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Sun className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-brand-muted font-medium">Average Weather</p>
                      <p className="font-bold text-brand-text">{destination.weather}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-brand-muted font-medium">Best Time to Visit</p>
                      <p className="font-bold text-brand-text">{destination.bestTime}</p>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-brand-border" />

                <div className="space-y-4">
                  <h4 className="font-bold text-brand-text">Explore {destination.name} on your terms</h4>
                  <p className="text-sm text-brand-muted">
                    Rent a self-drive vehicle and navigate through {destination.name} with complete freedom.
                  </p>
                  
                  <button 
                    onClick={() => router.push(`/search?location=${encodeURIComponent(destination.name)}`)}
                    className="w-full bg-brand-green hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
                  >
                    <Car className="w-5 h-5" />
                    Find Vehicles
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
