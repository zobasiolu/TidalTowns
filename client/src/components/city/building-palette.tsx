import { BuildingType } from "@shared/schema";
import { Resources } from "@shared/schema";
import { getBuildingIcon } from "@/lib/buildings";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BuildingPaletteProps {
  buildingTypes: BuildingType[];
  selectedType: BuildingType | null;
  onSelectType: (type: BuildingType | null) => void;
  resources: Resources;
}

export default function BuildingPalette({ 
  buildingTypes, 
  selectedType, 
  onSelectType,
  resources 
}: BuildingPaletteProps) {
  // Check if player has enough resources for a building
  const canAfford = (building: BuildingType) => {
    const cost = building.cost as any;
    return (
      resources.fish >= cost.fish &&
      resources.tourism >= cost.tourism &&
      resources.energy >= cost.energy
    );
  };

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6">
      {buildingTypes.map((building) => {
        const Icon = getBuildingIcon(building.type);
        const isSelected = selectedType?.id === building.id;
        const affordable = canAfford(building);
        
        return (
          <TooltipProvider key={building.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`w-12 h-12 rounded-lg ${
                    isSelected 
                      ? 'bg-secondary' 
                      : affordable 
                        ? 'bg-secondary-light hover:bg-secondary' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  } flex items-center justify-center transition-colors`}
                  title={building.name}
                  onClick={() => affordable && onSelectType(isSelected ? null : building)}
                  disabled={!affordable}
                >
                  <Icon className={`${isSelected ? 'text-white' : 'text-secondary-dark'} text-xl`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-64 p-4">
                <div className="space-y-2">
                  <h3 className="font-bold">{building.name}</h3>
                  <p className="text-sm text-gray-600">{building.description}</p>
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium">Cost:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-fishing rounded-full mr-1"></div>
                        <span>{(building.cost as any).fish}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-tourism rounded-full mr-1"></div>
                        <span>{(building.cost as any).tourism}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-energy rounded-full mr-1"></div>
                        <span>{(building.cost as any).energy}</span>
                      </div>
                    </div>
                  </div>
                  {building.production && (
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="text-sm font-medium">Production:</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-fishing rounded-full mr-1"></div>
                          <span>{(building.production as any).fish || 0}/hr</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-tourism rounded-full mr-1"></div>
                          <span>{(building.production as any).tourism || 0}/hr</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-energy rounded-full mr-1"></div>
                          <span>{(building.production as any).energy || 0}/hr</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!affordable && (
                    <div className="pt-2 text-xs text-red-500">
                      Insufficient resources
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      
      <div className="mt-auto">
        <Button 
          variant="outline" 
          size="icon"
          className="w-12 h-12 rounded-lg bg-red-100 hover:bg-red-200 text-red-500"
          onClick={() => onSelectType(null)}
        >
          <Trash className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
