import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, cities, buildings, events, tideStations, tideData, insertCitySchema, insertBuildingSchema, defaultResourcesSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";
import { initializeCronJobs } from "./cron";
import { getTidePredictions, getCurrentWaterLevel } from "./noaa";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database tables and cron jobs
  try {
    // Initialize building types
    await storage.getBuildingTypes();
    
    // Initialize tide stations
    await storage.getTideStations();
    
    // Initialize cron jobs for resource updates and tide data
    initializeCronJobs();
  } catch (error) {
    log(`Error initializing database and cron jobs: ${error}`, 'routes');
  }

  // Tide station endpoints
  app.get("/api/stations", async (_req: Request, res: Response) => {
    try {
      const stations = await storage.getTideStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tide stations" });
    }
  });

  app.get("/api/stations/:stationId", async (req: Request, res: Response) => {
    try {
      const { stationId } = req.params;
      const station = await storage.getTideStationById(stationId);
      
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      
      // Get current tide level
      const currentTide = await storage.getCurrentTideData(stationId);
      let currentLevel = currentTide?.height;
      
      if (!currentLevel) {
        // Fetch from NOAA API if not in our DB
        currentLevel = await getCurrentWaterLevel(stationId);
        
        if (currentLevel !== null) {
          // Save it for future reference
          await storage.saveTideData([{
            stationId,
            timestamp: new Date(),
            height: currentLevel,
            type: null,
            prediction: false
          }]);
        }
      }
      
      // Get 24-hour predictions
      const predictions = await storage.getTidePredictions(stationId, 1);
      
      // Find next high and low tide
      const now = new Date();
      const upcomingTides = predictions
        .filter(p => p.timestamp > now)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const nextHighTide = upcomingTides.find(p => p.type === 'H');
      const nextLowTide = upcomingTides.find(p => p.type === 'L');
      
      res.json({
        station,
        currentTideLevel: currentLevel || null,
        predictions,
        nextHighTide,
        nextLowTide
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch station details" });
    }
  });

  // City endpoints
  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      // In a real app, we'd get the user ID from auth
      // For simplicity, we'll allow specifying user ID in query params
      const userIdParam = req.query.userId as string;
      const userId = userIdParam ? parseInt(userIdParam, 10) : 1;
      
      const userCities = await storage.getCitiesByUser(userId);
      res.json(userCities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.post("/api/cities", async (req: Request, res: Response) => {
    try {
      // Validate input
      const cityData = insertCitySchema.parse(req.body);
      
      // Check if station exists
      const station = await storage.getTideStationById(cityData.stationId);
      if (!station) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      // Create the city
      const city = await storage.createCity(cityData);
      
      // Add initial welcome event
      await storage.addEvent({
        cityId: city.id,
        type: "welcome",
        title: "Welcome to your new coastal city!",
        message: `You've established ${city.name} at ${station.name}. Build wisely with the tides!`,
        data: {},
        read: false
      });
      
      res.status(201).json(city);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid city data", details: error.message });
      }
      res.status(500).json({ error: "Failed to create city" });
    }
  });

  app.get("/api/cities/:id", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.id, 10);
      const city = await storage.getCityById(cityId);
      
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      
      // Get station info
      const station = await storage.getTideStationById(city.stationId);
      
      // Get current tide level
      const currentTide = await storage.getCurrentTideData(city.stationId);
      let currentLevel = currentTide?.height;
      
      if (!currentLevel) {
        currentLevel = await getCurrentWaterLevel(city.stationId);
      }
      
      // Get production rates
      const production = await storage.calculateResourceProduction(cityId, currentLevel || 0);
      
      // Get active storm events
      const activeStorms = await storage.getActiveStormEvents(city.stationId);
      
      res.json({
        city,
        station,
        currentTideLevel: currentLevel || null,
        production,
        activeStorms
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city details" });
    }
  });

  // Building endpoints
  app.get("/api/building-types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getBuildingTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch building types" });
    }
  });

  app.get("/api/cities/:id/buildings", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.id, 10);
      const cityBuildings = await storage.getCityBuildings(cityId);
      res.json(cityBuildings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city buildings" });
    }
  });

  app.post("/api/cities/:id/buildings", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.id, 10);
      
      // Validate building data
      const buildingData = insertBuildingSchema.parse({
        ...req.body,
        cityId
      });
      
      // Verify city exists
      const city = await storage.getCityById(cityId);
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      
      // Verify building type exists
      const buildingTypes = await storage.getBuildingTypes();
      const buildingType = buildingTypes.find(t => t.id === buildingData.buildingTypeId);
      
      if (!buildingType) {
        return res.status(400).json({ error: "Invalid building type" });
      }
      
      // Check if position is valid (not occupied)
      const existingBuildings = await storage.getCityBuildings(cityId);
      const positionTaken = existingBuildings.some(
        b => b.posX === buildingData.posX && b.posY === buildingData.posY
      );
      
      if (positionTaken) {
        return res.status(400).json({ error: "Position already occupied" });
      }
      
      // Check if sufficient resources
      const resources = defaultResourcesSchema.parse(city.resources);
      const cost = buildingType.cost as any;
      
      if (resources.fish < cost.fish || 
          resources.tourism < cost.tourism || 
          resources.energy < cost.energy) {
        return res.status(400).json({ error: "Insufficient resources" });
      }
      
      // Deduct resources
      const updatedResources = {
        fish: resources.fish - cost.fish,
        tourism: resources.tourism - cost.tourism,
        energy: resources.energy - cost.energy
      };
      
      await storage.updateCityResources(cityId, updatedResources);
      
      // Add the building
      const building = await storage.addBuilding(buildingData);
      
      // Create event
      await storage.addEvent({
        cityId,
        type: "building_constructed",
        title: `New ${buildingType.name} Constructed`,
        message: `Your new ${buildingType.name} has been built and is now operational.`,
        data: { buildingId: building.id },
        read: false
      });
      
      res.status(201).json(building);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid building data", details: error.message });
      }
      res.status(500).json({ error: "Failed to add building" });
    }
  });

  app.delete("/api/buildings/:id", async (req: Request, res: Response) => {
    try {
      const buildingId = parseInt(req.params.id, 10);
      const success = await storage.removeBuilding(buildingId);
      
      if (!success) {
        return res.status(404).json({ error: "Building not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove building" });
    }
  });

  // Event endpoints
  app.get("/api/cities/:id/events", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.id, 10);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      const cityEvents = await storage.getCityEvents(cityId, limit);
      res.json(cityEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city events" });
    }
  });

  app.patch("/api/events/:id/read", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      const success = await storage.markEventAsRead(eventId);
      
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark event as read" });
    }
  });

  // Tide data endpoints
  app.get("/api/stations/:stationId/tides", async (req: Request, res: Response) => {
    try {
      const { stationId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 1;
      
      const predictions = await storage.getTidePredictions(stationId, days);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tide predictions" });
    }
  });

  app.get("/api/stations/:stationId/history", async (req: Request, res: Response) => {
    try {
      const { stationId } = req.params;
      const daysParam = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - daysParam);
      
      const history = await storage.getTideDataForPeriod(stationId, start, now);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tide history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
