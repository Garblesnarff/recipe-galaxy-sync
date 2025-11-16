/**
 * Health Platform API Clients
 *
 * Utilities for interacting with health platform REST APIs
 */

import { isTokenExpired, decryptToken } from './oauth';

/**
 * Google Fit API Client
 */
export class GoogleFitApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`https://www.googleapis.com/fitness/v1/users/me${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDataSources() {
    return this.request('/dataSources');
  }

  async getSessions(startTime: number, endTime: number) {
    return this.request(`/sessions?startTime=${startTime}&endTime=${endTime}`);
  }

  async getActivitySegments(startTime: number, endTime: number) {
    const body = {
      aggregateBy: [{
        dataTypeName: 'com.google.activity.segment',
      }],
      bucketByTime: { durationMillis: 86400000 }, // 1 day
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    return this.request('/dataset:aggregate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getSteps(startTime: number, endTime: number) {
    const body = {
      aggregateBy: [{
        dataTypeName: 'com.google.step_count.delta',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      }],
      bucketByTime: { durationMillis: 86400000 }, // 1 day
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    return this.request('/dataset:aggregate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getCalories(startTime: number, endTime: number) {
    const body = {
      aggregateBy: [{
        dataTypeName: 'com.google.calories.expended',
      }],
      bucketByTime: { durationMillis: 86400000 }, // 1 day
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    return this.request('/dataset:aggregate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getHeartRate(startTime: number, endTime: number) {
    const body = {
      aggregateBy: [{
        dataTypeName: 'com.google.heart_rate.bpm',
      }],
      bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
      startTimeMillis: startTime,
      endTimeMillis: endTime,
    };

    return this.request('/dataset:aggregate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createSession(session: {
    name: string;
    description?: string;
    startTimeMillis: number;
    endTimeMillis: number;
    activityType: number;
    application?: {
      packageName: string;
      version?: string;
    };
  }) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }
}

/**
 * Data transformation utilities
 */

/**
 * Map workout type from app to Google Fit activity type
 */
export function mapWorkoutTypeToGoogleFit(workoutType: string): number {
  const mapping: Record<string, number> = {
    'running': 8,
    'cycling': 1,
    'walking': 7,
    'swimming': 82,
    'strength': 97,
    'yoga': 122,
    'hiit': 79,
    'cardio': 9,
    'crossfit': 113,
    'boxing': 31,
    'dancing': 35,
    'hiking': 58,
    'rowing': 83,
    'elliptical': 25,
    'stair_climbing': 85,
  };

  const normalized = workoutType.toLowerCase().replace(/\s+/g, '_');
  return mapping[normalized] || 108; // Default to "Other"
}

/**
 * Map Google Fit activity type to app workout type
 */
export function mapGoogleFitActivityType(activityType: number): string {
  const mapping: Record<number, string> = {
    1: 'Cycling',
    7: 'Walking',
    8: 'Running',
    9: 'Cardio',
    25: 'Elliptical',
    31: 'Boxing',
    35: 'Dancing',
    58: 'Hiking',
    79: 'HIIT',
    82: 'Swimming',
    83: 'Rowing',
    85: 'Stair Climbing',
    97: 'Strength',
    113: 'CrossFit',
    122: 'Yoga',
  };

  return mapping[activityType] || 'Other';
}

/**
 * Map workout type from app to Apple Health workout type
 */
export function mapWorkoutTypeToAppleHealth(workoutType: string): string {
  const mapping: Record<string, string> = {
    'running': 'HKWorkoutActivityTypeRunning',
    'cycling': 'HKWorkoutActivityTypeCycling',
    'walking': 'HKWorkoutActivityTypeWalking',
    'swimming': 'HKWorkoutActivityTypeSwimming',
    'strength': 'HKWorkoutActivityTypeFunctionalStrengthTraining',
    'yoga': 'HKWorkoutActivityTypeYoga',
    'hiit': 'HKWorkoutActivityTypeHighIntensityIntervalTraining',
    'cardio': 'HKWorkoutActivityTypeCardioTraining',
    'crossfit': 'HKWorkoutActivityTypeCrossFit',
    'boxing': 'HKWorkoutActivityTypeBoxing',
    'dancing': 'HKWorkoutActivityTypeDance',
    'hiking': 'HKWorkoutActivityTypeHiking',
    'rowing': 'HKWorkoutActivityTypeRowing',
    'elliptical': 'HKWorkoutActivityTypeElliptical',
    'stair_climbing': 'HKWorkoutActivityTypeStairClimbing',
  };

  const normalized = workoutType.toLowerCase().replace(/\s+/g, '_');
  return mapping[normalized] || 'HKWorkoutActivityTypeOther';
}

/**
 * Calculate heart rate zones
 */
export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  color: string;
}

export function calculateHeartRateZones(maxHeartRate: number): HeartRateZone[] {
  return [
    {
      name: 'Rest',
      min: 0,
      max: Math.round(maxHeartRate * 0.5),
      color: '#93c5fd', // blue
    },
    {
      name: 'Fat Burn',
      min: Math.round(maxHeartRate * 0.5),
      max: Math.round(maxHeartRate * 0.7),
      color: '#86efac', // green
    },
    {
      name: 'Cardio',
      min: Math.round(maxHeartRate * 0.7),
      max: Math.round(maxHeartRate * 0.85),
      color: '#fde047', // yellow
    },
    {
      name: 'Peak',
      min: Math.round(maxHeartRate * 0.85),
      max: maxHeartRate,
      color: '#f87171', // red
    },
  ];
}

/**
 * Get heart rate zone for a given heart rate
 */
export function getHeartRateZone(heartRate: number, zones: HeartRateZone[]): HeartRateZone | null {
  return zones.find(zone => heartRate >= zone.min && heartRate <= zone.max) || null;
}

/**
 * Calculate average heart rate
 */
export function calculateAverageHeartRate(heartRateData: number[]): number {
  if (heartRateData.length === 0) return 0;
  const sum = heartRateData.reduce((acc, hr) => acc + hr, 0);
  return Math.round(sum / heartRateData.length);
}

/**
 * Calculate time in each heart rate zone
 */
export function calculateTimeInZones(
  heartRateData: number[],
  zones: HeartRateZone[],
  samplingInterval: number = 1 // seconds per sample
): Record<string, number> {
  const timeInZones: Record<string, number> = {};

  zones.forEach(zone => {
    timeInZones[zone.name] = 0;
  });

  heartRateData.forEach(hr => {
    const zone = getHeartRateZone(hr, zones);
    if (zone) {
      timeInZones[zone.name] += samplingInterval;
    }
  });

  return timeInZones;
}

/**
 * Error handling utilities
 */

export class HealthApiError extends Error {
  constructor(
    message: string,
    public platform: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'HealthApiError';
  }
}

export function handleHealthApiError(error: any, platform: string): HealthApiError {
  if (error instanceof HealthApiError) {
    return error;
  }

  let message = 'An unknown error occurred';
  let statusCode: number | undefined;

  if (error instanceof Error) {
    message = error.message;
  }

  if (error.response) {
    statusCode = error.response.status;
    message = error.response.data?.error?.message || error.response.statusText;
  }

  return new HealthApiError(message, platform, statusCode, error);
}
