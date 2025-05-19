import { TideImpact } from "@/hooks/use-tide-data";

/**
 * Calculate the effect of the current tide level on resource production
 * 
 * - High tide (above 3.5ft) boosts fishing production
 * - Low tide (below 1.5ft) boosts tourism production
 */
export function calculateTideEffect(tideHeight: number): TideImpact {
  // Determine tide type
  let tideType: 'rising' | 'falling' | 'high' | 'low' | 'normal' = 'normal';
  
  if (tideHeight >= 4.0) {
    tideType = 'high';
  } else if (tideHeight <= 1.5) {
    tideType = 'low';
  }
  
  // Calculate fishing effect (high tide bonus)
  // High tide threshold: 3.5ft
  // Max bonus: 30% at 5.0ft or higher
  let fishingEffect = 0;
  if (tideHeight > 3.5) {
    const highTideBonus = Math.min(30, Math.round((tideHeight - 3.5) / 1.5 * 30));
    fishingEffect = highTideBonus;
  } else if (tideHeight < 2.0) {
    // Penalty for fishing during low tides
    const lowTidePenalty = Math.min(15, Math.round((2.0 - tideHeight) / 2.0 * 15));
    fishingEffect = -lowTidePenalty;
  }
  
  // Calculate tourism effect (low tide bonus)
  // Low tide threshold: 2.0ft
  // Max bonus: 25% at 0.5ft or lower
  let tourismEffect = 0;
  if (tideHeight < 2.0) {
    const lowTideBonus = Math.min(25, Math.round((2.0 - tideHeight) / 1.5 * 25));
    tourismEffect = lowTideBonus;
  } else if (tideHeight > 3.5) {
    // Penalty for tourism during high tides
    const highTidePenalty = Math.min(10, Math.round((tideHeight - 3.5) / 1.5 * 10));
    tourismEffect = -highTidePenalty;
  }
  
  return {
    fishingEffect,
    tourismEffect,
    tideType
  };
}

/**
 * Determine if a tide height is exceptionally high or low
 */
export function isExtremeHeight(tideHeight: number): { 
  isExtreme: boolean; 
  type: 'high' | 'low' | 'normal';
  severityLevel: number; // 0-3 scale
} {
  if (tideHeight >= 5.5) {
    // Extremely high tide
    const severity = Math.min(3, Math.floor((tideHeight - 5.5) / 0.5));
    return { isExtreme: true, type: 'high', severityLevel: severity };
  } 
  
  if (tideHeight <= 0.5) {
    // Extremely low tide
    const severity = Math.min(3, Math.floor((0.5 - tideHeight) / 0.2));
    return { isExtreme: true, type: 'low', severityLevel: severity };
  }
  
  // Normal tide levels
  return { isExtreme: false, type: 'normal', severityLevel: 0 };
}

/**
 * Calculate the tide-based damage potential during a storm event
 */
export function calculateStormDamage(stormSeverity: number, tideHeight: number): number {
  // Storm severity is 1-5 scale
  // Higher tides magnify storm damage potential
  // Damage potential is used to determine building health reduction
  
  // Base damage from storm severity
  const baseDamage = stormSeverity * 5; // 5-25 base damage
  
  // Tide multiplier: higher tides increase damage potential
  const tideMultiplier = tideHeight >= 5.0 ? 1.5 :
                         tideHeight >= 4.0 ? 1.3 :
                         tideHeight >= 3.0 ? 1.1 : 1.0;
  
  return Math.round(baseDamage * tideMultiplier);
}

/**
 * Format the tide height with appropriate description
 */
export function formatTideDescription(height: number): string {
  if (height >= 5.5) return 'Extreme High Tide';
  if (height >= 4.5) return 'Very High Tide';
  if (height >= 3.5) return 'High Tide';
  if (height >= 2.0) return 'Medium Tide';
  if (height >= 1.0) return 'Low Tide';
  return 'Very Low Tide';
}
