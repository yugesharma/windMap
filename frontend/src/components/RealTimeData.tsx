import apiClient from "../api/client";
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type WindRow = [number, number, number, number]


type WindContextValue = {
    windData: WindRow[]
    resetWindData: () => void
    getWindData: (params: apiParams) => Promise<void>
    path:[number,number][]
    setPath: React.Dispatch<React.SetStateAction<[number,number][]>>
}

export const WindContext = createContext<WindContextValue | undefined>(undefined)


interface apiParams {
    lat:number
    lon:number
}


interface windData {
    lat:number
    lon:number
    speed:number
    deg:number
    
}



async function fetchWindData(params: apiParams): Promise <windData> {

        const response = await apiClient.get<windData>('wind/realtime', 
            {params:{lat:params.lat,lon:params.lon}});
        const fetchedWind=response.data;
        return fetchedWind
}


function WindProvider({children}: {children: ReactNode}) {
    const [windData, setWindData]=useState<WindRow[]>([]);
    const [path, setPath]=useState<any[]>([]);
    function resetWindData() {
        setWindData([]);
        setPath([]);
    }

    async function getWindData(params: apiParams) {
        const fetchedWind=await fetchWindData(params);
        setWindData(prev => [...prev,[params.lat, params.lon, fetchedWind.speed, fetchedWind.deg]])
    }

    return(
        <WindContext.Provider value={{windData,resetWindData,getWindData, path, setPath}}>
            {children}
        </WindContext.Provider>
        

    )
}

export function WindTable(){
    const context = useContext(WindContext);

    if (!context) {
        throw new Error('Context empty');
    }

    const { windData, resetWindData, setPath } = context;


    return (
        <div className="wind-table-shell">
            <button onClick={resetWindData}>
                Reset
            </button>
            <table className="wind-table">
            <thead>
            <tr>
            <th>lat</th>
            <th>lon</th>
            <th>Wind speed</th>
            <th>Wind direction</th>
            </tr>
            </thead>
            <tbody>
            {windData.length === 0 ? (
                <tr>
                    <td colSpan={4} className="wind-table-empty">No readings yet. Click the map to add one.</td>
                </tr>
            ) : (
                windData.map((item,i)=> (
                    <tr key={i}>
                        <td>{item[0].toFixed(2)}</td>
                        <td>{item[1].toFixed(2)}</td>
                        <td>{item[2]}</td>
                        <td>{item[3]}</td>
                    </tr>
                ))
            )}
                </tbody>
            </table>
        </div>
    )
}

export default WindProvider;