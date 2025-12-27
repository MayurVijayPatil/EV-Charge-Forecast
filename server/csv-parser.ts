import type { InsertEvStat, InsertChargingRecord } from "@shared/schema";

interface ParsedCSVResult {
    type: 'ev_stats' | 'charging_patterns' | 'unknown';
    data: InsertEvStat[] | InsertChargingRecord[];
    preview: any[];
    warnings: string[];
    rowCount: number;
}

interface ColumnMapping {
    detected: string;
    mapped: string;
    confidence: number;
}

export class CSVParser {
    private static columnMappings = {
        year: ['year', 'yr', 'date', 'period', 'time'],
        region: ['region', 'state', 'location', 'area', 'territory', 'province', 'city'],
        evType: ['ev_type', 'evtype', 'type', 'vehicle_type', 'ev type', 'vehicle type', 'category'],
        count: ['count', 'vehicles', 'evs', 'ev_count', 'vehicle_count', 'number', 'total', 'quantity'],
        chargingDemandKwh: ['charging_demand_kwh', 'demand', 'kwh', 'energy', 'consumption', 'charging_demand', 'demand_kwh'],

        // Charging patterns
        vehicleModel: ['vehicle_model', 'model', 'vehicle', 'car_model', 'ev_model'],
        batteryCapacityKwh: ['battery_capacity_kwh', 'battery_capacity', 'battery', 'capacity', 'battery_kwh'],
        energyConsumedKwh: ['energy_consumed_kwh', 'energy_consumed', 'energy', 'kwh_consumed', 'consumption'],
        chargingDurationHours: ['charging_duration_hours', 'duration', 'charging_duration', 'hours', 'time'],
        chargingRateKw: ['charging_rate_kw', 'charging_rate', 'rate', 'kw', 'power'],
        chargerType: ['charger_type', 'charger', 'type', 'charging_type', 'station_type'],
        userType: ['user_type', 'user', 'customer_type', 'driver_type'],
        chargingStartTime: ['charging_start_time', 'start_time', 'timestamp', 'date', 'time', 'charging_start']
    };

    static parseCSV(csvContent: string): ParsedCSVResult {
        const lines = csvContent.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSV file is empty or has no data rows');
        }

        const headers = this.parseCSVLine(lines[0]);
        const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

        // Detect CSV type and map columns
        const mappings = this.detectColumnMappings(normalizedHeaders);
        const csvType = this.detectCSVType(mappings);

        const warnings: string[] = [];
        const preview: any[] = [];
        const data: any[] = [];

        // Parse data rows
        for (let i = 1; i < Math.min(lines.length, 1001); i++) { // Limit to 1000 rows for preview
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            const rowData: any = {};

            // Create object with mapped columns
            normalizedHeaders.forEach((header, index) => {
                rowData[header] = values[index]?.trim() || '';
            });

            if (i <= 10) {
                preview.push(rowData);
            }

            try {
                if (csvType === 'ev_stats') {
                    const parsed = this.parseEvStatRow(rowData, mappings, warnings);
                    if (parsed) data.push(parsed);
                } else if (csvType === 'charging_patterns') {
                    const parsed = this.parseChargingPatternRow(rowData, mappings, warnings);
                    if (parsed) data.push(parsed);
                }
            } catch (error) {
                warnings.push(`Row ${i}: ${error instanceof Error ? error.message : 'Parse error'}`);
            }
        }

        if (data.length === 0) {
            throw new Error('No valid data rows found. Please check your CSV format.');
        }

