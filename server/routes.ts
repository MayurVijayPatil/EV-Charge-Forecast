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
    // Basic CSV handling
    // Expected format: year,region,ev_type,count,charging_demand_kwh
    try {
      if (!req.body) {
         return res.status(400).json({ message: "No data provided" });
      }
      
      // Handle raw body or simple JSON with a 'csv' field if client sends that
      // For this MVP, let's assume client sends JSON { "csvData": "..." } or we handle text/csv
      // But standard api.stats.upload input isn't strictly typed to body content, so we adapt.
      
      let csvContent = "";
      if (req.headers['content-type']?.includes('text/csv')) {
        csvContent = req.body.toString();
      } else if (req.body.csvData) {
        csvContent = req.body.csvData;
      } else {
        return res.status(400).json({ message: "Invalid content type or missing csvData" });
      }

      const lines = csvContent.split('\n');
      const statsToInsert: InsertEvStat[] = [];
      let count = 0;

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        const [yearStr, region, evType, countStr, demandStr] = line.split(',');
        if (!yearStr || !region || !evType) continue;

        const year = parseInt(yearStr);
        const evCount = parseInt(countStr);
        const demand = parseFloat(demandStr);

        if (isNaN(year) || isNaN(evCount)) continue;

        // Ensure region exists
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
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to process CSV" });
    }
  });

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
