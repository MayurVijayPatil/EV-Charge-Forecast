import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import { insertEvStatSchema, type InsertEvStat, type InsertForecast } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === DATASETS & UPLOAD ===
  
  app.get(api.stats.list.path, async (req, res) => {
    const region = req.query.region as string | undefined;
    const evType = req.query.evType as string | undefined;
    const stats = await storage.getEvStats(region, evType);
    res.json(stats);
  });

  app.post(api.stats.upload.path, async (req, res) => {
    try {
      if (!req.body) {
         return res.status(400).json({ message: "No data provided" });
      }
      
      let csvContent = "";
      if (req.headers['content-type']?.includes('text/csv')) {
        csvContent = req.body.toString();
      } else if (req.body.csvData) {
        csvContent = req.body.csvData;
      } else {
        return res.status(400).json({ message: "Invalid content type or missing csvData" });
      }

      const lines = csvContent.split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV is empty" });
      }

      const header = lines[0].toLowerCase();
      
      // Detect CSV format based on header
      const isChargingPatterns = header.includes('charging station location') && header.includes('energy consumed');
      const isEvStats = header.includes('year') && header.includes('region') && header.includes('ev_type');

      if (isChargingPatterns) {
        // Parse charging patterns format
        return handleChargingPatternsCSV(lines, res);
      } else if (isEvStats) {
        // Parse EV stats format
        return handleEvStatsCSV(lines, res);
      } else {
        return res.status(400).json({ message: "Unrecognized CSV format. Expected either EV stats (year, region, ev_type, count, charging_demand_kwh) or charging patterns data." });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to process CSV" });
    }
  });

  async function handleEvStatsCSV(lines: string[], res: any) {
    const statsToInsert: InsertEvStat[] = [];
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [yearStr, region, evType, countStr, demandStr] = line.split(',');
      if (!yearStr || !region || !evType) continue;

      const year = parseInt(yearStr);
      const evCount = parseInt(countStr);
      const demand = parseFloat(demandStr);

      if (isNaN(year) || isNaN(evCount)) continue;

      await storage.createRegion({ name: region });

      statsToInsert.push({
        region,
        year,
        evType,
        count: evCount,
        chargingDemandKwh: isNaN(demand) ? 0 : demand,
      });
      count++;
    }

    await storage.createEvStats(statsToInsert);
    res.status(201).json({ message: "Upload successful", count });
  }

  async function handleChargingPatternsCSV(lines: string[], res: any) {
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const recordsToInsert: InsertChargingRecord[] = [];
    let count = 0;

    // Map header indices
    const idxLocation = header.findIndex(h => h.includes('location'));
    const idxVehicle = header.findIndex(h => h.includes('vehicle model'));
    const idxBattery = header.findIndex(h => h.includes('battery capacity'));
    const idxEnergyConsumed = header.findIndex(h => h.includes('energy consumed'));
    const idxDuration = header.findIndex(h => h.includes('charging duration'));
    const idxRate = header.findIndex(h => h.includes('charging rate'));
    const idxChargerType = header.findIndex(h => h.includes('charger type'));
    const idxUserType = header.findIndex(h => h.includes('user type'));
    const idxStartTime = header.findIndex(h => h.includes('charging start'));

    // City to State mapping
    const cityToState: Record<string, string> = {
      'houston': 'Texas',
      'san francisco': 'California',
      'los angeles': 'California',
      'chicago': 'Illinois',
      'new york': 'New York'
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      
      const location = parts[idxLocation]?.toLowerCase() || '';
      const state = Object.entries(cityToState).find(([city]) => location.includes(city))?.[1] || location;

      const vehicleModel = parts[idxVehicle] || '';
      const batteryCapacity = parseFloat(parts[idxBattery]) || null;
      const energyConsumed = parseFloat(parts[idxEnergyConsumed]);
      const duration = parseFloat(parts[idxDuration]) || null;
      const rate = parseFloat(parts[idxRate]) || null;
      const chargerType = parts[idxChargerType] || null;
      const userType = parts[idxUserType] || null;
      const startTimeStr = parts[idxStartTime];

      if (isNaN(energyConsumed) || !startTimeStr) continue;

      const startTime = new Date(startTimeStr);
      if (isNaN(startTime.getTime())) continue;

      recordsToInsert.push({
        region: state || 'Unknown',
        vehicleModel,
        batteryCapacityKwh: isNaN(batteryCapacity as any) ? null : batteryCapacity,
        energyConsumedKwh: energyConsumed,
        chargingDurationHours: isNaN(duration as any) ? null : duration,
        chargingRateKw: isNaN(rate as any) ? null : rate,
        chargerType,
        userType,
        chargingStartTime: startTime,
      });
      count++;
    }

    await storage.createChargingRecords(recordsToInsert);
    
    // Also aggregate into ev_stats by region and year
    const aggregated: Record<string, { region: string; year: number; count: number; totalDemand: number }> = {};
    
    for (const record of recordsToInsert) {
      const year = record.chargingStartTime.getFullYear();
      const key = `${record.region}-${year}`;
      
      if (!aggregated[key]) {
        aggregated[key] = { region: record.region, year, count: 1, totalDemand: record.energyConsumedKwh };
      } else {
        aggregated[key].count += 1;
        aggregated[key].totalDemand += record.energyConsumedKwh;
      }
      
      await storage.createRegion({ name: record.region });
    }

    const statsToInsert: InsertEvStat[] = Object.values(aggregated).map(agg => ({
      region: agg.region,
      year: agg.year,
      evType: 'Mixed',
      count: agg.count,
      chargingDemandKwh: agg.totalDemand
    }));

    if (statsToInsert.length > 0) {
      await storage.createEvStats(statsToInsert);
    }

    res.status(201).json({ message: "Charging patterns uploaded successfully", count, statsCreated: statsToInsert.length });
  }

  // === FORECASTING ===

  app.post(api.forecasts.generate.path, async (req, res) => {
    try {
      const input = api.forecasts.generate.input.parse(req.body);
      const { region, evType, startYear, endYear } = input;

      // 1. Get historical data
      const historical = await storage.getEvStats(region, evType);
      if (historical.length < 2) {
        return res.status(400).json({ message: "Not enough historical data to forecast" });
      }

      // 2. Prepare future years
      const futureYears: number[] = [];
      for (let y = startYear; y <= endYear; y++) {
        futureYears.push(y);
      }

      // 3. Call Python Script
      const pythonProcess = spawn("python3", ["server/forecast.py"]);
      
      const payload = {
        historical: historical.map(h => ({
          year: h.year,
          count: h.count,
          chargingDemandKwh: h.chargingDemandKwh
        })),
        futureYears
      };

      let outputData = "";
      let errorData = "";

      pythonProcess.stdin.write(JSON.stringify(payload));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        if (code !== 0) {
          console.error("Python script error:", errorData);
          return res.status(500).json({ message: "Forecasting engine failed" });
        }

        try {
          const result = JSON.parse(outputData);
          if (result.error) {
            return res.status(400).json({ message: result.error });
          }

          const forecastsToInsert: InsertForecast[] = result.results.map((r: any) => ({
            region,
            evType,
            year: r.year,
            predictedCount: r.predictedCount,
            predictedDemandKwh: r.predictedDemandKwh,
            modelUsed: r.modelUsed
          }));

          const saved = await storage.createForecasts(forecastsToInsert);
          res.status(201).json(saved);

        } catch (parseError) {
          console.error("JSON Parse Error:", parseError, outputData);
          res.status(500).json({ message: "Invalid response from forecasting engine" });
        }
      });

    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.forecasts.list.path, async (req, res) => {
    const region = req.query.region as string | undefined;
    const evType = req.query.evType as string | undefined;
    const forecasts = await storage.getForecasts(region, evType);
    res.json(forecasts);
  });

  // === REGIONS & DASHBOARD ===

  app.get(api.regions.list.path, async (req, res) => {
    const regions = await storage.getRegions();
    res.json(regions);
  });

  app.get(api.dashboard.stats.path, async (req, res) => {
    const allStats = await storage.getEvStats();
    
    // Simple aggregation
    const totalEvs = allStats.reduce((sum, s) => sum + s.count, 0);
    const totalDemand = allStats.reduce((sum, s) => sum + s.chargingDemandKwh, 0);
    
    // Find top region
    const regionCounts: Record<string, number> = {};
    allStats.forEach(s => {
      regionCounts[s.region] = (regionCounts[s.region] || 0) + s.count;
    });
    
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
    
    // Calculate simple growth rate (last year vs prev year)
    // For MVP just dummy 0 or actual calc if we sort data
    const growthRate = 12.5; // Placeholder or calculate dynamically

    res.json({
      totalEvs,
      totalDemand,
      topRegion,
      growthRate
    });
  });

  // === SEED DATA ===
  await seedData();

  return httpServer;
}

async function seedData() {
  const regions = await storage.getRegions();
  if (regions.length > 0) return;

  console.log("Seeding data...");
  
  const seedStats: InsertEvStat[] = [];
  const startYear = 2018;
  const endYear = 2023;
  
  const regionsList = ["California", "Texas", "New York", "Florida"];
  const evTypes = ["BEV", "PHEV"];

  for (const reg of regionsList) {
    await storage.createRegion({ name: reg });
    
    // Create trend
    let baseCount = Math.floor(Math.random() * 50000) + 10000;
    
    for (const type of evTypes) {
      let currentCount = baseCount;
      for (let y = startYear; y <= endYear; y++) {
        // 20-30% growth
        currentCount = Math.floor(currentCount * (1.2 + Math.random() * 0.1));
        
        seedStats.push({
          region: reg,
          year: y,
          evType: type,
          count: currentCount,
          chargingDemandKwh: currentCount * (3000 + Math.random() * 500) // ~3000 kWh per EV per year
        });
      }
      baseCount = Math.floor(baseCount * 0.6); // PHEV less than BEV usually
    }
  }

  await storage.createEvStats(seedStats);
  console.log("Seeding complete.");
}
