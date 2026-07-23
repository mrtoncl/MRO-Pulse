from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI()

model1 = joblib.load("models/model1_rf.joblib")
model2 = joblib.load("models/model2_gbm.joblib")
model1_columns = joblib.load("models/model1_columns.joblib")
model2_columns = joblib.load("models/model2_columns.joblib")

class StockRequest(BaseModel):
    category: str
    criticality: str
    stock_quantity: int
    avg_daily_usage: float
    usage_trend_pct: float

@app.post("/predict/stock")
def stock_prediction(request:StockRequest):

    row = pd.DataFrame([request.model_dump()])

    row = pd.get_dummies(row).reindex(columns=model1_columns, fill_value=0)
    
    predictions = np.array([tree.predict(row.values)[0] for tree in model1.estimators_])

    return {
        "median_day": float(np.percentile(predictions, 50)),
        "earliest_day": float(np.percentile(predictions, 5)),
        "latest_day": float(np.percentile(predictions, 95)),
    }


class LeadtimeRequest(BaseModel):
    category: str
    criticality: str
    supplier_country: str
    shipping_method: str
    supplier_reliability_score: float
    promised_delivery_days: float

@app.post("/predict/leadtime")
def leadtime_prediction(request:LeadtimeRequest):
    
    row = pd.DataFrame([request.model_dump()])

    row = pd.get_dummies(row).reindex(columns=model2_columns, fill_value=0)
        
    prediction = float(model2.predict(row.values)[0])
    
    return { 
        "lead_time": prediction,
        "promised_delivery_days": request.promised_delivery_days,
        "delay_warning" : prediction - request.promised_delivery_days >= 1 
        }
