from fastapi import FastAPI, Depends
import os
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from schemas import WindPoint
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from models import WindForecast, DailyWindDate


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
    grid_size: float = 1.0,
    db: Session=Depends(get_db)
):

    query=text("""SELECT  DISTINCT ON (ST_SnapToGrid(location::geometry, :grid, :grid),day)
               id, ST_Y(ST_SnapToGrid(location::geometry, :grid, :grid)) as lat,
                ST_X(ST_SnapToGrid(location::geometry, :grid, :grid)) as lon,
                wind_speed,
                wind_direction,
                day AS timestamp
                from daily_wind_data WHERE ST_Intersects(location, ST_MakeEnvelope(:lon_min,:lat_min,:lon_max,:lat_max, 4326))
               ORDER BY ST_SnapToGrid(location::geometry, :grid, :grid), day DESC
               """)
    
    result=db.execute(query, {
        'lat_min': lat_min,
        'lat_max':lat_max,
        'lon_min': lon_min ,
        'lon_max': lon_max ,
        'grid':grid_size
    })
    return [WindPoint(**row._mapping) for row in result]

@app.get("/wind/date_range")
async def get_data_range( db: Session=Depends(get_db)):
    result=db.query(func.min(DailyWindDate.day).label("min_ts"),
                    func.max(DailyWindDate.day).label("max_ts")).first()
    if not result or result.min_ts is None:
        return {"min": 0, "max": 0}

    return {
        "min": int(result.min_ts.timestamp()), 
        "max": int(result.max_ts.timestamp()),
        "count": db.query(DailyWindDate).count()
    }
    