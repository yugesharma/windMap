from fastapi import FastAPI, Depends
import os
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from schemas import WindPoint
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MapWinds API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "database_url_configured": bool(os.getenv("DATABASE_URL"))
    }

@app.get("/wind/bbox", response_model=List[WindPoint])
def get_wind_by_bbox(
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    db: Session=Depends(get_db)
):

    query=text("""SELECT id, ST_Y(location::geometry) as lat,
                ST_X(location::geometry) as lon,
                wind_speed,
                wind_direction,
                timestamp from wind_forecasts WHERE ST_Intersects(location, ST_MakeEnvelope(:lon_min,:lat_min,:lon_max,:lat_max, 4326))""")
    
    result=db.execute(query, {
        'lat_min': lat_min,
        'lat_max':lat_max,
        'lon_min': lon_min ,
        'lon_max': lon_max ,
    })
    return [WindPoint(**row._mapping) for row in result]