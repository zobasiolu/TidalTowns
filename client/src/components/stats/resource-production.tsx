import { Resources } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Fish, Ship, Lightbulb } from "lucide-react";
import { calculateTideEffect } from "@/lib/tide-calculations";

interface ResourceProductionProps {
  resources: Resources;
  production: Resources;
  currentTideLevel: number | null;
}

export default function ResourceProduction({ 
  resources, 
  production,
  currentTideLevel 
}: ResourceProductionProps) {
  // Calculate the tide effect percentages
  const tideEffect = calculateTideEffect(currentTideLevel || 0);
  
  // Calculate total production as percentage of max capacity (arbitrary 1000 max)
  const fishPercent = Math.min(100, (resources.fish / 1000) * 100);
  const tourismPercent = Math.min(100, (resources.tourism / 1000) * 100);
  const energyPercent = Math.min(100, (resources.energy / 1000) * 100);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-heading font-medium text-lg mb-3">Resource Production</h3>
        <div className="space-y-4">
          {/* Fishing Resources */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-fishing rounded-full flex items-center justify-center text-white mr-2">
                  <Fish className="h-4 w-4" />
                </div>
                <span className="font-medium">Fishing</span>
              </div>
              <div className="text-lg font-medium">{resources.fish.toLocaleString()}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-fishing" 
                style={{ width: `${fishPercent}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className={tideEffect.fishingEffect > 0 ? 'text-green-600' : tideEffect.fishingEffect < 0 ? 'text-red-600' : 'text-gray-600'}>
                {tideEffect.fishingEffect > 0 ? '+' : ''}{tideEffect.fishingEffect}% ({tideEffect.tideType === 'high' ? 'High' : tideEffect.tideType === 'low' ? 'Low' : ''} Tide {tideEffect.fishingEffect > 0 ? 'Bonus' : 'Penalty'})
              </span>
              <span>{production.fish}/hr</span>
            </div>
          </div>
          
          {/* Tourism Resources */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-tourism rounded-full flex items-center justify-center text-white mr-2">
                  <Ship className="h-4 w-4" />
                </div>
                <span className="font-medium">Tourism</span>
              </div>
              <div className="text-lg font-medium">{resources.tourism.toLocaleString()}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-tourism" 
                style={{ width: `${tourismPercent}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className={tideEffect.tourismEffect > 0 ? 'text-green-600' : tideEffect.tourismEffect < 0 ? 'text-red-600' : 'text-gray-600'}>
                {tideEffect.tourismEffect > 0 ? '+' : ''}{tideEffect.tourismEffect}% ({tideEffect.tideType === 'low' ? 'Low' : tideEffect.tideType === 'high' ? 'High' : ''} Tide {tideEffect.tourismEffect > 0 ? 'Bonus' : 'Penalty'})
              </span>
              <span>{production.tourism}/hr</span>
            </div>
          </div>
          
          {/* Energy Resources */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-energy rounded-full flex items-center justify-center text-white mr-2">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <span className="font-medium">Energy</span>
              </div>
              <div className="text-lg font-medium">{resources.energy.toLocaleString()}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-energy" 
                style={{ width: `${energyPercent}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-gray-500">No tide effect</span>
              <span>{production.energy}/hr</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
