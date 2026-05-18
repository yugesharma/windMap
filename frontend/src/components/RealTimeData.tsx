import apiClient from "../api/client";
import { useCallback, useMemo, useState, useEffect } from 'react';


interface apiParams {
    lat:number
    lon:number
}


interface windData {
    speed:number
    deg:number
    gust?:number
}

interface ApiResponse<T> {
    data:T
    error?:string
}

interface WindRow {
  lat:   number
  lon:   number
  speed: number
  deg:   number
  gust?: number
}

async function fetchWindData(params: apiParams): Promise <windData> {

        const response = await apiClient.get<ApiResponse<windData>>('wind/realtime', 
            {params:{lat:params.lat,lon:params.lon}});
        const fetchedWind=response.data;
        return fetchedWind
}


export function WindTable(){

    const [windData, setWindData]=useState<[number, number, number, number][]>([]);

    const getWindData=async(params: apiParams)=> {
        const fetchedWind=await fetchWindData(params);
        setWindData(prev => [...prev,[params.lat, params.lon, fetchedWind.speed, fetchedWind.deg]])
        
        return {fetchedWind}
    }
    return (
        <table>
        <thead>
        <tr>
        <th>lat</th>
        <th>lon</th>
        <th>Wind speed</th>
        <th>Wind direction</th>
        </tr>
        </thead>
        <tbody>
        {windData.map((item,i)=> (
            <tr key={i}>
                <td>{item[0]}</td>
                <td>{item[1]}</td>
                <td>{item[2]}</td>
                <td>{item[3]}</td>
            </tr>
        ))}
            </tbody>
        </table>
    )
}

export default WindTable;