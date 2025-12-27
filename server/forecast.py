import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import warnings
warnings.filterwarnings('ignore')

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
        
        # Prepare data
        X = df[['year']].values
        y_count = df['count'].values
        y_demand = df['chargingDemandKwh'].values

        # Try multiple models and select the best one
        models_to_try = [
            ('Linear Regression', LinearRegression(), None),
            ('Polynomial Regression (degree 2)', LinearRegression(), PolynomialFeatures(degree=2)),
            ('Polynomial Regression (degree 3)', LinearRegression(), PolynomialFeatures(degree=3))
        ]
        
        best_model_count = None
        best_model_demand = None
        best_score_count = -float('inf')
        best_score_demand = -float('inf')
        best_model_name_count = ""
        best_model_name_demand = ""
        best_poly_count = None
        best_poly_demand = None
        
        # Evaluate models
        for model_name, model, poly in models_to_try:
            try:
                # For count prediction
                if poly:
                    X_poly = poly.fit_transform(X)
                    model_count = LinearRegression()
                    model_count.fit(X_poly, y_count)
                    y_pred_count = model_count.predict(X_poly)
                else:
                    model_count = LinearRegression()
                    model_count.fit(X, y_count)
                    y_pred_count = model_count.predict(X)
                
                score_count = r2_score(y_count, y_pred_count)
                
                if score_count > best_score_count:
                    best_score_count = score_count
                    best_model_count = model_count
                    best_model_name_count = model_name
                    best_poly_count = poly
                
                # For demand prediction
                if poly:
                    X_poly = poly.fit_transform(X)
                    model_demand = LinearRegression()
                    model_demand.fit(X_poly, y_demand)
                    y_pred_demand = model_demand.predict(X_poly)
                else:
                    model_demand = LinearRegression()
                    model_demand.fit(X, y_demand)
                    y_pred_demand = model_demand.predict(X)
                
                score_demand = r2_score(y_demand, y_pred_demand)
                
                if score_demand > best_score_demand:
                    best_score_demand = score_demand
                    best_model_demand = model_demand
                    best_model_name_demand = model_name
                    best_poly_demand = poly
                    
            except Exception as e:
                continue
        
        # Make predictions with best models
        X_future = np.array(future_years).reshape(-1, 1)
        
        if best_poly_count:
            X_future_poly_count = best_poly_count.transform(X_future)
            pred_counts = best_model_count.predict(X_future_poly_count)
        else:
            pred_counts = best_model_count.predict(X_future)
        
        if best_poly_demand:
            X_future_poly_demand = best_poly_demand.transform(X_future)
            pred_demands = best_model_demand.predict(X_future_poly_demand)
        else:
            pred_demands = best_model_demand.predict(X_future)
        
        # Calculate confidence intervals (95%)
        # Simple approach: use standard deviation of residuals
        if best_poly_count:
            X_poly = best_poly_count.transform(X)
            residuals_count = y_count - best_model_count.predict(X_poly)
        else:
            residuals_count = y_count - best_model_count.predict(X)
        
        std_count = np.std(residuals_count)
        confidence_interval_count = 1.96 * std_count  # 95% confidence
        
        if best_poly_demand:
            X_poly = best_poly_demand.transform(X)
            residuals_demand = y_demand - best_model_demand.predict(X_poly)
        else:
            residuals_demand = y_demand - best_model_demand.predict(X)
        
        std_demand = np.std(residuals_demand)
        confidence_interval_demand = 1.96 * std_demand
        
        # Calculate metrics
        mae_count = mean_absolute_error(y_count, best_model_count.predict(best_poly_count.transform(X) if best_poly_count else X))
        rmse_count = np.sqrt(mean_squared_error(y_count, best_model_count.predict(best_poly_count.transform(X) if best_poly_count else X)))
        
        # Calculate MAE as percentage of mean actual value for better interpretability
        mean_actual = np.mean(y_count)
        mae_percentage = (mae_count / mean_actual) * 100 if mean_actual > 0 else 0
        
        results = []
        for i, year in enumerate(future_years):
            results.append({
                "year": int(year),
                "predictedCount": max(0, int(pred_counts[i])),
                "predictedDemandKwh": max(0, float(pred_demands[i])),
                "modelUsed": f"{best_model_name_count}",
                "confidenceIntervalLower": max(0, int(pred_counts[i] - confidence_interval_count)),
                "confidenceIntervalUpper": int(pred_counts[i] + confidence_interval_count),
                "r2Score": float(best_score_count),
                "mae": float(mae_percentage),  # Now returns percentage, not absolute count
                "rmse": float(rmse_count)
            })
        
        print(json.dumps({
            "results": results,
            "modelInfo": {
                "countModel": best_model_name_count,
                "demandModel": best_model_name_demand,
                "r2Count": float(best_score_count),
                "r2Demand": float(best_score_demand),
                "confidenceLevel": 0.95
            }
        }))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    forecast()
