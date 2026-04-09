import React, { useCallback, useState, useEffect } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import debounce from 'lodash.debounce';
import apiClient from '../api/client';
import DeckGL from '@deck.gl/react';
import upArrowIcon from '../assets/arrow.svg';
import { IconLayer } from '@deck.gl/layers';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import {WebMercatorViewport} from '@deck.gl/core';
import {ZoomWidget} from '@deck.gl/widgets';
import '@deck.gl/widgets/stylesheet.css';
import { Map } from '@vis.gl/react-maplibre';

const MapComponent: React.FC = () => {
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: -78,
    latitude: 24,
    zoom: 5,
    pitch: 0,
    bearing: 0
  });

  const getSpeedColor = (speed: number): [number, number, number, number] => {
  if (speed <= 8) return [74, 201, 255, 210];
  if (speed <= 16) return [66, 245, 170, 220];
  if (speed <= 24) return [255, 222, 89, 230];
  if (speed <= 32) return [255, 153, 51, 235];
  return [255, 84, 84, 240];
};

const getGridSize = (zoom: number): number => {
  if (zoom > 12) return 0.01;  
  if (zoom > 9)  return 0.05;
  if (zoom > 7)  return 0.1;
  if (zoom > 5)  return 0.5;  
  return 2.0;                 
};

  const [data, setData] = useState<any[]>([]);
  const [hoverCoords, setHoverCoords] = useState<{lon: number, lat: number} | null>(null);

  const updateData = useCallback(
    debounce(async (vs: MapViewState) => {

    const viewport = new WebMercatorViewport(vs);
    const bounds = viewport.getBounds(); 
    const grid_size = getGridSize(vs.zoom);
     
      console.log('box: ',bounds);
      console.log(vs.zoom)
      try {
        const response=await apiClient.get('wind/bbox', {
        params: {
            lat_min: bounds[1]-5,
            lat_max: bounds[3]+5,
            lon_min: bounds[0]-5,
            lon_max: bounds[2]+5,
            grid_size:grid_size
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

      const layers = [
    new IconLayer({
      id: 'wind-arrows',
      data: data,
      wrapLongitude: true,
      pickable: true,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => ({
        url: upArrowIcon,
        width: 64,
        height: 128,
        anchorY: 64,
        mask: true
      }),
      getColor: (d) => getSpeedColor(d.wind_speed),
      getSize: (d) => Math.max(12, Math.min(30, d.wind_speed * 0.85)),
      sizeUnits: 'pixels',
      sizeMinPixels: 10,
      getAngle: (d) => -d.wind_direction,
      opacity: 0.85,
    })
  ];

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

  const widgets = [new ZoomWidget({ placement: 'top-right' })];  

  return (
  <div className="map-shell" style={{ height: '500px', width: '100%', position: 'relative' }}>
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: nextViewState }: ViewStateChangeParameters) => setViewState(nextViewState as MapViewState)}
        controller={true}
        onHover={onHover}
        layers={layers}
        widgets={widgets}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
 />
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