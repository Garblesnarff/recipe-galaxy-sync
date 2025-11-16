/**
 * Route Analysis Service
 * Analyzes GPS routes to calculate stats like distance, pace, elevation, splits
 */

import { GPSCoordinate } from '@/utils/geomath';
import {
  haversineDistance,
  calculateTotalDistance,
  calculateElevationChange,
  speedToPace,
  formatDuration,
  metersToKilometers,
  filterByAccuracy,
  smoothCoordinates,
} from '@/utils/geomath';
import { encodePolyline, decodePolyline } from '@/lib/polyline';

export interface RouteStats {
  totalDistance: number; // meters
  totalTime: number; // seconds
  averagePace: string; // "5:30/km"
  maxSpeed: number; // km/h
  elevationGain: number; // meters
  elevationLoss: number; // meters
  calories: number; // estimated
  splits: Array<{ km: number; time: string; pace: string; distance: number }>;
}

export interface Split {
  km: number;
  distance: number; // meters
  time: string; // formatted time
  pace: string; // min/km
  elevationGain: number;
}

/**
 * Calculate total distance from GPS coordinates
 * @param coords Array of GPS coordinates
 * @returns Distance in meters
 */
export function calculateDistance(coords: GPSCoordinate[]): number {
  if (coords.length < 2) return 0;

  // Filter and smooth coordinates for better accuracy
  const filtered = filterByAccuracy(coords, 50);
  const smoothed = smoothCoordinates(filtered, 3);

  return calculateTotalDistance(smoothed);
}

/**
 * Calculate elevation gain and loss
 * @param coords Array of GPS coordinates with altitude data
 * @returns Object with gain and loss in meters
 */
export function calculateElevationGain(
  coords: GPSCoordinate[]
): { gain: number; loss: number } {
  const coordsWithAltitude = coords.filter((c) => c.altitude !== undefined);

  if (coordsWithAltitude.length < 2) {
    return { gain: 0, loss: 0 };
  }

  return calculateElevationChange(coordsWithAltitude);
}

/**
 * Calculate pace from distance and time
 * @param distance Distance in meters
 * @param timeSeconds Time in seconds
 * @returns Pace string (e.g., "5:30/km")
 */
export function calculatePace(distance: number, timeSeconds: number): string {
  if (distance === 0 || timeSeconds === 0) return '0:00';

  const distanceKm = metersToKilometers(distance);
  const speedKmh = (distanceKm / timeSeconds) * 3600;

  return speedToPace(speedKmh, 'km');
}

/**
 * Generate splits for the route (per kilometer)
 * @param coords Array of GPS coordinates
 * @param splitDistance Split distance in meters (default 1000m = 1km)
 * @returns Array of splits
 */
export function generateSplits(
  coords: GPSCoordinate[],
  splitDistance: number = 1000
): Split[] {
  if (coords.length < 2) return [];

  const splits: Split[] = [];
  let splitStartIndex = 0;
  let currentDistance = 0;
  let splitNumber = 1;

  for (let i = 1; i < coords.length; i++) {
    const segmentDistance = haversineDistance(coords[i - 1], coords[i]);
    currentDistance += segmentDistance;

    // Check if we've completed a split
    if (currentDistance >= splitDistance) {
      const splitCoords = coords.slice(splitStartIndex, i + 1);
      const splitTime = (coords[i].timestamp - coords[splitStartIndex].timestamp) / 1000;
      const splitElevation = calculateElevationGain(splitCoords);

      splits.push({
        km: splitNumber,
        distance: currentDistance,
        time: formatDuration(splitTime),
        pace: calculatePace(currentDistance, splitTime),
        elevationGain: splitElevation.gain,
      });

      // Reset for next split
      splitStartIndex = i;
      currentDistance = 0;
      splitNumber++;
    }
  }

  // Add final partial split if there's remaining distance
  if (currentDistance > 0 && splitStartIndex < coords.length - 1) {
    const splitCoords = coords.slice(splitStartIndex);
    const splitTime =
      (coords[coords.length - 1].timestamp - coords[splitStartIndex].timestamp) / 1000;
    const splitElevation = calculateElevationGain(splitCoords);

    splits.push({
      km: splitNumber,
      distance: currentDistance,
      time: formatDuration(splitTime),
      pace: calculatePace(currentDistance, splitTime),
      elevationGain: splitElevation.gain,
    });
  }

  return splits;
}

/**
 * Analyze complete route and generate statistics
 * @param coords Array of GPS coordinates
 * @param startTime Route start time
 * @param endTime Route end time
 * @param userWeight User weight in kg (for calorie calculation)
 * @param activityType Type of activity
 * @returns Complete route statistics
 */
