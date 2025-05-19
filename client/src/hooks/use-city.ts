import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useTideData } from "@/hooks/use-tide-data";
import { useResources } from "@/hooks/use-resources";
import { BuildingType } from "@shared/schema";

export function useCity(cityId: number) {
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  
  // Get city data
  const { data: cityData, isLoading: isLoadingCity, error: cityError } = useQuery({
    queryKey: ['/api/cities', cityId],
    enabled: !isNaN(cityId),
  });

  // Get buildings for city
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['/api/cities', cityId, 'buildings'],
    enabled: !isNaN(cityId),
  });

  // Get building types
  const { data: buildingTypes, isLoading: isLoadingBuildingTypes } = useQuery({
    queryKey: ['/api/building-types'],
  });

  // Get active storm events
  const activeStorms = cityData?.activeStorms || [];
  
  // Get tide data and related calculations
  const { tideImpact, currentTideLevel } = useTideData(
    cityData?.station?.stationId,
    cityData?.currentTideLevel
  );
  
  // Track resource updates
  const { updateResources } = useResources(cityId, cityData?.city);

  // Determine if we're in building placement mode
  const isPlacingBuilding = selectedBuildingType !== null;

  // Place building mutation
  const placeBuildingMutation = useMutation({
    mutationFn: async (buildingData: { posX: number; posY: number }) => {
      if (!selectedBuildingType) throw new Error("No building type selected");
      
      return apiRequest(
        'POST',
        `/api/cities/${cityId}/buildings`,
        {
          buildingTypeId: selectedBuildingType.id,
          posX: buildingData.posX,
          posY: buildingData.posY,
          health: 100
        }
      );
    },
    onSuccess: () => {
      // Reset selection after placement
      setSelectedBuildingType(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId] });
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId, 'buildings'] });
    }
  });
  
  // Remove building mutation
  const removeBuildingMutation = useMutation({
    mutationFn: async (buildingId: number) => {
      return apiRequest('DELETE', `/api/buildings/${buildingId}`, {});
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId] });
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId, 'buildings'] });
    }
  });
  
  // Place building handler
  const placeBuilding = (x: number, y: number) => {
    placeBuildingMutation.mutate({ posX: x, posY: y });
  };
  
  // Remove building handler
  const removeBuilding = (buildingId: number) => {
    removeBuildingMutation.mutate(buildingId);
  };
  
  // Overall loading state
  const isLoading = isLoadingCity || isLoadingBuildings || isLoadingBuildingTypes;

  return {
    city: cityData?.city,
    station: cityData?.station,
    production: cityData?.production,
    currentTideLevel,
    buildings: buildings || [],
    buildingTypes: buildingTypes || [],
    activeStorms,
    tideImpact,
    selectedBuildingType,
    setSelectedBuildingType,
    placeBuilding,
    removeBuilding,
    isPlacingBuilding,
    isLoading,
    error: cityError
  };
}