        return {
            type: csvType,
            data,
            preview,
            warnings: warnings.slice(0, 10), // Limit warnings
            rowCount: data.length
        };
    }

    private static parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result.map(val => val.replace(/^"|"$/g, '').trim());
    }

    private static detectColumnMappings(headers: string[]): Map<string, ColumnMapping> {
        const mappings = new Map<string, ColumnMapping>();

        for (const [targetField, possibleNames] of Object.entries(this.columnMappings)) {
            let bestMatch: ColumnMapping | null = null;
            let highestConfidence = 0;

            headers.forEach((header, index) => {
                const confidence = this.calculateMatchConfidence(header, possibleNames);
                if (confidence > highestConfidence && confidence > 0.5) {
                    highestConfidence = confidence;
                    bestMatch = {
                        detected: header,
                        mapped: targetField,
                        confidence
                    };
                }
            });

            if (bestMatch) {
                mappings.set(targetField, bestMatch);
            }
        }

        return mappings;
    }

    private static calculateMatchConfidence(header: string, possibleNames: string[]): number {
        const normalized = header.toLowerCase().replace(/[_\s-]/g, '');

        for (const name of possibleNames) {
            const normalizedName = name.toLowerCase().replace(/[_\s-]/g, '');

            if (normalized === normalizedName) return 1.0;
            if (normalized.includes(normalizedName)) return 0.9;
            if (normalizedName.includes(normalized)) return 0.8;

            // Levenshtein-like simple similarity
            const similarity = this.stringSimilarity(normalized, normalizedName);
            if (similarity > 0.7) return similarity;
        }

        return 0;
    }

    private static stringSimilarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private static levenshteinDistance(s1: string, s2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[s2.length][s1.length];
    }

    private static detectCSVType(mappings: Map<string, ColumnMapping>): 'ev_stats' | 'charging_patterns' | 'unknown' {
        const hasYear = mappings.has('year');
        const hasRegion = mappings.has('region');
        const hasEvType = mappings.has('evType');
        const hasCount = mappings.has('count');

        const hasVehicleModel = mappings.has('vehicleModel');
        const hasEnergyConsumed = mappings.has('energyConsumedKwh');
        const hasChargingStartTime = mappings.has('chargingStartTime');

        // EV Stats format
        if (hasYear && hasRegion && (hasEvType || hasCount)) {
            return 'ev_stats';
        }

        // Charging patterns format
        if (hasRegion && hasEnergyConsumed && (hasVehicleModel || hasChargingStartTime)) {
            return 'charging_patterns';
        }

        return 'unknown';
    }

    private static parseEvStatRow(row: any, mappings: Map<string, ColumnMapping>, warnings: string[]): InsertEvStat | null {
        const getValue = (field: string) => {
            const mapping = mappings.get(field);
            return mapping ? row[mapping.detected] : null;
        };

        const yearStr = getValue('year');
        const region = getValue('region');
        const evType = getValue('evType') || 'Mixed';
        const countStr = getValue('count');
        const demandStr = getValue('chargingDemandKwh');

        if (!yearStr || !region) {
            return null;
        }

        const year = parseInt(yearStr);
        const count = parseInt(countStr) || 0;
        const demand = parseFloat(demandStr) || count * 3000; // Estimate if missing

        if (isNaN(year) || year < 1900 || year > 2100) {
            warnings.push(`Invalid year: ${yearStr}`);
            return null;
        }

        return {
            region: region.trim(),
            year,
            evType: evType.trim(),
            count,
            chargingDemandKwh: demand
        };
    }

    private static parseChargingPatternRow(row: any, mappings: Map<string, ColumnMapping>, warnings: string[]): InsertChargingRecord | null {
        const getValue = (field: string) => {
            const mapping = mappings.get(field);
            return mapping ? row[mapping.detected] : null;
        };

        const region = getValue('region');
        const vehicleModel = getValue('vehicleModel') || 'Unknown';
        const energyConsumedStr = getValue('energyConsumedKwh');
        const startTimeStr = getValue('chargingStartTime');

        if (!region || !energyConsumedStr) {
            return null;
        }

        const energyConsumed = parseFloat(energyConsumedStr);
        if (isNaN(energyConsumed)) {
            return null;
        }

        let startTime = new Date();
        if (startTimeStr) {
            startTime = new Date(startTimeStr);
            if (isNaN(startTime.getTime())) {
                startTime = new Date();
            }
        }

        return {
            region: region.trim(),
            vehicleModel: vehicleModel.trim(),
            batteryCapacityKwh: parseFloat(getValue('batteryCapacityKwh')) || null,
            energyConsumedKwh: energyConsumed,
            chargingDurationHours: parseFloat(getValue('chargingDurationHours')) || null,
            chargingRateKw: parseFloat(getValue('chargingRateKw')) || null,
            chargerType: getValue('chargerType') || null,
            userType: getValue('userType') || null,
            chargingStartTime: startTime
        };
    }
}
