import { Resources } from "@shared/schema";
import { Fish, Ship, Lightbulb, Waves } from "lucide-react";

interface ResourceBarProps {
  resources: Resources;
  currentTideLevel: number | null;
  tideType: 'rising' | 'falling' | 'high' | 'low' | 'normal';
}

export default function ResourceBar({ resources, currentTideLevel, tideType }: ResourceBarProps) {
  const getTideLabelText = () => {
    if (tideType === 'rising') return '(Rising)';
    if (tideType === 'falling') return '(Falling)';
    if (tideType === 'high') return '(High Tide)';
    if (tideType === 'low') return '(Low Tide)';
    return '';
  };

  return (
    <div className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center gap-6">
        {/* Resources Display */}
        <div className="flex items-center" title="Fishing Resources">
          <div className="w-8 h-8 bg-fishing rounded-full flex items-center justify-center text-white">
            <Fish className="h-4 w-4" />
          </div>
          <div className="ml-2">
            <div className="text-xs text-gray-500">Fish</div>
            <div className="font-medium">{resources.fish.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex items-center" title="Tourism Resources">
          <div className="w-8 h-8 bg-tourism rounded-full flex items-center justify-center text-white">
            <Ship className="h-4 w-4" />
          </div>
          <div className="ml-2">
            <div className="text-xs text-gray-500">Tourism</div>
            <div className="font-medium">{resources.tourism.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex items-center" title="Energy Resources">
          <div className="w-8 h-8 bg-energy rounded-full flex items-center justify-center text-white">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="ml-2">
            <div className="text-xs text-gray-500">Energy</div>
            <div className="font-medium">{resources.energy.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {/* Current Tide Status */}
      <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
        <div className="mr-3">
          <div className="text-xs text-gray-500">Current Tide</div>
          <div className="font-medium text-primary-dark">
            {currentTideLevel !== null ? `${currentTideLevel.toFixed(1)} ft` : 'Unknown'} 
            <span className="text-xs ml-1">{getTideLabelText()}</span>
          </div>
        </div>
        <div className="water-animation h-10 w-10 rounded-full flex items-center justify-center text-white">
          <Waves className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
