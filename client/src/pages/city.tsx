import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ResourceBar from "@/components/layout/resource-bar";
import BuildingPalette from "@/components/city/building-palette";
import IsometricView from "@/components/city/isometric-view";
import TideIndicator from "@/components/city/tide-indicator";
import CityNotification from "@/components/city/notification";
import { useCity } from "@/hooks/use-city";

export default function CityPage() {
  const { id } = useParams();
  const cityId = parseInt(id, 10);
  
  const { 
    city,
    isLoading,
    error,
    buildingTypes,
    buildings,
    currentTideLevel,
    tideImpact,
    activeStorms,
    selectedBuildingType,
    setSelectedBuildingType,
    placeBuilding,
    removeBuilding,
    isPlacingBuilding
  } = useCity(cityId);

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <Skeleton className="h-16 mb-4 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading City</h1>
            </div>
            <p className="text-gray-600">Unable to load the city. Please try again later or create a new city.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="cityBuilderView" className="flex-1 flex flex-col overflow-hidden">
      {/* City Builder Top Bar */}
      <ResourceBar 
        resources={city.resources}
        currentTideLevel={currentTideLevel}
        tideType={tideImpact.tideType}
      />
      
      {/* City Canvas and Build Tools */}
      <div className="flex-1 flex">
        <BuildingPalette 
          buildingTypes={buildingTypes}
          selectedType={selectedBuildingType}
          onSelectType={setSelectedBuildingType}
          resources={city.resources}
        />
        
        <div className="flex-1 relative bg-blue-100 overflow-auto">
          <IsometricView 
            buildings={buildings}
            selectedBuildingType={selectedBuildingType}
            onPlaceBuilding={placeBuilding}
            onRemoveBuilding={removeBuilding}
            isPlacingBuilding={isPlacingBuilding}
          />
          
          <TideIndicator 
            currentTideLevel={currentTideLevel}
            tideImpact={tideImpact}
          />
          
          {activeStorms.length > 0 && (
            <CityNotification 
              type="warning"
              title={activeStorms[0].title}
              message={activeStorms[0].description}
            />
          )}
        </div>
      </div>
    </div>
  );
}
