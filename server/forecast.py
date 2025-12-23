import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

def forecast():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        historical = input_data.get('historical', [])
        future_years = input_data.get('futureYears', [])
        
        if not historical or len(historical) < 2:
            print(json.dumps({"error": "Insufficient historical data (need at least 2 points)"}))
            return

        df = pd.DataFrame(historical)
        
        # Train Linear Regression for EV Count
        X = df[['year']].values
        y_count = df['count'].values
        y_demand = df['chargingDemandKwh'].values

        # Use linear regression for simplicity and robustness on small data
        model_count = LinearRegression()
        model_count.fit(X, y_count)
        
        model_demand = LinearRegression()
        model_demand.fit(X, y_demand)
        
        results = []
        X_future = np.array(future_years).reshape(-1, 1)
        
        pred_counts = model_count.predict(X_future)
        pred_demands = model_demand.predict(X_future)
        
        for i, year in enumerate(future_years):
            results.append({
                "year": int(year),
                "predictedCount": max(0, int(pred_counts[i])), # No negative EVs
                "predictedDemandKwh": max(0, float(pred_demands[i])),
                "modelUsed": "Linear Regression (Python)"
            })
            
        print(json.dumps({"results": results}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    forecast()
