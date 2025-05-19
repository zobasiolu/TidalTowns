import { schedule } from 'node-cron';
import { format, addDays, addHours, subDays } from 'date-fns';
import { storage } from './storage';
import { getCurrentWaterLevel, detectPotentialStormSurge } from './noaa';
import { generateMayoralBulletin } from './mayoral-bulletins';
import { defaultResourcesSchema } from '@shared/schema';
import { log } from './vite';

// Function to update resources for a city based on current tide
async function updateCityResources(cityId: number): Promise<void> {
  try {
    // Get the city
    const city = await storage.getCityById(cityId);
    if (!city) {
      log(`City ${cityId} not found`, 'cron');
      return;
    }
    
    // Get current tide level for the city's station
    const currentTideData = await storage.getCurrentTideData(city.stationId);
    if (!currentTideData) {
      // If no current tide data, fetch it from NOAA API
      const currentLevel = await getCurrentWaterLevel(city.stationId);
      if (currentLevel === null) {
        log(`Could not fetch current water level for station ${city.stationId}`, 'cron');
        return;
      }
      
      // Save the current tide level
      await storage.saveTideData([{
        stationId: city.stationId,
        timestamp: new Date(),
        height: currentLevel,
        type: null,
        prediction: false
      }]);
    }
    
    // Use the tide height to calculate resource production
    const currentHeight = currentTideData?.height || 0;
    const production = await storage.calculateResourceProduction(cityId, currentHeight);
    
    // Update the city's resources
    const currentResources = defaultResourcesSchema.parse(city.resources);
    const updatedResources = {
      fish: currentResources.fish + production.fish,
      tourism: currentResources.tourism + production.tourism,
      energy: currentResources.energy + production.energy
    };
    
    await storage.updateCityResources(cityId, updatedResources);
    
    log(`Updated resources for city ${cityId}: +${production.fish} fish, +${production.tourism} tourism, +${production.energy} energy`, 'cron');
  } catch (error) {
    log(`Error updating resources for city ${cityId}: ${error}`, 'cron');
  }
}

// Function to check for potential storm events
async function checkForStormEvents(cityId: number): Promise<void> {
  try {
    // Get the city
    const city = await storage.getCityById(cityId);
    if (!city) return;
    
    // Get tide predictions for the next 24 hours
    const predictions = await storage.getTidePredictions(city.stationId, 1);
    
    // Get historical tide data for the past 7 days
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const recentTides = await storage.getTideDataForPeriod(city.stationId, sevenDaysAgo, now);
    
    // Check if there's a potential storm surge
    const isPotentialStorm = detectPotentialStormSurge(predictions, recentTides);
    
    if (isPotentialStorm) {
      // Check if there's already an active storm event
      const activeStorms = await storage.getActiveStormEvents(city.stationId);
      if (activeStorms.length === 0) {
        // Create a new storm event
        const highestPrediction = [...predictions]
          .filter(p => p.type === 'H')
          .sort((a, b) => b.height - a.height)[0];
          
        if (highestPrediction) {
          const startTime = new Date();
          const endTime = addHours(highestPrediction.timestamp, 6);
          const severity = Math.min(5, Math.floor(highestPrediction.height / 1.5));
          
          const stormEvent = await storage.createStormEvent({
            stationId: city.stationId,
            startTime,
            endTime,
            severity,
            title: 'Storm Surge Warning',
            description: `Unusually high tides of ${highestPrediction.height.toFixed(1)} ft expected. Prepare for potential coastal flooding.`,
            resolved: false
          });
          
          // Add an event notification
          await storage.addEvent({
            cityId,
            type: 'storm_surge',
            title: 'Storm Surge Warning',
            message: stormEvent.description,
            data: { stormEventId: stormEvent.id },
            read: false
          });
          
          log(`Created storm event for city ${cityId}: ${stormEvent.title}`, 'cron');
        }
      }
    }
  } catch (error) {
    log(`Error checking for storm events for city ${cityId}: ${error}`, 'cron');
  }
}

// Function to generate mayoral bulletins
async function generateMayoralUpdate(cityId: number): Promise<void> {
  try {
    const city = await storage.getCityById(cityId);
    if (!city) return;
    
    const station = await storage.getTideStationById(city.stationId);
    if (!station) return;
    
    // Get tide data for the next 24 hours
    const predictions = await storage.getTidePredictions(city.stationId, 1);
    
    // Get any active storm events
    const activeStorms = await storage.getActiveStormEvents(city.stationId);
    
    // Get building counts for context
    const buildings = await storage.getCityBuildings(cityId);
    const buildingCounts: Record<string, number> = {};
    
    buildings.forEach(building => {
      const type = building.type.type;
      buildingCounts[type] = (buildingCounts[type] || 0) + 1;
    });
    
    // Generate the bulletin
    const bulletin = await generateMayoralBulletin(
      predictions,
      city.name,
      station.name,
      defaultResourcesSchema.parse(city.resources),
      buildingCounts,
      activeStorms[0]
    );
    
    // Create an event for the bulletin
    await storage.addEvent({
      cityId,
      type: 'mayoral_bulletin',
      title: bulletin.title,
      message: bulletin.message,
      data: {},
      read: false
    });
    
    log(`Generated mayoral bulletin for city ${cityId}: ${bulletin.title}`, 'cron');
  } catch (error) {
    log(`Error generating mayoral update for city ${cityId}: ${error}`, 'cron');
  }
}

// Initialize cron jobs
export function initializeCronJobs(): void {
  // Update resources every 15 minutes
  schedule('*/15 * * * *', async () => {
    log('Running 15-minute cron job to update resources', 'cron');
    
    try {
      // Get all cities
      const allCities = await db.select().from(cities);
      
      // Process each city
      for (const city of allCities) {
        await updateCityResources(city.id);
        await checkForStormEvents(city.id);
      }
    } catch (error) {
      log(`Error in 15-minute cron job: ${error}`, 'cron');
    }
  });
  
  // Generate mayoral bulletins every 6 hours
  schedule('0 */6 * * *', async () => {
    log('Running 6-hour cron job to generate mayoral bulletins', 'cron');
    
    try {
      // Get all cities
      const allCities = await db.select().from(cities);
      
      // Process each city
      for (const city of allCities) {
        await generateMayoralUpdate(city.id);
      }
    } catch (error) {
      log(`Error in 6-hour cron job: ${error}`, 'cron');
    }
  });
  
  // Ensure we have up-to-date tide predictions daily
  schedule('0 0 * * *', async () => {
    log('Running daily cron job to update tide predictions', 'cron');
    
    try {
      // Get all active tide stations
      const stations = await storage.getTideStations();
      
      // Fetch 3-day predictions for each station
      for (const station of stations) {
        await storage.getTidePredictions(station.stationId, 3);
        log(`Updated 3-day tide predictions for station ${station.name}`, 'cron');
      }
    } catch (error) {
      log(`Error in daily cron job: ${error}`, 'cron');
    }
  });
  
  log('Cron jobs initialized', 'cron');
}

// Import for db access in cron job
import { db } from './db';
import { cities } from '@shared/schema';
