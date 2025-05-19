import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Zap, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Navigation() {
  const [location] = useLocation();
  const [activeCity, setActiveCity] = useState<number | null>(null);
  
  // Extract city ID from URL if present
  useEffect(() => {
    const match = location.match(/\/(?:city|stats|events)\/(\d+)/);
    if (match && match[1]) {
      setActiveCity(parseInt(match[1], 10));
    } else {
      setActiveCity(null);
    }
  }, [location]);

  // Fetch city details if we have an active city
  const { data: cityData, isLoading } = useQuery({
    queryKey: ['/api/cities', activeCity],
    enabled: activeCity !== null,
  });

  // Get tide status text
  const getTideStatus = () => {
    if (!cityData || cityData.currentTideLevel === null) return "Unknown";
    
    const nextHighTide = cityData.tideData?.find(t => t.type === 'H' && new Date(t.timestamp) > new Date());
    const nextLowTide = cityData.tideData?.find(t => t.type === 'L' && new Date(t.timestamp) > new Date());
    
    if (!nextHighTide && !nextLowTide) return "Stable";
    
    const isRising = nextHighTide && (!nextLowTide || new Date(nextHighTide.timestamp) < new Date(nextLowTide.timestamp));
    return isRising ? "Rising Tide" : "Falling Tide";
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              <h1 className="font-heading font-bold text-xl md:text-2xl">Tidal Towns</h1>
            </a>
          </Link>
        </div>
        
        {/* Current Station Info */}
        {activeCity && (
          <div className="flex items-center">
            {isLoading ? (
              <Skeleton className="h-6 w-32 bg-blue-700/30" />
            ) : (
              <>
                <span className="hidden md:inline-block mr-2 text-sm">Current Station:</span>
                <span className="font-medium mr-3">{cityData?.station?.name || 'Unknown'}</span>
                <div className="flex items-center text-xs bg-blue-700 px-2 py-1 rounded-full">
                  <span>{getTideStatus()}</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* User Menu */}
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" className="bg-blue-700 hover:bg-blue-800 transition text-white">
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden md:inline-block">Save</span>
          </Button>
          <div className="relative">
            <div className="flex items-center">
              <span className="hidden md:inline-block mr-2">Mayor Johnson</span>
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
