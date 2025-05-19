import { db } from "./db";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import {
  users, cities, tideStations, tideData, buildings, events, stormEvents, buildingTypes,
  type User, type InsertUser,
  type City, type InsertCity,
  type TideStation, type InsertTideStation,
  type TideData, type InsertTideData,
  type Building, type InsertBuilding,
  type Event, type InsertEvent,
  type StormEvent, type InsertStormEvent,
  type BuildingType, type InsertBuildingType,
  type Resources, defaultResourcesSchema
} from "@shared/schema";
import { getTidePredictions, getAvailableTideStations } from "./noaa";
import { log } from "./vite";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Station operations
  getTideStations(): Promise<TideStation[]>;
  saveTideStation(station: InsertTideStation): Promise<TideStation>;
  getTideStationById(stationId: string): Promise<TideStation | undefined>;

  // Tide data operations
  getCurrentTideData(stationId: string): Promise<TideData | undefined>;
  getTideDataForPeriod(stationId: string, start: Date, end: Date): Promise<TideData[]>;
  saveTideData(tideData: InsertTideData[]): Promise<TideData[]>;
  getTidePredictions(stationId: string, days: number): Promise<TideData[]>;

  // City operations
  getCityById(id: number): Promise<City | undefined>;
  getCitiesByUser(userId: number): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCityResources(cityId: number, resources: Resources): Promise<City>;

  // Building operations
  getBuildingTypes(): Promise<BuildingType[]>;
  saveBuildingType(buildingType: InsertBuildingType): Promise<BuildingType>;
  getCityBuildings(cityId: number): Promise<(Building & { type: BuildingType })[]>;
  addBuilding(building: InsertBuilding): Promise<Building>;
  removeBuilding(buildingId: number): Promise<boolean>;
  updateBuildingHealth(buildingId: number, health: number): Promise<Building>;

  // Event operations
  getCityEvents(cityId: number, limit?: number): Promise<Event[]>;
  addEvent(event: InsertEvent): Promise<Event>;
  markEventAsRead(eventId: number): Promise<boolean>;

  // Storm events
  getActiveStormEvents(stationId: string): Promise<StormEvent[]>;
  createStormEvent(stormEvent: InsertStormEvent): Promise<StormEvent>;
  resolveStormEvent(stormEventId: number): Promise<StormEvent>;
  
  // Resource calculations
  calculateResourceProduction(cityId: number, currentTideHeight: number): Promise<Resources>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Station operations
  async getTideStations(): Promise<TideStation[]> {
    const stationsDb = await db.select().from(tideStations);
    
    if (stationsDb.length === 0) {
      // If no stations in DB, fetch from NOAA and save
      const noaaStations = await getAvailableTideStations();
      const savedStations = [];
      
      for (const station of noaaStations) {
        if (station.stationId && station.name && station.latitude && station.longitude) {
          const insertData: InsertTideStation = {
            stationId: station.stationId,
            name: station.name,
            state: station.state || null,
            latitude: station.latitude,
            longitude: station.longitude,
            timezoneOffset: station.timezoneOffset || null
          };
          
          const [savedStation] = await db
            .insert(tideStations)
            .values(insertData)
            .returning();
            
          savedStations.push(savedStation);
        }
      }
      
      return savedStations;
    }
    
    return stationsDb;
  }

  async saveTideStation(station: InsertTideStation): Promise<TideStation> {
    const [savedStation] = await db
      .insert(tideStations)
      .values(station)
      .returning();
    return savedStation;
  }

  async getTideStationById(stationId: string): Promise<TideStation | undefined> {
    const [station] = await db
      .select()
      .from(tideStations)
      .where(eq(tideStations.stationId, stationId));
    return station || undefined;
  }

  // Tide data operations
  async getCurrentTideData(stationId: string): Promise<TideData | undefined> {
    const [current] = await db
      .select()
      .from(tideData)
      .where(eq(tideData.stationId, stationId))
      .orderBy(desc(tideData.timestamp))
      .limit(1);
    return current || undefined;
  }

  async getTideDataForPeriod(stationId: string, start: Date, end: Date): Promise<TideData[]> {
    return db
      .select()
      .from(tideData)
      .where(
        and(
          eq(tideData.stationId, stationId),
          gte(tideData.timestamp, start),
          lte(tideData.timestamp, end)
        )
      )
      .orderBy(tideData.timestamp);
  }

  async saveTideData(data: InsertTideData[]): Promise<TideData[]> {
    if (data.length === 0) return [];
    
    const savedData = await db
      .insert(tideData)
      .values(data)
      .returning();
    
    return savedData;
  }

  async getTidePredictions(stationId: string, days: number): Promise<TideData[]> {
    // First check if we already have predictions for this period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);
    
    const existingPredictions = await this.getTideDataForPeriod(stationId, now, endDate);
    
    if (existingPredictions.length > 0) {
      return existingPredictions;
    }
    
    // If not, fetch from NOAA and save
    const predictions = await getTidePredictions(stationId, days);
    if (predictions.length === 0) return [];
    
    return this.saveTideData(predictions);
  }

  // City operations
  async getCityById(id: number): Promise<City | undefined> {
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, id));
    return city || undefined;
  }

  async getCitiesByUser(userId: number): Promise<City[]> {
    return db
      .select()
      .from(cities)
      .where(eq(cities.userId, userId));
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db
      .insert(cities)
      .values(city)
      .returning();
    return newCity;
  }

  async updateCityResources(cityId: number, resources: Resources): Promise<City> {
    const [updatedCity] = await db
      .update(cities)
      .set({ 
        resources: resources,
        lastUpdated: new Date()
      })
      .where(eq(cities.id, cityId))
      .returning();
    
    return updatedCity;
  }

  // Building operations
  async getBuildingTypes(): Promise<BuildingType[]> {
    const types = await db.select().from(buildingTypes);
    
    // If no building types exist, create defaults
    if (types.length === 0) {
      const defaultTypes: InsertBuildingType[] = [
        {
          type: 'fishing_dock',
          name: 'Fishing Dock',
          description: 'Generates fishing resources. Production boosted by high tides.',
          cost: { fish: 50, tourism: 20, energy: 30 },
          production: { fish: 15, tourism: 0, energy: -2 },
          protection: 0,
          icon: 'ri-ship-line'
        },
        {
          type: 'beach_resort',
          name: 'Beach Resort',
          description: 'Generates tourism resources. Production boosted by low tides.',
          cost: { fish: 30, tourism: 50, energy: 40 },
          production: { fish: 0, tourism: 15, energy: -3 },
          protection: 0,
          icon: 'ri-hotel-line'
        },
        {
          type: 'lighthouse',
          name: 'Lighthouse',
          description: 'Helps protect ships during high tides and generates tourism.',
          cost: { fish: 80, tourism: 100, energy: 120 },
          production: { fish: 5, tourism: 10, energy: -5 },
          protection: 15,
          icon: 'ri-lighthouse-line'
        },
        {
          type: 'seawall',
          name: 'Seawall',
          description: 'Protects buildings from storm surge events.',
          cost: { fish: 60, tourism: 20, energy: 50 },
          production: { fish: 0, tourism: -5, energy: 0 },
          protection: 25,
          icon: 'ri-layout-bottom-line'
        },
        {
          type: 'house',
          name: 'House',
          description: 'Residential building for your citizens.',
          cost: { fish: 40, tourism: 30, energy: 20 },
          production: { fish: 0, tourism: 5, energy: -1 },
          protection: 0,
          icon: 'ri-home-line'
        },
        {
          type: 'power_plant',
          name: 'Power Plant',
          description: 'Generates energy for your city.',
          cost: { fish: 70, tourism: 30, energy: 50 },
          production: { fish: -5, tourism: -10, energy: 20 },
          protection: 0,
          icon: 'ri-battery-charge-line'
        }
      ];
      
      for (const type of defaultTypes) {
        await db.insert(buildingTypes).values(type);
      }
      
      return db.select().from(buildingTypes);
    }
    
    return types;
  }

  async saveBuildingType(buildingType: InsertBuildingType): Promise<BuildingType> {
    const [savedType] = await db
      .insert(buildingTypes)
      .values(buildingType)
      .returning();
    return savedType;
  }

  async getCityBuildings(cityId: number): Promise<(Building & { type: BuildingType })[]> {
    const results = await db
      .select({
        building: buildings,
        type: buildingTypes
      })
      .from(buildings)
      .innerJoin(buildingTypes, eq(buildings.buildingTypeId, buildingTypes.id))
      .where(eq(buildings.cityId, cityId));
    
    return results.map(r => ({
      ...r.building,
      type: r.type
    }));
  }

  async addBuilding(building: InsertBuilding): Promise<Building> {
    const [newBuilding] = await db
      .insert(buildings)
      .values(building)
      .returning();
    return newBuilding;
  }

  async removeBuilding(buildingId: number): Promise<boolean> {
    const result = await db
      .delete(buildings)
      .where(eq(buildings.id, buildingId))
      .returning({ id: buildings.id });
    
    return result.length > 0;
  }

  async updateBuildingHealth(buildingId: number, health: number): Promise<Building> {
    const [updatedBuilding] = await db
      .update(buildings)
      .set({ health })
      .where(eq(buildings.id, buildingId))
      .returning();
    
    return updatedBuilding;
  }

  // Event operations
  async getCityEvents(cityId: number, limit = 20): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .where(eq(events.cityId, cityId))
      .orderBy(desc(events.createdAt))
      .limit(limit);
  }

  async addEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async markEventAsRead(eventId: number): Promise<boolean> {
    const result = await db
      .update(events)
      .set({ read: true })
      .where(eq(events.id, eventId))
      .returning({ id: events.id });
    
    return result.length > 0;
  }

  // Storm events
  async getActiveStormEvents(stationId: string): Promise<StormEvent[]> {
    const now = new Date();
    
    return db
      .select()
      .from(stormEvents)
      .where(
        and(
          eq(stormEvents.stationId, stationId),
          eq(stormEvents.resolved, false),
          lte(stormEvents.startTime, now),
          gte(stormEvents.endTime, now)
        )
      );
  }

  async createStormEvent(stormEvent: InsertStormEvent): Promise<StormEvent> {
    const [newStormEvent] = await db
      .insert(stormEvents)
      .values(stormEvent)
      .returning();
    return newStormEvent;
  }

  async resolveStormEvent(stormEventId: number): Promise<StormEvent> {
    const [resolvedEvent] = await db
      .update(stormEvents)
      .set({ resolved: true })
      .where(eq(stormEvents.id, stormEventId))
      .returning();
    
    return resolvedEvent;
  }
  
  // Resource calculations
  async calculateResourceProduction(cityId: number, currentTideHeight: number): Promise<Resources> {
    // Get city buildings with their types
    const cityBuildings = await this.getCityBuildings(cityId);
    
    // Initialize production totals
    let fishProduction = 0;
    let tourismProduction = 0;
    let energyProduction = 0;
    
    // Process each building's base production
    for (const building of cityBuildings) {
      const production = building.type.production as any;
      if (!production) continue;
      
      fishProduction += production.fish || 0;
      tourismProduction += production.tourism || 0;
      energyProduction += production.energy || 0;
    }
    
    // Apply tide effects:
    // - High tide (above 3.5 ft) boosts fishing
    // - Low tide (below 2 ft) boosts tourism
    const highTideBonus = Math.max(0, (currentTideHeight - 3.5) / 3.5);  // Percentage boost based on how high above 3.5
    const lowTideBonus = Math.max(0, (2 - currentTideHeight) / 2);       // Percentage boost based on how far below 2
    
    // Apply bonuses (max 50% boost)
    const fishBonus = Math.min(0.5, highTideBonus) * fishProduction;
    const tourismBonus = Math.min(0.5, lowTideBonus) * tourismProduction;
    
    // Calculate final production values
    const finalProduction = {
      fish: Math.max(0, Math.round(fishProduction + fishBonus)),
      tourism: Math.max(0, Math.round(tourismProduction + tourismBonus)),
      energy: Math.max(0, Math.round(energyProduction))
    };
    
    return finalProduction;
  }
}

export const storage = new DatabaseStorage();
