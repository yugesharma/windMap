import React, { useCallback, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import debounce from 'lodash.debounce';
import apiClient from '../api/client';

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const updateData = useCallback(
    debounce(async (bounds:maplibregl.LngLatBounds) => {
      const bbox={
        lat_min:bounds.getSouth(),
        lat_max:bounds.getNorth(),
        lon_min:bounds.getWest(),
        lon_max:bounds.getEast(),
      };
      console.log('box: ',bbox);
      try {
        const response=await apiClient.get('wind/bbox', {
          params: {
          lat_min:bounds.getSouth(),
          lat_max:bounds.getNorth(),
          lon_min:bounds.getWest(),
          lon_max:bounds.getEast(),
          }
        });
        const data=response.data
        console.log(data)
        return data;
      } catch (error: any) {
        console.log(error)
      }
    }, 500), []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; 

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', 
      center: [-73.935242, 40.730610], 
      zoom: 9
    });

    map.current.on('load', () => {
      updateData(map.current!.getBounds());
    });

    map.current.on('moveend', () => {
      updateData(map.current!.getBounds());
    });

    return () => {
      map.current?.remove();
      map.current = null;
      updateData.cancel();
    };
  }, [updateData]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />
  );
};

export default MapComponent;