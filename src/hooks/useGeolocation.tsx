/**
 * useGeolocation Hook
 * Provides access to browser geolocation API with permission handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isGeolocationSupported,
  checkGeolocationPermission,
  requestGeolocationPermission,
  getCurrentPosition,
  type PermissionState,
  type GeolocationError,
} from '@/lib/geolocation';
import { GPSCoordinate } from '@/utils/geomath';

interface UseGeolocationReturn {
  position: GPSCoordinate | null;
  error: GeolocationError | null;
  permissionState: PermissionState;
  isLoading: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  refreshPosition: () => Promise<void>;
}

/**
 * Hook for accessing browser geolocation
 * Manages permission state and provides current position
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GPSCoordinate | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported] = useState(isGeolocationSupported());

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const state = await checkGeolocationPermission();
      setPermissionState(state);
    };

    if (isSupported) {
      checkPermission();
    } else {
      setPermissionState('unsupported');
    }
  }, [isSupported]);

  /**
   * Request geolocation permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const granted = await requestGeolocationPermission();
      if (granted) {
        setPermissionState('granted');
        // Get initial position
        await refreshPosition();
      } else {
        setPermissionState('denied');
      }
      return granted;
    } catch (err) {
      setError(err as GeolocationError);
      setPermissionState('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Refresh current position
   */
  const refreshPosition = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPosition = await getCurrentPosition();
      setPosition(newPosition);
      setPermissionState('granted');
    } catch (err) {
      setError(err as GeolocationError);
      if ((err as GeolocationError).type === 'PERMISSION_DENIED') {
        setPermissionState('denied');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    position,
    error,
    permissionState,
    isLoading,
    isSupported,
    requestPermission,
    refreshPosition,
  };
}
