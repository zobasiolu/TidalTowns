import { TideImpact } from "@/hooks/use-tide-data";

interface TideIndicatorProps {
  currentTideLevel: number | null;
  tideImpact: TideImpact;
}

export default function TideIndicator({ currentTideLevel, tideImpact }: TideIndicatorProps) {
  // Calculate tide height as percentage for the visual indicator (range: 0-5ft)
  const tideHeightPercent = currentTideLevel !== null 
    ? Math.min(100, Math.max(0, (currentTideLevel / 5) * 100))
    : 0;

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 flex items-center">
      <div className="mr-3">
        <div className="text-xs text-gray-500">Tide Impact</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-fishing rounded-full mr-1"></div>
            <span className={`text-sm font-medium ${tideImpact.fishingEffect > 0 ? 'text-green-600' : tideImpact.fishingEffect < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {tideImpact.fishingEffect > 0 ? '+' : ''}{tideImpact.fishingEffect}%
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-tourism rounded-full mr-1"></div>
            <span className={`text-sm font-medium ${tideImpact.tourismEffect > 0 ? 'text-green-600' : tideImpact.tourismEffect < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {tideImpact.tourismEffect > 0 ? '+' : ''}{tideImpact.tourismEffect}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-10 w-16 bg-blue-50 rounded overflow-hidden relative">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-primary-light transition-all duration-700"
          style={{ height: `${tideHeightPercent}%`, opacity: 0.7 }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-primary-dark font-medium">
          {currentTideLevel !== null ? `${currentTideLevel.toFixed(1)} ft` : '-'}
        </div>
      </div>
    </div>
  );
}
