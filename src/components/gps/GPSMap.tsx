/**
 * GPSMap Component
 * Interactive map display for GPS routes using Leaflet
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  initializeMap,
  drawPolyline,
  addMarker,
  fitBounds,
  addLayerControl,
  destroyMap,
  addCurrentPositionMarker,
} from '@/lib/maps';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface GPSMapProps {
  coordinates: Array<{ lat: number; lng: number }>;
  currentLocation?: { lat: number; lng: number };
  showElevation?: boolean;
  interactive?: boolean;
  height?: string;
  className?: string;
}

export function GPSMap({
  coordinates,
  currentLocation,
  showElevation = false,
  interactive = true,
  height = '400px',
  className = '',
}: GPSMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentMarkerRef = useRef<L.CircleMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const defaultCenter: [number, number] =
        coordinates.length > 0
          ? [coordinates[0].lat, coordinates[0].lng]
          : [37.7749, -122.4194]; // Default to SF

      const map = initializeMap('gps-map', {
        center: defaultCenter,
        zoom: 13,
        zoomControl: interactive,
        attributionControl: true,
      });

      if (interactive) {
        addLayerControl(map);
      }

      mapRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        destroyMap(mapRef.current);
        mapRef.current = null;
      }
    };
  }, []);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current || coordinates.length === 0) return;

    try {
      // Remove existing polyline
      if (polylineRef.current) {
        polylineRef.current.remove();
      }

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Draw new polyline
      const latLngs: [number, number][] = coordinates.map((c) => [c.lat, c.lng]);
      const polyline = drawPolyline(mapRef.current, latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      });
      polylineRef.current = polyline;

      // Add start marker
      if (coordinates.length > 0) {
        const startMarker = addMarker(mapRef.current, {
          position: [coordinates[0].lat, coordinates[0].lng],
          icon: 'start',
          popup: 'Start',
        });
        markersRef.current.push(startMarker);
      }

      // Add end marker (only if different from start)
      if (coordinates.length > 1) {
        const endCoord = coordinates[coordinates.length - 1];
        const endMarker = addMarker(mapRef.current, {
          position: [endCoord.lat, endCoord.lng],
          icon: 'end',
          popup: 'End',
        });
        markersRef.current.push(endMarker);
      }

      // Fit bounds to show entire route
      fitBounds(mapRef.current, latLngs, 50);
    } catch (error) {
      console.error('Error updating route:', error);
    }
  }, [coordinates]);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    try {
      // Remove existing current location marker
      if (currentMarkerRef.current) {
        currentMarkerRef.current.remove();
      }

      // Add new current location marker
      const marker = addCurrentPositionMarker(mapRef.current, [
        currentLocation.lat,
        currentLocation.lng,
      ]);
      currentMarkerRef.current = marker;

      // Center map on current location
      if (interactive) {
        mapRef.current.setView([currentLocation.lat, currentLocation.lng], mapRef.current.getZoom());
      }
    } catch (error) {
      console.error('Error updating current location:', error);
    }
  }, [currentLocation, interactive]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (coordinates.length === 0) {
    return (
      <Card className={`p-8 ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <MapPin className="w-12 h-12 mb-2" />
          <p>No route data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Card
        className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        <div
          ref={containerRef}
          id="gps-map"
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />
        {interactive && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 bg-white shadow-md z-[1000]"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
      </Card>
    </div>
  );
}
