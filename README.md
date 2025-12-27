# ⚡ EV Adoption & Infrastructure Forecasting System

![Status](https://img.shields.io/badge/Status-Production%20Ready-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Stack](https://img.shields.io/badge/Tech-Full%20Stack-blueviolet)

> A comprehensive, AI-driven platform for predicting Electric Vehicle (EV) adoption trends and optimizing charging infrastructure investment in India.

## 🟢 Live Demo

**Access the deployed application here:**  
👉 **[https://ev-charge-forecast.onrender.com](https://ev-charge-forecast.onrender.com)**

> **Note for Evaluators:** This project is hosted on a free-tier instance (512MB RAM). The ML forecasting feature may occasionally timeout during heavy computation due to memory constraints. For consistent performance and full evaluation of all features, we recommend running the project locally using the **Installation & Setup** instructions below. The codebase and ML models are production-ready and fully functional in a local or upgraded hosting environment.

## 📖 Project Abstract
As the global shift towards electric mobility accelerates, the need for data-driven infrastructure planning becomes critical. This project presents a **Full-Stack Forecasting System** that leverages **Machine Learning (Regression Analysis)** to predict future EV growth, calculate grid load impact, and estimate the financial viability of charging stations. By integrating historical data analysis with predictive modeling, this tool empowers policymakers and investors to make informed decisions for a sustainable future.

---

## 🚀 Key Features

### 🧠 Intelligent Prediction Engine
- **Multi-Model Regression**: Dynamically trains and evaluates **Linear**, **Polynomial (Degree 2)**, and **Polynomial (Degree 3)** models.
- **Smart Selection**: Automatically deploys the model with the highest **R² Score** (Coefficient of Determination) for maximum accuracy.
- **Future Projections**: Generates 5-10 year forecasts for EV population growth and aggregate energy demand (GWh).

### 🔋 Infrastructure & Grid Analytics
- **Grid Load Simulation**: Estimates peak power demand (MW) and identifies potential transformer stress points.
- **Station Planning**: Recommends the optimal number of Public Charging Stations (PCS) required per region.
- **Green Impact Metrics**: Calculates reduction in CO₂ emissions and "Tree Equivalents" saved by EV adoption.

### 💼 Business Intelligence Dashboard
- **ROI Calculator**: Interactive tool for investors to estimate Break-Even Point, CAPEX, and OPEX for new charging stations.
- **Geospatial Insights**: Regional breakdown of EV density suitable for urban planning.
- **Real-Time Data**: Live "Green Ticker" showing environmental impact metrics.

---

## 🛠️ Technology Architecture

This project is built using industry-standard, scalable technologies:

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18 (TypeScript) | High-performance, type-safe UI with component-based architecture. |
| **Styling** | TailwindCSS & Framer Motion | Modern, responsive design with smooth micro-interactions. |
| **Visualization** | Recharts | Professional-grade data visualization for trends and analytics. |
| **Backend API** | Node.js & Express | Robust REST API for data processing and model orchestration. |
| **AI/ML Core** | Python 3.11 (Scikit-Learn) | Dedicated microservice for training models and generating inferences. |
| **Database** | PostgreSQL + Drizzle ORM | Relational database for persistent storage of user and forecast data. |

---

## 📊 Methodology (ML Pipeline)

1.  **Data Ingestion**: Application parses historical EV registration data (CSV format) for Indian states.
2.  **Preprocessing**: Data is cleaned, normalized, and split into training/testing sets.
3.  **Training**: The Python engine trains multiple regression algorithms simultaneously.
4.  **Validation**: Models are scored based on **RMSE** (Root Mean Square Error) and **R²**. The best model is serialized.
5.  **Inference**: The Node.js server calls the Python engine to generate real-time predictions for user queries.

---

## ⚙️ Installation & Setup

Follow these steps to deploy the project locally:

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+) with `pip`
- **PostgreSQL** Server

### 1. Clone the Repository
```bash
git clone https://github.com/MayurVijayPatil/EV-Charge-Forecast.git
cd EV-Charge-Forecast
```

### 2. Install Dependencies
**Frontend & Backend:**
```bash
npm install
```

**Machine Learning Engine:**
```bash
pip install pandas numpy scikit-learn
```

### 3. Database Setup
**Install PostgreSQL** (if not already installed):
- Windows: Download from [postgresql.org](https://www.postgresql.org/download/)
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

**Create Database:**
```sql
CREATE DATABASE ev_forecast;
```

**Configure Environment:**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ev_forecast"
```
> Replace `postgres:postgres` with your PostgreSQL username and password if different.

### 4. Initialize Database Schema
Push the schema to create tables:
```bash
npm run db:push
```

### 5. Launch Application
Start the development server:
```bash
npm run dev
```
> The application will be available at `http://localhost:5000`.

---

## 📖 Usage Guide

### Uploading Custom Data
To analyze your own EV dataset:
1. Navigate to the **Data Upload** page.
2. Click the **Delete** button to clear the pre-loaded data.
3. Upload your new CSV file to generate fresh forecasts based on your custom data.

## 📂 Project Structure

```bash
EV-Charge-Forecast/
├── client/                 # React Frontend Application
│   ├── src/components/     # Reusable UI Components (Charts, Modals)
│   └── src/pages/          # Main Route Views (Dashboard, Reports)
├── server/                 # Backend Logic
│   ├── routes.ts           # API Endpoints & Controllers
│   └── forecast.py         # 🐍 Python ML Forecasting Logic
├── shared/                 # Shared Types (Zod Schemas)
└── attached_assets/        # 📊 Indian EV Dataset (CSV)
```

---

## 📜 License
This project is open-source and licensed under the **MIT License**.
