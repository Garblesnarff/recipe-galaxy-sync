/**
 * Geolocation API wrapper for GPS tracking
 * Handles browser geolocation with proper error handling and permissions
 */

import { GPSCoordinate } from '@/utils/geomath';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';
}

/**
 * Check if geolocation is supported in this browser
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Check current permission status for geolocation
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (!isGeolocationSupported()) {
    return 'unsupported';
  }

  // Check if Permissions API is available
  if (!navigator.permissions || !navigator.permissions.query) {
    // Permissions API not supported, return 'prompt'
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state as PermissionState;
  } catch (error) {
    console.warn('Error checking geolocation permission:', error);
    return 'prompt';
  }
}

/**
 * Request geolocation permission by getting current position
 * This will trigger the browser's permission prompt if not already granted
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  try {
    await getCurrentPosition();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current GPS position
 * @param options Geolocation options
 * @returns Promise resolving to GPSCoordinate
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GPSCoordinate> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(createGeolocationError('UNSUPPORTED', 'Geolocation is not supported in this browser'));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(positionToGPSCoordinate(position));
      },
      (error) => {
        reject(handleGeolocationError(error));
      },
      defaultOptions
    );
  });
}

/**
 * Watch GPS position for continuous tracking
 * @param callback Function to call with each position update
 * @param errorCallback Function to call on error
 * @param options Geolocation options
 * @returns Watch ID that can be used to stop watching
 */
export function watchPosition(
  callback: (coordinate: GPSCoordinate) => void,
  errorCallback?: (error: GeolocationError) => void,
  options?: PositionOptions
): number {
  if (!isGeolocationSupported()) {
    const error = createGeolocationError('UNSUPPORTED', 'Geolocation is not supported');
    if (errorCallback) errorCallback(error);
    return -1;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    ...options,
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback(positionToGPSCoordinate(position));
    },
    (error) => {
      if (errorCallback) {
        errorCallback(handleGeolocationError(error));
      }
    },
    defaultOptions
  );

  return watchId;
}

/**
 * Stop watching GPS position
 * @param watchId Watch ID returned from watchPosition
 */
export function clearWatch(watchId: number): void {
  if (watchId >= 0 && isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Get optimized options for battery-efficient tracking
 * Uses lower accuracy and longer intervals
 */
export function getBatteryEfficientOptions(): PositionOptions {
  return {
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 10000, // Accept positions up to 10 seconds old
  };
}

/**
 * Get optimized options for high-accuracy tracking
 * Uses highest accuracy but consumes more battery
 */
export function getHighAccuracyOptions(): PositionOptions {
  return {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0, // Always get fresh position
  };
}

/**
 * Convert GeolocationPosition to GPSCoordinate
 */
function positionToGPSCoordinate(position: GeolocationPosition): GPSCoordinate {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude ?? undefined,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
    speed: position.coords.speed ?? undefined,
  };
}

/**
 * Handle GeolocationPositionError and convert to custom error
 */
function handleGeolocationError(error: GeolocationPositionError): GeolocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return createGeolocationError(
        'PERMISSION_DENIED',
        'Location permission denied. Please enable location access in your browser settings.'
      );
    case error.POSITION_UNAVAILABLE:
      return createGeolocationError(
        'POSITION_UNAVAILABLE',
        'Location information is unavailable. Please check your GPS signal.'
      );
    case error.TIMEOUT:
      return createGeolocationError(
        'TIMEOUT',
        'Location request timed out. Please try again.'
      );
    default:
      return createGeolocationError(
        'POSITION_UNAVAILABLE',
        error.message || 'An unknown error occurred while getting location.'
      );
  }
}

/**
 * Create a custom GeolocationError
 */
function createGeolocationError(
  type: GeolocationError['type'],
  message: string
): GeolocationError {
  const errorCodes = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
    UNSUPPORTED: 4,
  };

  return {
    code: errorCodes[type],
    message,
    type,
  };
}

/**
 * Calculate GPS signal strength based on accuracy
 * @param accuracy GPS accuracy in meters
 * @returns Signal strength: 'excellent' | 'good' | 'fair' | 'poor'
 */
export function getSignalStrength(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 50) return 'fair';
  return 'poor';
}

/**
 * Check if a GPS coordinate is valid
 * @param coord GPS coordinate to validate
 * @returns true if valid, false otherwise
 */
export function isValidCoordinate(coord: GPSCoordinate): boolean {
  return (
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180 &&
    coord.accuracy > 0
  );
}

/**
 * Estimate battery usage level based on tracking settings
 * @param enableHighAccuracy Whether high accuracy mode is enabled
 * @param updateInterval Update interval in milliseconds
 * @returns Battery usage: 'low' | 'medium' | 'high'
 */
export function estimateBatteryUsage(
  enableHighAccuracy: boolean,
  updateInterval: number
): 'low' | 'medium' | 'high' {
  if (!enableHighAccuracy && updateInterval >= 10000) return 'low';
  if (!enableHighAccuracy || updateInterval >= 5000) return 'medium';
  return 'high';
}
