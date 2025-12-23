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

// === SCHEMAS ===

export const insertRegionSchema = createInsertSchema(regions).omit({ id: true });
export const insertEvStatSchema = createInsertSchema(evStats).omit({ id: true });
export const insertForecastSchema = createInsertSchema(forecasts).omit({ id: true, createdAt: true });

// === TYPES ===

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type EvStat = typeof evStats.$inferSelect;
export type InsertEvStat = z.infer<typeof insertEvStatSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;

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
