import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { calculateTideEffect } from "@/lib/tide-calculations";

export interface TideImpact {
  fishingEffect: number;
  tourismEffect: number;
  tideType: 'rising' | 'falling' | 'high' | 'low' | 'normal';
}

export function useTideData(stationId?: string, initialTideLevel: number | null = null) {
  const [currentTideLevel, setCurrentTideLevel] = useState<number | null>(initialTideLevel);
  const [tideImpact, setTideImpact] = useState<TideImpact>({
    fishingEffect: 0,
    tourismEffect: 0,
    tideType: 'normal'
  });
  
  // Get tide predictions for the station
  const { data: predictions } = useQuery({
    queryKey: ['/api/stations', stationId, 'tides'],
    enabled: !!stationId,
  });
  
  useEffect(() => {
    // Update current tide level if provided
    if (initialTideLevel !== null) {
      setCurrentTideLevel(initialTideLevel);
    }
    
    // Calculate tide effects on resources
    if (currentTideLevel !== null) {
      const effects = calculateTideEffect(currentTideLevel);
      setTideImpact(effects);
    }
  }, [initialTideLevel, currentTideLevel]);
  
  useEffect(() => {
    // If we have predictions, determine tide direction and update tide status
    if (predictions && predictions.length > 0) {
      const now = new Date();
      
      // Find next high and low tides
      const nextHighTide = predictions.find(t => 
        t.type === 'H' && new Date(t.timestamp) > now
      );
      
      const nextLowTide = predictions.find(t => 
        t.type === 'L' && new Date(t.timestamp) > now
      );
      
      // Determine if tide is rising or falling
      let tideType: 'rising' | 'falling' | 'high' | 'low' | 'normal' = 'normal';
      
      if (nextHighTide && nextLowTide) {
        if (new Date(nextHighTide.timestamp) < new Date(nextLowTide.timestamp)) {
          tideType = 'rising';
        } else {
          tideType = 'falling';
        }
      } else if (nextHighTide) {
        tideType = 'rising';
      } else if (nextLowTide) {
        tideType = 'falling';
      }
      
      // Determine if we're at high or low tide based on current level
      if (currentTideLevel !== null) {
        if (currentTideLevel >= 4.0) { // High tide threshold
          tideType = 'high';
        } else if (currentTideLevel <= 1.5) { // Low tide threshold
          tideType = 'low';
        }
      }
      
      // Update tide impact with type
      const effects = calculateTideEffect(currentTideLevel || 0);
      setTideImpact({
        ...effects,
        tideType
      });
    }
  }, [predictions, currentTideLevel]);
  
  return {
    currentTideLevel,
    tideImpact,
    predictions: predictions || []
  };
}
