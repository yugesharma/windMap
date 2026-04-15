import io
import requests
import datetime
import pytz
import xarray as xr
import numpy as np
from database import SessionLocal, engine, Base
from models import WindForecast
from geoalchemy2.elements import WKTElement
from sqlalchemy import text

def fetchWindData():
    try:
        myTimeZone = pytz.timezone('America/New_York')
        today = datetime.datetime.now(myTimeZone).date()
        endDate = today + datetime.timedelta(days=6)

        time_start = f"{today}T00:00:00Z"
        time_end = f"{endDate}T00:00:00Z"
        coordinate_strides=1
        base_url = "https://pae-paha.pacioos.hawaii.edu/erddap/griddap/ncep_global.nc"
        url = (f"{base_url}?ugrd10m%5B({time_start}):3:({time_end})%5D%5B(90.0):{coordinate_strides}:(-90.0)%5D%5B(0.0):{coordinate_strides}:(359.0)%5D,vgrd10m%5B({time_start}):3:({time_end})%5D%5B(90):{coordinate_strides}:(-90)%5D%5B(0.0):{coordinate_strides}:(359.0)%5D")

        response = requests.get(url)
        response.raise_for_status()
        data = xr.open_dataset(io.BytesIO(response.content))
        return data
    except Exception as e:
        print(f"Error fetching wind data: {e}")
        return None


def processWindData(data):
    u=data['ugrd10m']
    v=data['vgrd10m']

    wind_speed=(np.sqrt(u**2+v**2))*1.94384
    wind_direction = (270 - np.degrees(np.arctan2(v, u))) % 360

    data['wind_speed'] = wind_speed
    data['wind_direction'] = wind_direction

    data['wind_speed'].attrs = {
        'units': 'm/s',
        'long_name': 'Wind Speed at 10m',
        'description': 'Calculated from u and v components'
    }

    data['wind_direction'].attrs = {
        'units': 'degrees',
        'long_name': 'Wind Direction at 10m',
        'description': 'Direction wind is blowing to (0=North, 90=East, 180=South, 270=West)'
    }

    data = data.assign_coords(longitude=((data.longitude + 180) % 360) - 180)
    data = data.sortby('longitude')
    return data

def saveDataToDatabase(data):
    try:
        db = SessionLocal()
        stacked = data[['wind_speed', 'wind_direction']].to_dataframe()
        
        total_records = len(stacked)
        print(f"Processing {total_records} records...")
        
        records = []
        duplicate_count = 0
        saved_count = 0
        
        for idx, row in stacked.iterrows():
            timestamp, lat, lon = idx
            
            if np.isnan(row['wind_speed']) or np.isnan(row['wind_direction']):
                continue
            
            location = WKTElement(f'POINT({lon} {lat})', srid=4326)
            
            py_timestamp = timestamp.to_pydatetime()
            
            record = WindForecast(
                timestamp=py_timestamp,
                wind_speed=float(row['wind_speed']),
                wind_direction=float(row['wind_direction']),
                location=location
            )
            records.append(record)
            
            if len(records) >= 500:
                try:
                    db.bulk_save_objects(records)
                    db.commit()
                    saved_count += len(records)
                    print(f"  Saved batch: {saved_count}/{total_records} records")
                    records = []
                except Exception as e:
                    if "unique_wind_data" in str(e):
                        duplicate_count += len(records)
                        print(f"  Skipped {len(records)} duplicates")
                    else:
                        print(f"  Error in batch: {e}")
                    db.rollback()
                    records = []
        
        if records:
            try:
                db.bulk_save_objects(records)
                db.commit()
                saved_count += len(records)
                print(f"  Saved final batch: {saved_count}/{total_records} records")
            except Exception as e:
                if "unique_wind_data" in str(e):
                    duplicate_count += len(records)
                    print(f"  Skipped {len(records)} duplicates")
                else:
                    print(f"  Error in final batch: {e}")
                db.rollback()
        
        print(f"\nIngestion complete:")
        print(f"  - Saved: {saved_count} records")
        print(f"  - Duplicates skipped: {duplicate_count} records")
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def dailyWindData():
    db = SessionLocal()
    try:
        db.execute(text("""
                INSERT INTO daily_wind_data (
                day, location, wind_speed, wind_direction, source_timestamp)
                SELECT DISTINCT ON (date_trunc('day', w.timestamp), w.location)
                date_trunc('day', w.timestamp) AS day,
                w.location,
                w.wind_speed,
                w.wind_direction,
                w.timestamp as source_timestamp
                FROM wind_forecasts w
                ORDER BY date_trunc('day', w.timestamp), w.location, w.timestamp DESC
                ON CONFLICT(day, location)
                DO UPDATE SET
                wind_speed = EXCLUDED.wind_speed,
                wind_direction = EXCLUDED.wind_direction,
                source_timestamp = EXCLUDED.source_timestamp
                WHERE daily_wind_data.source_timestamp < EXCLUDED.source_timestamp;
                """))
        db.commit()
    except Exception as e:
        print(f"Error saving to database: {e}")
        db.rollback()
    finally:
        db.close()



def main():
    
    Base.metadata.create_all(bind=engine)
    # data = fetchWindData()
    # if data:
    #     processed_data = processWindData(data)
    #     if processed_data:
    #         print(processed_data)
    #         saveDataToDatabase(processed_data)
    dailyWindData()

if __name__ == "__main__":
    main()