/**
 * GPS Location Tracking Service
 * Manages GPS tracking sessions and waypoint recording
 */

import { GPSCoordinate } from '@/utils/geomath';
import {
  getCurrentPosition as getGeoPosition,
  watchPosition as watchGeoPosition,
  clearWatch as clearGeoWatch,
  getHighAccuracyOptions,
} from '@/lib/geolocation';

export interface GPSTrackingSession {
  sessionId: string;
  startTime: Date;
  coordinates: GPSCoordinate[];
  isActive: boolean;
  isPaused: boolean;
  watchId?: number;
}

// In-memory storage for active sessions (in production, consider using IndexedDB)
const activeSessions = new Map<string, GPSTrackingSession>();
let currentSessionId: string | null = null;

/**
 * Start a new GPS tracking session
 * @param highAccuracy Whether to use high accuracy mode
 * @returns Session ID
 */
export async function startGPSTracking(highAccuracy: boolean = true): Promise<string> {
  // Stop any existing session
  if (currentSessionId) {
    await stopGPSTracking(currentSessionId);
  }

  const sessionId = generateSessionId();
  const session: GPSTrackingSession = {
    sessionId,
    startTime: new Date(),
    coordinates: [],
    isActive: true,
    isPaused: false,
  };

  // Get initial position
  try {
    const initialPosition = await getCurrentPosition();
    session.coordinates.push(initialPosition);
  } catch (error) {
    console.error('Failed to get initial position:', error);
    throw new Error('Unable to start GPS tracking. Please ensure location permissions are granted.');
  }

  // Start watching position
  const options = highAccuracy ? getHighAccuracyOptions() : undefined;
  const watchId = watchGeoPosition(
    (coordinate) => {
      const currentSession = activeSessions.get(sessionId);
      if (currentSession && currentSession.isActive && !currentSession.isPaused) {
        recordWaypoint(sessionId, coordinate);
      }
    },
    (error) => {
      console.error('GPS tracking error:', error);
    },
    options
  );

  session.watchId = watchId;
  activeSessions.set(sessionId, session);
  currentSessionId = sessionId;

  return sessionId;
}

/**
 * Stop GPS tracking session
 * @param sessionId Session ID to stop
 */
export async function stopGPSTracking(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.isActive = false;

  if (session.watchId !== undefined) {
    clearGeoWatch(session.watchId);
  }

  if (currentSessionId === sessionId) {
    currentSessionId = null;
  }

  // Keep session in memory for retrieval, but mark as inactive
  activeSessions.set(sessionId, session);
}

/**
 * Pause GPS tracking session
 * @param sessionId Session ID to pause
 */
export async function pauseTracking(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.isPaused = true;
  activeSessions.set(sessionId, session);
}

/**
 * Resume GPS tracking session
 * @param sessionId Session ID to resume
 */
export async function resumeTracking(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.isPaused = false;
  activeSessions.set(sessionId, session);
}

/**
 * Record a waypoint in the tracking session
 * @param sessionId Session ID
 * @param coordinate GPS coordinate to record
 */
export async function recordWaypoint(
  sessionId: string,
  coordinate: GPSCoordinate
): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.isActive || session.isPaused) {
    return;
  }

  // Filter out low-accuracy points (optional, can be configured)
  if (coordinate.accuracy > 100) {
    console.warn('Waypoint accuracy too low, skipping:', coordinate.accuracy);
    return;
  }

  // Add waypoint to session
  session.coordinates.push(coordinate);
  activeSessions.set(sessionId, session);

  // Store in localStorage as backup (for offline support)
  saveSessionToLocalStorage(sessionId, session);
}

/**
 * Get active tracking session
 * @returns Active session or null
 */
export async function getActiveSession(): Promise<GPSTrackingSession | null> {
  if (!currentSessionId) {
    return null;
  }

  const session = activeSessions.get(currentSessionId);
  return session || null;
}

/**
 * Get session by ID
 * @param sessionId Session ID
 * @returns Session or null
 */
export function getSession(sessionId: string): GPSTrackingSession | null {
  return activeSessions.get(sessionId) || null;
}

/**
 * Get current GPS position (single reading)
 * @returns Current GPS coordinate
 */
export async function getCurrentPosition(): Promise<GPSCoordinate> {
  return await getGeoPosition(getHighAccuracyOptions());
}

/**
 * Watch GPS position continuously
 * @param callback Function to call on position update
 * @returns Watch ID
 */
export function watchPosition(callback: (coord: GPSCoordinate) => void): number {
  return watchGeoPosition(callback, undefined, getHighAccuracyOptions());
}

/**
 * Clear GPS watch
 * @param watchId Watch ID to clear
 */
export function clearWatch(watchId: number): void {
  clearGeoWatch(watchId);
}

/**
 * Clear session from memory
 * @param sessionId Session ID to clear
 */
export function clearSession(sessionId: string): void {
  activeSessions.delete(sessionId);
  if (currentSessionId === sessionId) {
    currentSessionId = null;
  }
  localStorage.removeItem(`gps_session_${sessionId}`);
}

/**
 * Save session to localStorage for offline support
 */
function saveSessionToLocalStorage(sessionId: string, session: GPSTrackingSession): void {
  try {
    const sessionData = {
      sessionId: session.sessionId,
      startTime: session.startTime.toISOString(),
      coordinates: session.coordinates,
      isActive: session.isActive,
      isPaused: session.isPaused,
    };
    localStorage.setItem(`gps_session_${sessionId}`, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

/**
 * Load session from localStorage
 */
export function loadSessionFromLocalStorage(sessionId: string): GPSTrackingSession | null {
  try {
    const data = localStorage.getItem(`gps_session_${sessionId}`);
    if (!data) return null;

    const sessionData = JSON.parse(data);
    const session: GPSTrackingSession = {
      sessionId: sessionData.sessionId,
      startTime: new Date(sessionData.startTime),
      coordinates: sessionData.coordinates,
      isActive: sessionData.isActive,
      isPaused: sessionData.isPaused,
    };

    return session;
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
    return null;
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `gps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all stored session IDs from localStorage
 */
export function getStoredSessionIds(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('gps_session_')) {
      keys.push(key.replace('gps_session_', ''));
    }
  }
  return keys;
}

/**
 * Check if there's an active tracking session
 */
export function hasActiveSession(): boolean {
  return currentSessionId !== null;
}
