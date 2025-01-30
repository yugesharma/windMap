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
url=f'https://pae-paha.pacioos.hawaii.edu/thredds/ncss/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd?var=ugrd10m&var=vgrd10m&north=50&west=278&east=345&south=12&disableLLSubset=on&disableProjSubset=on&horizStride=1&time_start={today}T12%3A00%3A00Z&time_end={endDate}T12%3A00%3A00Z&timeStride=1&addLatLon=true'
print(url)
response=requests.get(url)
if response.status_code==200:
    file_path='forecast1.nc'
    print("Sucessfully fetched")
    with open(file_path, 'wb') as file:
        file.write(response.content)
else:
    print('err')


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


