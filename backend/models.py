from sqlalchemy import Column, Integer, Float, DateTime, UniqueConstraint, func
from database import Base 
from geoalchemy2 import Geography
import datetime


class WindForecast(Base):
    __tablename__ = "wind_forecasts" 
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    wind_speed = Column(Float)
    wind_direction = Column(Float)
    location = Column(Geography('POINT', srid=4326), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.timezone('UTC', func.now()), nullable=False)

    __table_args__ = (
        UniqueConstraint('timestamp', 'location', name='unique_wind_data'),
    )

class DailyWindDate(Base):
    __tablename__ = "daily_wind_data" 
    id = Column(Integer, primary_key=True, index=True)
    day= Column(DateTime)
    source_timestamp = Column(DateTime)
    wind_speed = Column(Float)
    wind_direction = Column(Float)
    location = Column(Geography('POINT', srid=4326), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.timezone('UTC', func.now()), nullable=False)

    __table_args__ = (
        UniqueConstraint('day', 'location', name='unique_daily_wind_data'),
    )
