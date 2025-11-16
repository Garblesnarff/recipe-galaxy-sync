/**
 * Geospatial mathematics utilities for GPS tracking
 * Includes distance calculations, bearing, and unit conversions
 */

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function haversineDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing (direction) from one coordinate to another
 * @param coord1 Start coordinate
 * @param coord2 End coordinate
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Convert meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Convert meters to kilometers
 * @param meters Distance in meters
 * @returns Distance in kilometers
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

/**
 * Convert miles to meters
 * @param miles Distance in miles
 * @returns Distance in meters
 */
export function milesToMeters(miles: number): number {
  return miles / 0.000621371;
}

/**
 * Convert kilometers to meters
 * @param km Distance in kilometers
 * @returns Distance in meters
 */
export function kilometersToMeters(km: number): number {
  return km * 1000;
}

/**
 * Convert pace (e.g., "5:30/km") to speed in km/h
 * @param pace Pace string (e.g., "5:30/km")
 * @param unit Unit of pace ("km" or "mi")
 * @returns Speed in km/h
 */
export function paceToSpeed(pace: string, unit: 'km' | 'mi' = 'km'): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  const totalMinutes = minutes + seconds / 60;

  if (totalMinutes === 0) return 0;

  const speedInUnit = 60 / totalMinutes; // Speed in unit/hour
  return unit === 'mi' ? speedInUnit * 1.60934 : speedInUnit;
}

/**
 * Convert speed (km/h) to pace (min/km or min/mi)
 * @param speedKmh Speed in km/h
 * @param unit Unit for pace ("km" or "mi")
 * @returns Pace string (e.g., "5:30/km")
 */
export function speedToPace(speedKmh: number, unit: 'km' | 'mi' = 'km'): string {
  if (speedKmh === 0) return '0:00';

  const speedInUnit = unit === 'mi' ? speedKmh / 1.60934 : speedKmh;
  const minutesPerUnit = 60 / speedInUnit;
  const minutes = Math.floor(minutesPerUnit);
  const seconds = Math.round((minutesPerUnit - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to HH:MM:SS
 * @param seconds Duration in seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate elevation gain and loss from altitude data
 * @param coordinates Array of coordinates with altitude
 * @returns Object with gain and loss in meters
 */
export function calculateElevationChange(
  coordinates: GPSCoordinate[]
): { gain: number; loss: number } {
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prevAlt = coordinates[i - 1].altitude;
    const currAlt = coordinates[i].altitude;

    if (prevAlt !== undefined && currAlt !== undefined) {
      const diff = currAlt - prevAlt;
      if (diff > 0) {
        gain += diff;
      } else {
        loss += Math.abs(diff);
      }
    }
  }

  return { gain, loss };
}

/**
 * Calculate total distance from array of coordinates
 * @param coordinates Array of GPS coordinates
 * @returns Total distance in meters
 */
export function calculateTotalDistance(coordinates: GPSCoordinate[]): number {
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += haversineDistance(coordinates[i - 1], coordinates[i]);
  }

  return totalDistance;
}

/**
 * Smooth GPS coordinates to remove noise
 * @param coordinates Array of GPS coordinates
 * @param windowSize Number of points to average
 * @returns Smoothed coordinates
 */
export function smoothCoordinates(
  coordinates: GPSCoordinate[],
  windowSize: number = 3
): GPSCoordinate[] {
  if (coordinates.length < windowSize) return coordinates;

  const smoothed: GPSCoordinate[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < coordinates.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(coordinates.length, i + halfWindow + 1);
    const window = coordinates.slice(start, end);

    const avgLat = window.reduce((sum, c) => sum + c.latitude, 0) / window.length;
    const avgLng = window.reduce((sum, c) => sum + c.longitude, 0) / window.length;
    const avgAlt = window.every((c) => c.altitude !== undefined)
      ? window.reduce((sum, c) => sum + (c.altitude || 0), 0) / window.length
      : coordinates[i].altitude;

    smoothed.push({
      ...coordinates[i],
      latitude: avgLat,
      longitude: avgLng,
      altitude: avgAlt,
    });
  }

  return smoothed;
}

/**
 * Filter out GPS points with low accuracy
 * @param coordinates Array of GPS coordinates
 * @param maxAccuracy Maximum acceptable accuracy in meters
 * @returns Filtered coordinates
 */
export function filterByAccuracy(
  coordinates: GPSCoordinate[],
  maxAccuracy: number = 50
): GPSCoordinate[] {
  return coordinates.filter((coord) => coord.accuracy <= maxAccuracy);
}

/**
 * Calculate average speed from distance and time
 * @param distanceMeters Distance in meters
 * @param timeSeconds Time in seconds
 * @returns Speed in km/h
 */
export function calculateAverageSpeed(distanceMeters: number, timeSeconds: number): number {
  if (timeSeconds === 0) return 0;
  return (distanceMeters / 1000) / (timeSeconds / 3600);
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @param unit Preferred unit ("km" or "mi")
 * @returns Formatted distance string
 */
export function formatDistance(meters: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    const miles = metersToMiles(meters);
    return `${miles.toFixed(2)} mi`;
  }
  const km = metersToKilometers(meters);
  return `${km.toFixed(2)} km`;
}
