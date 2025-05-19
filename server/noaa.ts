import axios from 'axios';
import { format, addDays, parseISO, isAfter } from 'date-fns';
import { TideData, InsertTideData, TideStation } from '@shared/schema';
import { log } from './vite';

const NOAA_BASE_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

/**
 * Fetch the current water level for a specific NOAA station
 */
export async function getCurrentWaterLevel(stationId: string): Promise<number | null> {
  try {
    const now = new Date();
    const response = await axios.get(NOAA_BASE_URL, {
      params: {
        date: 'latest',
        station: stationId,
        product: 'water_level',
        datum: 'MLLW',
        units: 'english',
        time_zone: 'lst_ldt',
        format: 'json',
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].v);
    }
    return null;
  } catch (error) {
    log(`Error fetching current water level for station ${stationId}: ${error}`, 'noaa');
    return null;
  }
}

/**
 * Fetch tide predictions for a specific station for the next 24 hours
 */
export async function getTidePredictions(stationId: string, days = 1): Promise<InsertTideData[]> {
  try {
    const now = new Date();
    const end = addDays(now, days);
    
    const beginDate = format(now, 'yyyyMMdd');
    const endDate = format(end, 'yyyyMMdd');
    
    const response = await axios.get(NOAA_BASE_URL, {
      params: {
        begin_date: beginDate,
        end_date: endDate,
        station: stationId,
        product: 'predictions',
        datum: 'MLLW',
        units: 'english',
        time_zone: 'lst_ldt',
        format: 'json',
        interval: 'hilo', // Only get the high and low tide points
      }
    });

    if (!response.data || !response.data.predictions) {
      log(`No predictions found for station ${stationId}`, 'noaa');
      return [];
    }

    return response.data.predictions.map((pred: any): InsertTideData => ({
      stationId,
      timestamp: parseISO(pred.t),
      height: parseFloat(pred.v),
      type: pred.type, // "H" for high tide, "L" for low tide
      prediction: true
    }));
  } catch (error) {
    log(`Error fetching tide predictions for station ${stationId}: ${error}`, 'noaa');
    return [];
  }
}

/**
 * Fetch a list of available tide stations
 */
export async function getAvailableTideStations(): Promise<Partial<TideStation>[]> {
  try {
    // NOAA doesn't have a simple endpoint for this, so we'll use a list of major stations
    // In a real app, we would fetch this from a complete dataset
    return [
      { stationId: '9414290', name: 'San Francisco, CA', state: 'California', latitude: 37.8063, longitude: -122.4659, timezoneOffset: '-8' },
      { stationId: '8518750', name: 'The Battery, NY', state: 'New York', latitude: 40.7006, longitude: -74.0142, timezoneOffset: '-5' },
      { stationId: '8443970', name: 'Boston, MA', state: 'Massachusetts', latitude: 42.3539, longitude: -71.0503, timezoneOffset: '-5' },
      { stationId: '8638863', name: 'Chesapeake Bay Bridge, VA', state: 'Virginia', latitude: 36.9677, longitude: -76.1129, timezoneOffset: '-5' },
      { stationId: '8724580', name: 'Key West, FL', state: 'Florida', latitude: 24.5557, longitude: -81.8079, timezoneOffset: '-5' },
      { stationId: '9447130', name: 'Seattle, WA', state: 'Washington', latitude: 47.6026, longitude: -122.3393, timezoneOffset: '-8' },
      { stationId: '8661070', name: 'Wilmington, NC', state: 'North Carolina', latitude: 34.2275, longitude: -77.9536, timezoneOffset: '-5' },
      { stationId: '9410170', name: 'San Diego, CA', state: 'California', latitude: 32.7142, longitude: -117.1736, timezoneOffset: '-8' },
      { stationId: '9455920', name: 'Anchorage, AK', state: 'Alaska', latitude: 61.2381, longitude: -149.9261, timezoneOffset: '-9' },
      { stationId: '1611400', name: 'Honolulu, HI', state: 'Hawaii', latitude: 21.3067, longitude: -157.867, timezoneOffset: '-10' },
    ];
  } catch (error) {
    log(`Error fetching available tide stations: ${error}`, 'noaa');
    return [];
  }
}

/**
 * Determine if there's a potential storm surge event
 * This is a simplified implementation - real storm surge detection would use more complex data
 */
export function detectPotentialStormSurge(predictions: TideData[], recentTides: TideData[]): boolean {
  // Look for unusually high predicted tides compared to typical range
  if (predictions.length === 0 || recentTides.length === 0) return false;
  
  // Filter only high tides
  const highTides = recentTides.filter(tide => tide.type === 'H');
  if (highTides.length === 0) return false;
  
  // Calculate average high tide
  const avgHighTide = highTides.reduce((sum, tide) => sum + tide.height, 0) / highTides.length;
  
  // Look for upcoming high tides that are significantly higher than average
  const upcomingHighTides = predictions.filter(tide => 
    tide.type === 'H' && 
    isAfter(tide.timestamp, new Date()) && 
    tide.height > avgHighTide * 1.3 // 30% higher than average is our storm surge threshold
  );
  
  return upcomingHighTides.length > 0;
}
