import { evStats, forecasts, regions, chargingRecords, type InsertEvStat, type InsertForecast, type InsertRegion, type InsertChargingRecord } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Stats
  getEvStats(region?: string, evType?: string): Promise<typeof evStats.$inferSelect[]>;
  createEvStats(stats: InsertEvStat[]): Promise<void>;

  // Charging Records
  createChargingRecords(records: InsertChargingRecord[]): Promise<void>;
  getChargingRecords(region?: string): Promise<typeof chargingRecords.$inferSelect[]>;

  // Forecasts
  getForecasts(region?: string, evType?: string): Promise<typeof forecasts.$inferSelect[]>;
  createForecasts(forecastsData: InsertForecast[]): Promise<typeof forecasts.$inferSelect[]>;

  // Regions
  getRegions(): Promise<string[]>;
  createRegion(region: InsertRegion): Promise<void>;

  // Clear all data
  clearAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getEvStats(region?: string, evType?: string) {
    let query = db.select().from(evStats);
    const conditions = [];
    if (region) conditions.push(eq(evStats.region, region));
    if (evType) conditions.push(eq(evStats.evType, evType));

    if (conditions.length > 0) {
      // @ts-ignore
      return await query.where(and(...conditions));
    }
    return await query;
  }

  async createEvStats(stats: InsertEvStat[]) {
    if (stats.length === 0) return;
    await db.insert(evStats).values(stats);
  }

  async getForecasts(region?: string, evType?: string) {
    let query = db.select().from(forecasts);
    const conditions = [];
    if (region) conditions.push(eq(forecasts.region, region));
    if (evType) conditions.push(eq(forecasts.evType, evType));

    if (conditions.length > 0) {
      // @ts-ignore
      return await query.where(and(...conditions));
    }
    return await query;
  }

  async createForecasts(forecastsData: InsertForecast[]) {
    if (forecastsData.length === 0) return [];
    return await db.insert(forecasts).values(forecastsData).returning();
  }

  async getChargingRecords(region?: string) {
    let query = db.select().from(chargingRecords);
    if (region) {
      return await query.where(eq(chargingRecords.region, region));
    }
    return await query;
  }

  async createChargingRecords(records: InsertChargingRecord[]) {
    if (records.length === 0) return;
    await db.insert(chargingRecords).values(records);
  }

  async getRegions() {
    const rows = await db.select().from(regions);
    return rows.map(r => r.name);
  }

  async createRegion(region: InsertRegion) {
    // Check if exists
    const existing = await db.select().from(regions).where(eq(regions.name, region.name));
    if (existing.length === 0) {
      await db.insert(regions).values(region);
    }
  }

  async clearAllData() {
    // Delete in order to respect foreign key constraints
    await db.delete(forecasts);
    await db.delete(evStats);
    await db.delete(chargingRecords);
    await db.delete(regions);
  }
}

export const storage = new DatabaseStorage();
