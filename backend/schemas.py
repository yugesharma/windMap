from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WindPoint(BaseModel):
    lat:float
    lon:float
    wind_speed:float
    wind_direction:float
    timestamp:datetime

    class Config:
        from_attributes=True
    
class WindBboxRequest(BaseModel):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    date: Optional[str]=None