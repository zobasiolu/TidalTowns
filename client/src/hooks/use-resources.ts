import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { City, Resources } from "@shared/schema";

export function useResources(cityId: number, city?: City) {
  // Mutation to update city resources
  const updateResourcesMutation = useMutation({
    mutationFn: async (resources: Resources) => {
      return apiRequest('PATCH', `/api/cities/${cityId}/resources`, { resources });
    },
    onSuccess: () => {
      // Invalidate city data query to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId] });
    }
  });
  
  // Function to update resources
  const updateResources = (newResources: Partial<Resources>) => {
    if (!city || !city.resources) return;
    
    // Merge current resources with new values
    const currentResources = city.resources as Resources;
    const updatedResources: Resources = {
      fish: newResources.fish ?? currentResources.fish,
      tourism: newResources.tourism ?? currentResources.tourism,
      energy: newResources.energy ?? currentResources.energy
    };
    
    updateResourcesMutation.mutate(updatedResources);
  };
  
  // Function to check if player can afford a cost
  const canAfford = (cost: Partial<Resources>): boolean => {
    if (!city || !city.resources) return false;
    
    const currentResources = city.resources as Resources;
    
    return (
      (cost.fish === undefined || currentResources.fish >= cost.fish) &&
      (cost.tourism === undefined || currentResources.tourism >= cost.tourism) &&
      (cost.energy === undefined || currentResources.energy >= cost.energy)
    );
  };
  
  return {
    resources: city?.resources as Resources | undefined,
    updateResources,
    canAfford,
    isUpdating: updateResourcesMutation.isPending
  };
}
