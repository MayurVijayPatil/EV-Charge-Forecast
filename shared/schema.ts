import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, doublePrecision, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Historical Data
export const evStats = pgTable("ev_stats", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  year: integer("year").notNull(),
  evType: text("ev_type").notNull(), // BEV, PHEV, etc.
  count: integer("count").notNull(),
  chargingDemandKwh: doublePrecision("charging_demand_kwh").notNull(),
});

// Detailed Charging Records
export const chargingRecords = pgTable("charging_records", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  batteryCapacityKwh: doublePrecision("battery_capacity_kwh"),
  energyConsumedKwh: doublePrecision("energy_consumed_kwh").notNull(),
  chargingDurationHours: doublePrecision("charging_duration_hours"),
  chargingRateKw: doublePrecision("charging_rate_kw"),
  chargerType: text("charger_type"), // DC Fast Charger, Level 1, Level 2
  userType: text("user_type"), // Commuter, Casual Driver, Long-Distance Traveler
  chargingStartTime: timestamp("charging_start_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forecast Results
export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  year: integer("year").notNull(),
  evType: text("ev_type").notNull(),
  predictedCount: integer("predicted_count").notNull(),
  predictedDemandKwh: doublePrecision("predicted_demand_kwh").notNull(),
  modelUsed: text("model_used").notNull(), // e.g., "Linear Regression", "Prophet"
  createdAt: timestamp("created_at").defaultNow(),
});

// Grid Impact Analysis Tables
export const gridCapacity = pgTable("grid_capacity", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  substationName: varchar("substation_name", { length: 255 }),
  currentCapacityMw: doublePrecision("current_capacity_mw").notNull(),
  evLoadMw: doublePrecision("ev_load_mw").notNull(),
  upgradeNeeded: integer("upgrade_needed").notNull().default(0), // 0 = false, 1 = true
  upgradeCostUsd: doublePrecision("upgrade_cost_usd"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chargingProfiles = pgTable("charging_profiles", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  avgDemandKw: doublePrecision("avg_demand_kw").notNull(),
  peakDemandKw: doublePrecision("peak_demand_kw").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export const insertEvStatSchema = createInsertSchema(evStats).omit({ id: true });
export const insertChargingRecordSchema = createInsertSchema(chargingRecords).omit({ id: true, createdAt: true });
export const insertForecastSchema = createInsertSchema(forecasts).omit({ id: true, createdAt: true });
export const insertGridCapacitySchema = createInsertSchema(gridCapacity).omit({ id: true, createdAt: true });
export const insertChargingProfileSchema = createInsertSchema(chargingProfiles).omit({ id: true, createdAt: true });

// === TYPES ===

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type EvStat = typeof evStats.$inferSelect;
export type InsertEvStat = z.infer<typeof insertEvStatSchema>;

export type ChargingRecord = typeof chargingRecords.$inferSelect;
export type InsertChargingRecord = z.infer<typeof insertChargingRecordSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;

export type GridCapacity = typeof gridCapacity.$inferSelect;
export type InsertGridCapacity = z.infer<typeof insertGridCapacitySchema>;

export type ChargingProfile = typeof chargingProfiles.$inferSelect;
export type InsertChargingProfile = z.infer<typeof insertChargingProfileSchema>;

// API Types
export type ForecastRequest = {
  region: string;
  evType: string;
  startYear: number;
  endYear: number;
};

export type DashboardStats = {
  totalEvs: number;
  totalDemand: number;
  topRegion: string;
  growthRate: number;
};

export type GridImpactAnalysis = {
  region: string;
  totalEvLoad: number;
  peakHour: number;
  peakDemandKw: number;
  capacityUtilization: number;
  upgradeNeeded: boolean;
  estimatedCost: number;
};
