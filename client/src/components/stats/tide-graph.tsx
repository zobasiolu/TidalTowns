import { useRef, useEffect, useState } from "react";
import { TideData } from "@shared/schema";
import { format, addHours, isAfter } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface TideGraphProps {
  tideData: TideData[];
  currentTideLevel: number | null;
  nextHighTide: TideData | undefined;
  nextLowTide: TideData | undefined;
}

export default function TideGraph({ 
  tideData, 
  currentTideLevel,
  nextHighTide,
  nextLowTide
}: TideGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [path, setPath] = useState<string>("");
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  
  useEffect(() => {
    if (tideData.length === 0 || !svgRef.current) return;
    
    // Sort tide data by timestamp
    const sortedData = [...tideData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Get the start and end times for the 24-hour window
    const startTime = new Date();
    const endTime = addHours(startTime, 24);
    
    // Filter data to only include predictions in our time window
    const filteredData = sortedData.filter(td => {
      const time = new Date(td.timestamp);
      return time >= startTime && time <= endTime;
    });
    
    if (filteredData.length === 0) return;
    
    // Add current tide data if available
    if (currentTideLevel !== null) {
      filteredData.unshift({
        id: -1, // temporary ID
        stationId: filteredData[0].stationId,
        timestamp: startTime,
        height: currentTideLevel,
        type: null,
        prediction: false
      });
    }
    
    // Generate SVG path
    const svgWidth = 600;
    const svgHeight = 100;
    const padding = 10;
    
    // Calculate min and max heights to scale the graph
    const minHeight = Math.min(...filteredData.map(d => d.height));
    const maxHeight = Math.max(...filteredData.map(d => d.height));
    const heightRange = maxHeight - minHeight || 1; // Prevent division by zero
    
    // Calculate x and y positions for each data point
    const points = filteredData.map(d => {
      const time = new Date(d.timestamp).getTime();
      const timeRange = endTime.getTime() - startTime.getTime();
      const x = ((time - startTime.getTime()) / timeRange) * (svgWidth - padding * 2) + padding;
      const y = svgHeight - padding - ((d.height - minHeight) / heightRange) * (svgHeight - padding * 2);
      return { x, y };
    });
    
    // Generate SVG path
    if (points.length > 1) {
      let pathD = `M${points[0].x},${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        // Use a smooth curve between points
        const cpX1 = (points[i-1].x + points[i].x) / 2;
        const cpY1 = points[i-1].y;
        const cpX2 = (points[i-1].x + points[i].x) / 2;
        const cpY2 = points[i].y;
        
        pathD += ` C${cpX1},${cpY1} ${cpX2},${cpY2} ${points[i].x},${points[i].y}`;
      }
      
      setPath(pathD);
    }
    
    // Calculate the current time position on the x-axis
    const currentTime = new Date().getTime();
    const timeRange = endTime.getTime() - startTime.getTime();
    const currentX = ((currentTime - startTime.getTime()) / timeRange) * (svgWidth - padding * 2) + padding;
    setCurrentTimePosition(currentX);
    
  }, [tideData, currentTideLevel]);
  
  // Format tide time for display
  const formatTideTime = (time: Date | string | undefined) => {
    if (!time) return 'Unknown';
    return format(new Date(time), 'h:mm a');
  };
  
  // Format tide height for display
  const formatTideHeight = (height: number | undefined) => {
    if (height === undefined) return 'Unknown';
    return `${height.toFixed(1)} ft`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-heading font-medium text-lg mb-3">Tide Forecast (24 Hours)</h3>
        <div className="tide-graph bg-blue-50 rounded-lg p-4">
          <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 600 100">
            {/* Horizontal gridlines */}
            <line x1="0" y1="25" x2="600" y2="25" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="75" x2="600" y2="75" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Tide curve */}
            <path 
              d={path} 
              fill="none" 
              stroke="#1E88E5" 
              strokeWidth="3" 
              className="tide-line" 
            />
            
            {/* Current time indicator */}
            <line 
              x1={currentTimePosition} 
              y1="0" 
              x2={currentTimePosition} 
              y2="100" 
              stroke="#FF9800" 
              strokeWidth="2" 
              strokeDasharray="4" 
            />
            {currentTideLevel !== null && (
              <circle 
                cx={currentTimePosition} 
                cy={50} 
                r="4" 
                fill="#FF9800" 
              />
            )}
          </svg>
          
          {/* Time labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Now</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
          </div>
        </div>
        
        {/* Tide Events */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">Next High Tide</div>
            <div className="font-medium">
              {formatTideTime(nextHighTide?.timestamp)} ({formatTideHeight(nextHighTide?.height)})
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">Next Low Tide</div>
            <div className="font-medium">
              {formatTideTime(nextLowTide?.timestamp)} ({formatTideHeight(nextLowTide?.height)})
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
