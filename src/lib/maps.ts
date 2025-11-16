/**
 * Map utilities for Leaflet integration
 * Provides helpers for map initialization, markers, and polylines
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapOptions {
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
  attributionControl?: boolean;
}

export interface MarkerOptions {
  position: [number, number];
  title?: string;
  icon?: 'start' | 'end' | 'current' | 'waypoint';
  popup?: string;
}

/**
 * Default tile layer providers
 */
export const TILE_PROVIDERS = {
  openStreetMap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

/**
 * Initialize a Leaflet map
 * @param containerId ID of the container element
 * @param options Map options
 * @returns Leaflet map instance
 */
export function initializeMap(
  containerId: string,
  options: MapOptions
): L.Map {
  const map = L.map(containerId, {
    center: options.center,
    zoom: options.zoom,
    zoomControl: options.zoomControl ?? true,
    attributionControl: options.attributionControl ?? true,
  });

  // Add default tile layer (OpenStreetMap)
  L.tileLayer(TILE_PROVIDERS.openStreetMap.url, {
    attribution: TILE_PROVIDERS.openStreetMap.attribution,
    maxZoom: TILE_PROVIDERS.openStreetMap.maxZoom,
  }).addTo(map);

  return map;
}

/**
 * Create custom marker icons
 */
export const createMarkerIcons = () => {
  const iconSize: [number, number] = [25, 41];
  const iconAnchor: [number, number] = [12, 41];
  const popupAnchor: [number, number] = [1, -34];

  return {
    start: L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#22c55e"/>
          <circle cx="12.5" cy="12.5" r="6" fill="white"/>
        </svg>
      `),
      iconSize,
      iconAnchor,
      popupAnchor,
    }),
    end: L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#ef4444"/>
          <circle cx="12.5" cy="12.5" r="6" fill="white"/>
        </svg>
      `),
      iconSize,
      iconAnchor,
      popupAnchor,
    }),
    current: L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#3b82f6"/>
          <circle cx="12.5" cy="12.5" r="6" fill="white"/>
          <circle cx="12.5" cy="12.5" r="3" fill="#3b82f6"/>
        </svg>
      `),
      iconSize,
      iconAnchor,
      popupAnchor,
    }),
    waypoint: L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#6366f1" stroke="white" stroke-width="2"/>
        </svg>
      `),
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    }),
  };
};

/**
 * Add a marker to the map
 * @param map Leaflet map instance
 * @param options Marker options
 * @returns Leaflet marker instance
 */
export function addMarker(map: L.Map, options: MarkerOptions): L.Marker {
  const icons = createMarkerIcons();
  const icon = options.icon ? icons[options.icon] : undefined;

  const marker = L.marker(options.position, { icon, title: options.title });

  if (options.popup) {
    marker.bindPopup(options.popup);
  }

  marker.addTo(map);
  return marker;
}

/**
 * Draw a polyline on the map
 * @param map Leaflet map instance
 * @param coordinates Array of [lat, lng] coordinates
 * @param options Polyline options
 * @returns Leaflet polyline instance
 */
export function drawPolyline(
  map: L.Map,
  coordinates: [number, number][],
  options?: L.PolylineOptions
): L.Polyline {
  const defaultOptions: L.PolylineOptions = {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.8,
    ...options,
  };

  const polyline = L.polyline(coordinates, defaultOptions);
  polyline.addTo(map);
  return polyline;
}

/**
 * Fit map bounds to show all coordinates
 * @param map Leaflet map instance
 * @param coordinates Array of [lat, lng] coordinates
 * @param padding Padding around bounds
 */
export function fitBounds(
  map: L.Map,
  coordinates: [number, number][],
  padding: number = 50
): void {
  if (coordinates.length === 0) return;

  const bounds = L.latLngBounds(coordinates);
  map.fitBounds(bounds, { padding: [padding, padding] });
}

/**
 * Add tile layer control to switch between map types
 * @param map Leaflet map instance
 */
export function addLayerControl(map: L.Map): L.Control.Layers {
  const baseLayers = {
    'Street Map': L.tileLayer(TILE_PROVIDERS.openStreetMap.url, {
      attribution: TILE_PROVIDERS.openStreetMap.attribution,
      maxZoom: TILE_PROVIDERS.openStreetMap.maxZoom,
    }),
    'Satellite': L.tileLayer(TILE_PROVIDERS.satellite.url, {
      attribution: TILE_PROVIDERS.satellite.attribution,
      maxZoom: TILE_PROVIDERS.satellite.maxZoom,
    }),
    'Terrain': L.tileLayer(TILE_PROVIDERS.terrain.url, {
      attribution: TILE_PROVIDERS.terrain.attribution,
      maxZoom: TILE_PROVIDERS.terrain.maxZoom,
    }),
  };

  // Add default layer to map
  baseLayers['Street Map'].addTo(map);

  const layerControl = L.control.layers(baseLayers).addTo(map);
  return layerControl;
}

/**
 * Calculate distance between two points on map
 * @param point1 First point [lat, lng]
 * @param point2 Second point [lat, lng]
 * @returns Distance in meters
 */
export function calculateMapDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const latLng1 = L.latLng(point1);
  const latLng2 = L.latLng(point2);
  return latLng1.distanceTo(latLng2);
}

/**
 * Create a circle marker for current position with pulsing animation
 * @param map Leaflet map instance
 * @param position [lat, lng] position
 * @returns Leaflet circle marker
 */
export function addCurrentPositionMarker(
  map: L.Map,
  position: [number, number]
): L.CircleMarker {
  const marker = L.circleMarker(position, {
    radius: 8,
    fillColor: '#3b82f6',
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
  });

  marker.addTo(map);
  return marker;
}

/**
 * Add scale control to map
 * @param map Leaflet map instance
 * @param metric Whether to show metric units
 * @param imperial Whether to show imperial units
 */
export function addScaleControl(
  map: L.Map,
  metric: boolean = true,
  imperial: boolean = false
): L.Control.Scale {
  const scale = L.control.scale({
    metric,
    imperial,
    position: 'bottomleft',
  });

  scale.addTo(map);
  return scale;
}

/**
 * Clean up map instance
 * @param map Leaflet map instance
 */
export function destroyMap(map: L.Map): void {
  map.remove();
}

/**
 * Get center point of a set of coordinates
 * @param coordinates Array of [lat, lng] coordinates
 * @returns Center point [lat, lng]
 */
export function getCenterPoint(coordinates: [number, number][]): [number, number] {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];

  const bounds = L.latLngBounds(coordinates);
  const center = bounds.getCenter();
  return [center.lat, center.lng];
}
