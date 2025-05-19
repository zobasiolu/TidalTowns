import { format } from "date-fns";
import { TideStation, TideData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Anchor, Clock } from "lucide-react";

interface StationInfoProps {
  station: TideStation;
  currentTide: number | null;
  nextHighTide: TideData | null;
  nextLowTide: TideData | null;
  onStartCity: () => void;
}

export default function StationInfo({
  station,
  currentTide,
  nextHighTide,
  nextLowTide,
  onStartCity
}: StationInfoProps) {
  const formatTideTime = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown';
    return format(new Date(dateString), 'h:mm a');
  };
  
  return (
    <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-start">
        <h3 className="font-heading font-bold text-lg">{station.name}</h3>
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Available</span>
      </div>
      
      <div className="mt-3 flex items-center text-sm">
        <Anchor className="mr-2 text-primary h-4 w-4" />
        <span>
          Current tide: <b>{currentTide !== null ? `${currentTide.toFixed(1)} ft` : 'Unknown'}</b>
          {nextHighTide && nextLowTide && (
            <span>
              {new Date(nextHighTide.timestamp) < new Date(nextLowTide.timestamp) ? ' (Rising)' : ' (Falling)'}
            </span>
          )}
        </span>
      </div>
      
      {nextHighTide && (
        <div className="mt-1 flex items-center text-sm">
          <Clock className="mr-2 text-gray-500 h-4 w-4" />
          <span>
            High tide at: <b>{formatTideTime(nextHighTide.timestamp)}</b> today
            {nextHighTide.height && <span> ({nextHighTide.height.toFixed(1)} ft)</span>}
          </span>
        </div>
      )}
      
      {nextLowTide && (
        <div className="mt-1 flex items-center text-sm">
          <Clock className="mr-2 text-gray-500 h-4 w-4" />
          <span>
            Low tide at: <b>{formatTideTime(nextLowTide.timestamp)}</b> today
            {nextLowTide.height && <span> ({nextLowTide.height.toFixed(1)} ft)</span>}
          </span>
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          className="w-full bg-primary hover:bg-primary-dark text-white"
          onClick={onStartCity}
        >
          Start City Here
        </Button>
      </div>
    </div>
  );
}
