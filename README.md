# EV Charge Forecast

A web application for forecasting electric vehicle adoption and charging demand in India.

## What It Does

- Upload CSV data with EV statistics (year, region, count, charging demand)
- Train machine learning models (Linear and Polynomial Regression)
- Generate forecasts for future years
- View regional analysis and infrastructure requirements
- Calculate grid impact and sustainability metrics

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Recharts
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Drizzle ORM)
- **ML:** Python with scikit-learn

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL

### Installation

1. Install dependencies:
```bash
npm install
pip install pandas numpy scikit-learn
```

2. Configure database:
```powershell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/ev_forecast"
```

3. Initialize database:
```bash
npm run db:push
```

4. Run the app:
```bash
npm run dev
```

Open http://localhost:5000

## Features

### Data Upload
- Supports CSV files with EV statistics
- Automatic column detection
- Sample data included in `attached_assets/`

### Forecasting
- Three regression models (Linear, Polynomial degree 2 & 3)
- Automatic model selection based on R² score
- Confidence intervals for predictions

### Reports
- Regional analysis
- Model accuracy metrics
- Infrastructure cost estimates
- Environmental impact calculations

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend + Python ML
├── shared/          # TypeScript types
└── attached_assets/ # Sample datasets
```

## ML Models

The system trains three models and selects the best one:
- Linear Regression (baseline)
- Polynomial Regression degree 2 (quadratic growth)
- Polynomial Regression degree 3 (cubic growth)

Models are evaluated using R², MAE, and RMSE.

## License

MIT
