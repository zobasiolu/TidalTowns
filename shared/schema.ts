import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// NOAA Tide Station model
export const tideStations = pgTable("tide_stations", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull().unique(),
  name: text("name").notNull(),
  state: text("state"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  timezoneOffset: text("timezone_offset"),
});

export const insertTideStationSchema = createInsertSchema(tideStations).omit({
  id: true,
});

export type InsertTideStation = z.infer<typeof insertTideStationSchema>;
export type TideStation = typeof tideStations.$inferSelect;

// Tide Data model
export const tideData = pgTable("tide_data", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  height: doublePrecision("height").notNull(),
  type: text("type"), // HIGH or LOW
  prediction: boolean("prediction").default(false), // true if this is a prediction
});

export const insertTideDataSchema = createInsertSchema(tideData).omit({
  id: true,
});

export type InsertTideData = z.infer<typeof insertTideDataSchema>;
export type TideData = typeof tideData.$inferSelect;

// Building Types model
export const buildingTypes = pgTable("building_types", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cost: json("cost").notNull(),
  production: json("production"),
  protection: integer("protection").default(0),
  icon: text("icon").notNull(),
});

export const insertBuildingTypeSchema = createInsertSchema(buildingTypes).omit({
  id: true,
});

export type InsertBuildingType = z.infer<typeof insertBuildingTypeSchema>;
export type BuildingType = typeof buildingTypes.$inferSelect;

// City model
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  stationId: text("station_id").notNull(),
  resources: json("resources").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
});

export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;

// Building model
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  buildingTypeId: integer("building_type_id").notNull(),
  posX: integer("pos_x").notNull(),
  posY: integer("pos_y").notNull(),
  health: integer("health").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({
  id: true,
  createdAt: true,
});

export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildings.$inferSelect;

// Events model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: json("data"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Storm Event model
export const stormEvents = pgTable("storm_events", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  severity: integer("severity").notNull(), // 1-5 scale
  title: text("title").notNull(),
  description: text("description").notNull(),
  resolved: boolean("resolved").default(false),
});

export const insertStormEventSchema = createInsertSchema(stormEvents).omit({
  id: true,
});

export type InsertStormEvent = z.infer<typeof insertStormEventSchema>;
export type StormEvent = typeof stormEvents.$inferSelect;

// Default resource schema
export const defaultResourcesSchema = z.object({
  fish: z.number().default(100),
  tourism: z.number().default(100),
  energy: z.number().default(100),
});

export type Resources = z.infer<typeof defaultResourcesSchema>;
