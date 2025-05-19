import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TideGraph from "@/components/stats/tide-graph";
import ResourceProduction from "@/components/stats/resource-production";
import BuildingsSummary from "@/components/stats/buildings-summary";
import TideHistory from "@/components/stats/tide-history";

export default function StatsPage() {
  const { id } = useParams();
  const cityId = parseInt(id, 10);
  
  const { data: cityData, isLoading: isLoadingCity, error: cityError } = useQuery({
    queryKey: ['/api/cities', cityId],
  });

  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['/api/cities', cityId, 'buildings'],
    enabled: !!cityId,
  });

  const { data: tideData, isLoading: isLoadingTides } = useQuery({
    queryKey: ['/api/stations', cityData?.city?.stationId, 'tides'],
    enabled: !!cityData?.city?.stationId,
  });

  const { data: tideHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/stations', cityData?.city?.stationId, 'history'],
    enabled: !!cityData?.city?.stationId,
  });

  const isLoading = isLoadingCity || isLoadingBuildings || isLoadingTides || isLoadingHistory;

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <Skeleton className="h-16 mb-4 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (cityError || !cityData) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Stats</h1>
            </div>
            <p className="text-gray-600">Unable to load the city statistics. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="statsDashboardView" className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="font-heading font-bold text-lg">City Statistics</h2>
        <p className="text-sm text-gray-600">Track your city's performance and tide patterns</p>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tide Graph Card */}
          <TideGraph 
            tideData={tideData || []}
            currentTideLevel={cityData.currentTideLevel}
            nextHighTide={tideData?.find(t => t.type === 'H' && new Date(t.timestamp) > new Date())}
            nextLowTide={tideData?.find(t => t.type === 'L' && new Date(t.timestamp) > new Date())}
          />
          
          {/* Resource Production Card */}
          <ResourceProduction 
            resources={cityData.city.resources}
            production={cityData.production}
            currentTideLevel={cityData.currentTideLevel}
          />
          
          {/* Buildings Summary */}
          <BuildingsSummary buildings={buildings || []} />
          
          {/* Tide History */}
          <TideHistory tideHistory={tideHistory || []} />
        </div>
      </div>
    </div>
  );
}
