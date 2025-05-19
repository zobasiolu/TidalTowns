import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StationMap from "@/components/map/station-map";
import StationInfo from "@/components/map/station-info";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { TideStation } from "@shared/schema";

export default function MapPage() {
  const [, setLocation] = useLocation();
  const [selectedStation, setSelectedStation] = useState<TideStation | null>(null);

  const { data: stations, isLoading, error } = useQuery({
    queryKey: ['/api/stations'],
  });

  const { data: stationDetails } = useQuery({
    queryKey: ['/api/stations', selectedStation?.stationId],
    enabled: !!selectedStation,
  });
  
  const handleStationSelect = (station: TideStation) => {
    setSelectedStation(station);
  };

  const handleStartCity = async () => {
    if (!selectedStation) return;
    
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // In a real app, this would come from authentication
          name: `Tidal Bay - ${selectedStation.name}`,
          stationId: selectedStation.stationId,
          resources: { fish: 200, tourism: 200, energy: 200 },
          lastUpdated: new Date(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create city');
      }
      
      const city = await response.json();
      setLocation(`/city/${city.id}`);
    } catch (error) {
      console.error('Error creating city:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <h2 className="font-heading font-bold text-lg mb-4">Select a NOAA Tide Station</h2>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Stations</h1>
            </div>
            <p className="text-gray-600">Unable to load NOAA tide stations. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="worldMapView" className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="font-heading font-bold text-lg">Select a NOAA Tide Station</h2>
        <p className="text-sm text-gray-600">Choose a coastal station to start your city</p>
      </div>
      
      <div className="flex-1 relative bg-primary-light overflow-hidden">
        <StationMap 
          stations={stations} 
          selectedStation={selectedStation}
          onSelectStation={handleStationSelect}
        />
        
        {selectedStation && stationDetails && (
          <StationInfo 
            station={selectedStation}
            currentTide={stationDetails.currentTideLevel}
            nextHighTide={stationDetails.nextHighTide}
            nextLowTide={stationDetails.nextLowTide}
            onStartCity={handleStartCity}
          />
        )}
      </div>
    </div>
  );
}
