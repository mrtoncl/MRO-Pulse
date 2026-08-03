
# MRO-Pulse

An end-to-end inventory management dashboard for MRO (Maintenance, Repair & Overhaul) operations, combining AI-powered predictions to manage part stock levels and supply processes.

It uses two separate machine learning models: one predicts when a part will run out of stock, the other predicts how long it will take to arrive from the supplier. These two predictions are compared to recommend the right time to place an order.

> This project was built as part of an internship at Turkish Technology, for demonstration purposes, using synthetic data. It has no connection to real company data.

<img width="1470" height="779" alt="Screenshot 2026-08-03 at 09 32 31" src="https://github.com/user-attachments/assets/48bfc2c5-7911-4789-93da-99a4215d9d4f" />


## Features

- **Overview Dashboard:** Automatically surfaces parts that need urgent attention
- **ML Predictions:** Stock depletion and supplier lead-time predictions, with confidence ranges
- **Inventory:** Full parts table with an expandable detail panel
- **Order Placement & History:** Create orders based on predictions and track past orders
- **User Management:** Sign up, log in, and role-based access control (Admin / User)
- **Admin Panel:** Manage user roles and delete users
- **Light/Dark Theme** support




<img width="1470" height="780" alt="Screenshot 2026-08-03 at 09 32 53" src="https://github.com/user-attachments/assets/30f87c74-168b-429a-8c35-daacaafb375a" />

## Technical Architecture

```
React (Frontend)  →  .NET Minimal API (Backend)  →  PostgreSQL
                              ↓
                       FastAPI ML Service
                              ↓
                  Scikit-learn Models
```

The frontend calls the backend, which talks to both the PostgreSQL database and the FastAPI service to generate predictions.

## Tech Stack

**Data & Modeling:** Python, Pandas, Scikit-learn (Random Forest, Gradient Boosting), Joblib

**ML Service:** FastAPI, Pydantic, Uvicorn

**Backend:** C#, .NET Minimal API, Dapper, Npgsql, BCrypt

**Frontend:** React, Takeoff UI, Vite

**Database:** PostgreSQL

## Project Structure

```
MRO-Pulse/
├── Backend/        → .NET Minimal API (C#)
├── FastApi/         → ML prediction service (Python)
├── Frontend/         → React interface
└── Mock_Data/        → Synthetic datasets used for model training
```

  <img width="1470" height="783" alt="Screenshot 2026-08-03 at 09 33 46" src="https://github.com/user-attachments/assets/3bf4022c-d896-432b-9865-5bdec2d42c41" />

## Setup & Running

All three services need to be running:

**1. Database:** PostgreSQL must be installed; a schema with `roles`, `users`, and `orders` tables needs to be created.

**2. ML Service:**
```
cd FastApi
pip install fastapi uvicorn pandas numpy scikit-learn joblib
uvicorn main:app --reload --port 8000
```

**3. Backend:**
```
cd Backend
dotnet run
```

**4. Frontend:**
```
cd Frontend
npm install
npm run dev
```

## Developer

**Murat Emir Öncül** — Maintenance Support Solutions Intern, Turkish Technology
