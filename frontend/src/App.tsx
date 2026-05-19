import { useEffect, useState } from 'react'
import MapComponent from './components/MapComponent'
import './App.css'
import Slider from './components/Slider'
import apiClient from './api/client'
import WindProvider, { WindTable } from './components/RealTimeData'

type DateRangeResponse = {
  min: number; 
  max: number; 
  count: number;
};

function App() {
  const [availableDates, setAvailableDates]=useState<string[]>([]);
  const [selectedDate, setSelectedDate]=useState<string>('');
  
  const fetch_date_range= async() => {
    try {
      const response =await apiClient.get<DateRangeResponse>('/wind/date_range');
      const {min, max} =response.data;
      const start=Math.floor(min/86400)*86400
      const end=Math.floor(max/86400)*86400
      const dates: string[]=[];
      for (let ts=start; ts<=end; ts+=86400) {
        dates.push(new Date(ts*1000).toISOString());
      }
      
      setAvailableDates(dates);
      if (dates.length>0) {
        setSelectedDate(dates[0]);
      }
    }
    catch(error:any) {
      console.log(error)
    }
  };

  useEffect(() => {
    fetch_date_range();
  },[]);

  return (
    <WindProvider>
      <main className="app-shell">
        <aside className="data-panel">
          <div className="panel-header">
            <p className="eyebrow">Realtime readings</p>
            <h1>Wind table</h1>
            <p className="panel-copy">
              Click locations on the map to capture live wind values.
            </p>
          </div>
          <div className="table-card">
            <WindTable />
          </div>
        </aside>

        <section className="map-panel">
          <div className="map-card">
            <MapComponent selectedDate={selectedDate} />
          </div>
          <div className="slider-card">
            <Slider
              selectedDate={selectedDate}
              availableDates={availableDates}
              onDateChange={setSelectedDate}
            />
          </div>
        </section>
      </main>
    </WindProvider>
  )
}

export default App