export function analyzeRoute(
  coords: GPSCoordinate[],
  startTime: Date,
  endTime: Date,
  userWeight: number = 70,
  activityType: string = 'running'
): RouteStats {
  if (coords.length < 2) {
    return {
      totalDistance: 0,
      totalTime: 0,
      averagePace: '0:00',
      maxSpeed: 0,
      elevationGain: 0,
      elevationLoss: 0,
      calories: 0,
      splits: [],
    };
  }

  // Calculate total distance
  const totalDistance = calculateDistance(coords);

  // Calculate total time
  const totalTime = (endTime.getTime() - startTime.getTime()) / 1000;

  // Calculate average pace
  const averagePace = calculatePace(totalDistance, totalTime);

  // Calculate max speed
  const maxSpeed = coords.reduce((max, coord) => {
    if (coord.speed !== undefined) {
      const speedKmh = (coord.speed * 3600) / 1000; // Convert m/s to km/h
      return Math.max(max, speedKmh);
    }
    return max;
  }, 0);

  // Calculate elevation
  const { gain, loss } = calculateElevationGain(coords);

  // Generate splits
  const splits = generateSplits(coords);

  // Estimate calories
  const calories = estimateCaloriesBurned(totalDistance, userWeight, activityType);

  return {
    totalDistance,
    totalTime,
    averagePace,
    maxSpeed,
    elevationGain: gain,
    elevationLoss: loss,
    calories,
    splits,
  };
}

/**
 * Encode route coordinates to polyline string
 * @param coords Array of GPS coordinates
 * @returns Encoded polyline string
 */
export function encodeRoute(coords: GPSCoordinate[]): string {
  const latLngs = coords.map((c) => ({ lat: c.latitude, lng: c.longitude }));
  return encodePolyline(latLngs);
}

/**
 * Decode polyline string to coordinates
 * @param encoded Encoded polyline string
 * @returns Array of {lat, lng} objects
 */
export function decodeRoute(encoded: string): Array<{ lat: number; lng: number }> {
  return decodePolyline(encoded);
}

/**
 * Estimate calories burned during activity
 * Uses MET (Metabolic Equivalent of Task) values
 * @param distance Distance in meters
 * @param weight User weight in kg
 * @param activityType Type of activity
 * @returns Estimated calories burned
 */
export function estimateCaloriesBurned(
  distance: number,
  weight: number,
  activityType: string
): number {
  // MET values for different activities (approximate)
  const metValues: Record<string, number> = {
    walking: 3.5,
    running: 9.8,
    jogging: 7.0,
    cycling: 7.5,
    hiking: 6.0,
  };

  const met = metValues[activityType.toLowerCase()] || 7.0;
  const distanceKm = metersToKilometers(distance);

  // Approximate time based on average speeds
  const averageSpeedKmh: Record<string, number> = {
    walking: 5,
    running: 10,
    jogging: 8,
    cycling: 20,
    hiking: 4,
  };

  const speed = averageSpeedKmh[activityType.toLowerCase()] || 10;
  const timeHours = distanceKm / speed;

  // Calories = MET * weight (kg) * time (hours)
  return Math.round(met * weight * timeHours);
}

/**
 * Calculate moving time (excludes stationary periods)
 * @param coords Array of GPS coordinates
 * @param minSpeed Minimum speed to consider as moving (m/s)
 * @returns Moving time in seconds
 */
export function calculateMovingTime(coords: GPSCoordinate[], minSpeed: number = 0.5): number {
  if (coords.length < 2) return 0;

  let movingTime = 0;

  for (let i = 1; i < coords.length; i++) {
    const speed = coords[i].speed || 0;
    if (speed >= minSpeed) {
      const timeDiff = (coords[i].timestamp - coords[i - 1].timestamp) / 1000;
      movingTime += timeDiff;
    }
  }

  return movingTime;
}

/**
 * Detect auto-pause points (where user was stationary)
 * @param coords Array of GPS coordinates
 * @param minSpeed Minimum speed to consider as moving (m/s)
 * @returns Array of pause segments with start and end times
 */
export function detectPauses(
  coords: GPSCoordinate[],
  minSpeed: number = 0.5
): Array<{ startTime: number; endTime: number; duration: number }> {
  const pauses: Array<{ startTime: number; endTime: number; duration: number }> = [];
  let pauseStart: number | null = null;

  for (let i = 0; i < coords.length; i++) {
    const speed = coords[i].speed || 0;

    if (speed < minSpeed) {
      // User is stationary
      if (pauseStart === null) {
        pauseStart = coords[i].timestamp;
      }
    } else {
      // User is moving
      if (pauseStart !== null) {
        const pauseEnd = coords[i - 1]?.timestamp || coords[i].timestamp;
        pauses.push({
          startTime: pauseStart,
          endTime: pauseEnd,
          duration: (pauseEnd - pauseStart) / 1000,
        });
        pauseStart = null;
      }
    }
  }

  // Handle ongoing pause at end
  if (pauseStart !== null && coords.length > 0) {
    pauses.push({
      startTime: pauseStart,
      endTime: coords[coords.length - 1].timestamp,
      duration: (coords[coords.length - 1].timestamp - pauseStart) / 1000,
    });
  }

  return pauses;
}

/**
 * Get fastest split from route
 * @param splits Array of splits
 * @returns Fastest split or null
 */
export function getFastestSplit(splits: Split[]): Split | null {
  if (splits.length === 0) return null;

  return splits.reduce((fastest, current) => {
    const fastestSeconds = paceToSeconds(fastest.pace);
    const currentSeconds = paceToSeconds(current.pace);
    return currentSeconds < fastestSeconds ? current : fastest;
  });
}

/**
 * Convert pace string to seconds
 * @param pace Pace string (e.g., "5:30")
 * @returns Seconds per km
 */
function paceToSeconds(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
}
