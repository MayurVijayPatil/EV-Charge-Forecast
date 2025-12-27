"""
Grid Impact Analysis Engine
Calculates peak load, capacity constraints, and upgrade requirements for utilities
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime

def calculate_grid_impact(ev_stats_data, region=None):
    """
    Calculate grid impact analysis for EV charging load
    
    Args:
        ev_stats_data: List of dicts with EV statistics
        region: Optional region filter
    
    Returns:
        Dict with grid impact analysis results
    """
    
    # Convert to DataFrame
    df = pd.DataFrame(ev_stats_data)
    
    if region:
        df = df[df['region'] == region]
    
    if len(df) == 0:
        return {
            "error": "No data available for analysis",
            "region": region or "All"
        }
    
    # Calculate total EV load
    total_evs = df['count'].sum()
    total_demand_kwh = df['chargingDemandKwh'].sum()
    
    # Estimate peak load (assuming 20% of EVs charge simultaneously during peak hours)
    # Average charging rate: 7.2 kW for Level 2 chargers
    peak_concurrent_charging = total_evs * 0.20
    avg_charging_rate_kw = 7.2
    peak_demand_kw = peak_concurrent_charging * avg_charging_rate_kw
    peak_demand_mw = peak_demand_kw / 1000
    
    # Estimate grid capacity needed (with 30% safety margin)
    required_capacity_mw = peak_demand_mw * 1.3
    
    # Typical substation capacity: 50-100 MW
    # Calculate number of substations needed
    avg_substation_capacity_mw = 75
    substations_needed = np.ceil(required_capacity_mw / avg_substation_capacity_mw)
    
    # Cost estimates
    # Transformer upgrade: $500k - $2M per unit
    # Substation upgrade: $5M - $20M
    transformer_cost_per_unit = 1_000_000  # $1M average
    substation_cost = 10_000_000  # $10M average
    
    estimated_transformer_cost = substations_needed * transformer_cost_per_unit
    estimated_total_cost = substations_needed * substation_cost
    
    # Peak hour analysis (typical EV charging peaks: 6-9 PM)
    peak_hours = [18, 19, 20, 21]  # 6 PM to 9 PM
    
    # Generate hourly demand profile
    hourly_profile = []
    for hour in range(24):
        if hour in peak_hours:
            # Peak hours: 60-80% of peak demand
            demand_factor = 0.6 + (np.random.random() * 0.2)
        elif 22 <= hour or hour < 6:
            # Night hours: 20-40% (overnight charging)
            demand_factor = 0.2 + (np.random.random() * 0.2)
        else:
            # Day hours: 10-30%
            demand_factor = 0.1 + (np.random.random() * 0.2)
        
        hourly_demand_kw = peak_demand_kw * demand_factor
        hourly_profile.append({
            "hour": hour,
            "demandKw": round(hourly_demand_kw, 2),
            "demandMw": round(hourly_demand_kw / 1000, 2)
        })
    
    # Find peak hour
    peak_hour_data = max(hourly_profile, key=lambda x: x['demandKw'])
    
    # Capacity utilization (assuming existing grid capacity)
    # Typical grid has 20-30% reserve capacity
    assumed_current_capacity_mw = required_capacity_mw * 0.7  # Current capacity is 70% of needed
    capacity_utilization = (peak_demand_mw / assumed_current_capacity_mw) * 100 if assumed_current_capacity_mw > 0 else 0
    
    # Determine if upgrade needed
    upgrade_needed = capacity_utilization > 80  # Upgrade if >80% utilization
    
    # Regional breakdown
    regional_analysis = []
    for reg in df['region'].unique():
        reg_df = df[df['region'] == reg]
        reg_evs = reg_df['count'].sum()
        reg_demand_kwh = reg_df['chargingDemandKwh'].sum()
        reg_peak_kw = (reg_evs * 0.20 * avg_charging_rate_kw)
        
        regional_analysis.append({
            "region": reg,
            "totalEvs": int(reg_evs),
            "peakDemandKw": round(reg_peak_kw, 2),
            "peakDemandMw": round(reg_peak_kw / 1000, 2),
            "annualDemandKwh": round(reg_demand_kwh, 2)
        })
    
    return {
        "summary": {
            "region": region or "All Regions",
            "totalEvs": int(total_evs),
            "totalAnnualDemandKwh": round(total_demand_kwh, 2),
            "peakDemandKw": round(peak_demand_kw, 2),
            "peakDemandMw": round(peak_demand_mw, 2),
            "requiredCapacityMw": round(required_capacity_mw, 2),
            "capacityUtilization": round(capacity_utilization, 2),
            "upgradeNeeded": upgrade_needed,
            "substationsNeeded": int(substations_needed)
        },
        "costs": {
            "transformerUpgradeCost": round(estimated_transformer_cost, 2),
            "totalInfrastructureCost": round(estimated_total_cost, 2),
            "costPerEv": round(estimated_total_cost / total_evs, 2) if total_evs > 0 else 0
        },
        "peakHour": {
            "hour": peak_hour_data['hour'],
            "demandKw": peak_hour_data['demandKw'],
            "demandMw": peak_hour_data['demandMw'],
            "timeRange": f"{peak_hour_data['hour']}:00 - {peak_hour_data['hour']+1}:00"
        },
        "hourlyProfile": hourly_profile,
        "regionalBreakdown": regional_analysis,
        "recommendations": generate_recommendations(capacity_utilization, upgrade_needed, substations_needed)
    }

def generate_recommendations(capacity_utilization, upgrade_needed, substations_needed):
    """Generate actionable recommendations based on analysis"""
    recommendations = []
    
    if upgrade_needed:
        recommendations.append({
            "priority": "HIGH",
            "category": "Infrastructure",
            "recommendation": f"Grid capacity upgrade required. Current utilization at {capacity_utilization:.1f}%.",
            "action": f"Plan for {int(substations_needed)} substation upgrades or new installations."
        })
    
    if capacity_utilization > 70:
        recommendations.append({
            "priority": "MEDIUM",
            "category": "Load Management",
            "recommendation": "Implement smart charging programs to shift load away from peak hours.",
            "action": "Deploy time-of-use pricing and managed charging incentives."
        })
    
    recommendations.append({
        "priority": "MEDIUM",
        "category": "Monitoring",
        "recommendation": "Install real-time grid monitoring for EV charging patterns.",
        "action": "Deploy smart meters and load monitoring systems at key substations."
    })
    
    if capacity_utilization < 50:
        recommendations.append({
            "priority": "LOW",
            "category": "Optimization",
            "recommendation": "Current grid capacity is sufficient. Focus on optimization.",
            "action": "Monitor growth trends and plan for future capacity needs."
        })
    
    return recommendations

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    ev_stats = input_data.get('evStats', [])
    region = input_data.get('region')
    
    result = calculate_grid_impact(ev_stats, region)
    
    print(json.dumps(result, indent=2))
