import React, { useCallback, useState, useEffect } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import debounce from 'lodash.debounce';
import apiClient from '../api/client';
import DeckGL from '@deck.gl/react';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import {WebMercatorViewport} from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from '@vis.gl/react-maplibre';

const MapComponent: React.FC = () => {
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: -78,
    latitude: 24,
    zoom: 5,
    pitch: 0,
    bearing: 0
  });

  const [data, setData] = useState<any[]>([]);
  const [hoverCoords, setHoverCoords] = useState<{lon: number, lat: number} | null>(null);

  const updateData = useCallback(
    debounce(async (vs: MapViewState) => {

    const viewport = new WebMercatorViewport(vs);
    const bounds = viewport.getBounds(); 
     
      console.log('box: ',bounds);
      try {
        const response=await apiClient.get('wind/bbox', {
        params: {
            lat_min: bounds[1],
            lat_max: bounds[3],
            lon_min: bounds[0],
            lon_max: bounds[2],
          }
        });
        const data=response.data
        setData(data)
        console.log(response)
        return data;
      } catch (error: any) {
        console.log(error)
      }
    }, 500), []);

    const layers=[
      new ScatterplotLayer({
        id:'wind-markers',
        data:data,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: () => [0,128,255,200],
        getRadius: (d: any) => d.wind_speed*1000,
        pickable:true,
      })
    ]

  useEffect(() => {
    updateData(viewState);
  }, [viewState.latitude, viewState.longitude, viewState.zoom, updateData]);

  const onHover = (info: any) => {
    if (info.coordinate) {
      const [lon, lat] = info.coordinate;
      setHoverCoords({ lon, lat });
    } else {
      setHoverCoords(null);
    }
  };

    
  return (
   <div style={{ height: '500px', width: '100%', position: 'relative' }}>
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: nextViewState }: ViewStateChangeParameters) => setViewState(nextViewState as MapViewState)}
        controller={true}
        onHover={onHover}
        layers={layers}
      >
        <Map mapStyle="https://tiles.openfreemap.org/styles/bright" />
      </DeckGL>
      {hoverCoords && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          pointerEvents: 'none', 
          zIndex: 10
        }}>
          LAT: {hoverCoords.lat.toFixed(4)} | LON: {hoverCoords.lon.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default MapComponent;