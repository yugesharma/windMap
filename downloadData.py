import requests
import datetime  
import pytz
import xarray as xr
import pandas as pd
import numpy as np



myTimeZone=pytz.timezone('America/New_York')
today=datetime.datetime.now(myTimeZone)
today=today.date()
endDate=today+datetime.timedelta(days=8)
endDate=endDate
url=f'https://pae-paha.pacioos.hawaii.edu/thredds/ncss/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd?var=ugrd10m&var=vgrd10m&north=50&west=278&east=345&south=12&horizStride=1&time_start={today}T12%3A00%3A00Z&time_end={endDate}T12%3A00%3A00Z&timeStride=1&addLatLon=true'
print(url)
response=requests.get(url, timeout=30)
if response.status_code==200:
    file_path='forecast1.nc'
    print("Successfully fetched")
    with open(file_path, 'wb') as file:
        file.write(response.content)
elif response.status_code==400 and 'does not intersect actual time range' in response.text:
    # Try fetching yesterday's data instead
    yesterday = today - datetime.timedelta(days=1)
    endDateYesterday = yesterday + datetime.timedelta(days=8)
    print(f"Data not available for {today}, trying {yesterday} instead...")
    url_retry=f'https://pae-paha.pacioos.hawaii.edu/thredds/ncss/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd?var=ugrd10m&var=vgrd10m&north=50&west=278&east=345&south=12&horizStride=1&time_start={yesterday}T12%3A00%3A00Z&time_end={endDateYesterday}T12%3A00%3A00Z&timeStride=1&addLatLon=true'
    response=requests.get(url_retry, timeout=30)
    if response.status_code==200:
        file_path='forecast1.nc'
        print(f"Successfully fetched data for {yesterday}")
        with open(file_path, 'wb') as file:
            file.write(response.content)
    else:
        print(f'Error: HTTP status code {response.status_code}')
        print(f'Response: {response.text[:200]}')
        import sys
        sys.exit(1)
else:
    print(f'Error: HTTP status code {response.status_code}')
    print(f'Response: {response.text[:200]}')
    import sys
    sys.exit(1)


ds=xr.open_dataset('forecast1.nc')
df=ds.to_dataframe()

df.to_csv('forecast.csv')


# Load the CSV file into a Pandas DataFrame
input_file = 'forecast.csv'
df = pd.read_csv(input_file)

df['longitude']=((df['longitude'])+180)%360 - 180
# Calculate wind speed (WS) and add it as a new column
df['WS'] = round(np.sqrt(df['ugrd10m'] ** 2 + df['vgrd10m'] ** 2),4)

# Calculate wind direction (WD) in degrees and add it as a new column
df['WD'] = round(np.degrees(np.arctan2(df['vgrd10m'], df['ugrd10m'])),2)


mask=df['time'].str.endswith('12:00:00')
new_df=df[mask]

# Save the updated DataFrame to a new CSV file
output_file = 'final.csv'
new_df.to_csv(output_file, index=False)


print("Wind speed and direction columns added and saved to", output_file)


