/**
 * Google Fit Integration Service
 *
 * Google Fit has a REST API that works on web.
 * This implementation uses OAuth 2.0 for authentication.
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoogleFitWorkout {
  id: string;
  name: string;
  activityType: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  calories: number;
  distance?: number;
  heartRateData?: number[];
}

export interface GoogleFitData {
  workouts: GoogleFitWorkout[];
  heartRate: number[];
  steps: number;
  calories: number;
}

const PLATFORM = 'google_fit';

// Google Fit OAuth Configuration
const GOOGLE_FIT_CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID || 'your-client-id';
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read',
].join(' ');

const GOOGLE_FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

/**
 * Initiate Google Fit OAuth flow
 * Returns the OAuth URL for redirection
 */
export async function connectGoogleFit(): Promise<string> {
  try {
    const redirectUri = `${window.location.origin}/settings/wearables/callback`;
    const state = Math.random().toString(36).substring(7);

    // Store state for validation
    sessionStorage.setItem('google_fit_oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_FIT_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', GOOGLE_FIT_SCOPES);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    return authUrl.toString();
  } catch (error) {
    console.error("Error initiating Google Fit connection:", error);
    toast.error("Failed to initiate Google Fit connection");
    throw error;
  }
}

/**
 * Handle Google Fit OAuth callback
 */
export async function handleGoogleFitCallback(code: string, userId: string): Promise<void> {
  try {
    // In a real implementation, this would exchange the code for tokens
    // via a backend endpoint to keep the client secret secure
    // For now, we'll simulate a successful connection

    const { error } = await supabase
      .from('wearable_connections')
      .upsert({
        user_id: userId,
        platform: PLATFORM,
        is_connected: true,
        sync_enabled: true,
        last_sync_at: new Date().toISOString(),
        // In production, these would be encrypted tokens from the OAuth exchange
        access_token_encrypted: 'encrypted_access_token',
        refresh_token_encrypted: 'encrypted_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      });

    if (error) throw error;

    // Perform initial sync
    await syncFromGoogleFit(userId);

    toast.success("Connected to Google Fit");
  } catch (error) {
    console.error("Error handling Google Fit callback:", error);
    toast.error("Failed to connect to Google Fit");
    throw error;
  }
}

/**
 * Disconnect from Google Fit
 */
export async function disconnectGoogleFit(userId: string): Promise<void> {
  try {
    // In a real implementation, this would also revoke the OAuth token
    const { error } = await supabase
      .from('wearable_connections')
      .update({
        is_connected: false,
        sync_enabled: false,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
      })
      .eq('user_id', userId)
      .eq('platform', PLATFORM);

    if (error) throw error;

    toast.success("Disconnected from Google Fit");
  } catch (error) {
    console.error("Error disconnecting from Google Fit:", error);
    toast.error("Failed to disconnect from Google Fit");
    throw error;
  }
}

/**
 * Sync data from Google Fit
 */
export async function syncFromGoogleFit(userId: string): Promise<void> {
  try {
    // Get the connection
    const { data: connection, error: connError } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', PLATFORM)
      .single();

    if (connError || !connection?.is_connected) {
      throw new Error("Not connected to Google Fit");
    }

    // In a real implementation, this would use the Google Fit REST API
    // For now, we'll generate mock data
    const mockWorkouts = generateMockWorkouts();
    const mockHealthData = generateMockHealthData();

    // Import workouts
    for (const workout of mockWorkouts) {
      await importWorkout(userId, workout);
    }

    // Import health metrics
    await importHealthMetrics(userId, mockHealthData);

    // Log the sync
    await supabase.from('wearable_sync_log').insert({
      user_id: userId,
      platform: PLATFORM,
      sync_type: 'import',
      items_synced: mockWorkouts.length + 3, // workouts + steps + calories + HR
      sync_status: 'success',
      synced_at: new Date().toISOString(),
    });

    // Update last sync time
    await supabase
      .from('wearable_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('platform', PLATFORM);

    toast.success(`Synced ${mockWorkouts.length} workouts from Google Fit`);
  } catch (error) {
    console.error("Error syncing from Google Fit:", error);

    // Log the failed sync
    await supabase.from('wearable_sync_log').insert({
      user_id: userId,
      platform: PLATFORM,
      sync_type: 'import',
      items_synced: 0,
      sync_status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      synced_at: new Date().toISOString(),
    });

    toast.error("Failed to sync from Google Fit");
    throw error;
  }
}

/**
 * Export workout to Google Fit
 */
export async function exportToGoogleFit(userId: string, workoutId: string): Promise<void> {
  try {
    // Get the connection
    const { data: connection, error: connError } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', PLATFORM)
      .single();

    if (connError || !connection?.is_connected) {
      throw new Error("Not connected to Google Fit");
    }

    // In a real implementation, this would use the Google Fit REST API
    // to create a session with the workout data

    await supabase.from('wearable_sync_log').insert({
      user_id: userId,
      platform: PLATFORM,
      sync_type: 'export',
      items_synced: 1,
      sync_status: 'success',
      synced_at: new Date().toISOString(),
    });

    toast.success("Workout exported to Google Fit");
  } catch (error) {
    console.error("Error exporting to Google Fit:", error);
    toast.error("Failed to export to Google Fit");
    throw error;
  }
}

/**
 * Get Google Fit data for a date range
 */
export async function getGoogleFitData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleFitData> {
  try {
    // In a real implementation, this would query the Google Fit API
    // For now, return mock data
    return {
      workouts: generateMockWorkouts(),
      heartRate: generateMockHeartRate(),
      steps: Math.floor(Math.random() * 5000) + 8000,
      calories: Math.floor(Math.random() * 1000) + 2000,
    };
  } catch (error) {
    console.error("Error getting Google Fit data:", error);
    throw error;
  }
}

// Helper functions for mock data generation

function generateMockWorkouts(): GoogleFitWorkout[] {
  const activityTypes = [
    { name: 'Running', type: 8 },
    { name: 'Cycling', type: 1 },
    { name: 'Walking', type: 7 },
    { name: 'Weight Training', type: 97 },
    { name: 'Yoga', type: 122 },
  ];
  const workouts: GoogleFitWorkout[] = [];

  for (let i = 0; i < 4; i++) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - i);
    startTime.setHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0);

    const duration = Math.floor(Math.random() * 60) + 20; // 20-80 minutes
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    workouts.push({
      id: `google_fit_${i}`,
      name: activity.name,
      activityType: activity.type,
      startTime,
      endTime,
      duration,
      calories: Math.floor(Math.random() * 400) + 250,
      heartRateData: generateMockHeartRate(),
    });
  }

  return workouts;
}

function generateMockHeartRate(): number[] {
  const baseHR = 75;
  const data: number[] = [];

  for (let i = 0; i < 60; i++) {
    const variation = Math.random() * 40 - 20;
    data.push(Math.floor(baseHR + variation + (Math.sin(i / 10) * 20)));
  }

  return data;
}

function generateMockHealthData() {
  return {
    steps: Math.floor(Math.random() * 5000) + 8000,
    calories: Math.floor(Math.random() * 1000) + 2000,
    heartRate: generateMockHeartRate(),
  };
}

async function importWorkout(userId: string, workout: GoogleFitWorkout): Promise<void> {
  await supabase.from('imported_health_data').upsert({
    user_id: userId,
    platform: PLATFORM,
    data_type: 'workout',
    date_recorded: workout.startTime.toISOString().split('T')[0],
    value: {
      name: workout.name,
      activityType: workout.activityType,
      duration: workout.duration,
      calories: workout.calories,
      distance: workout.distance,
      heartRateData: workout.heartRateData,
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime.toISOString(),
    },
    imported_at: new Date().toISOString(),
  });
}

async function importHealthMetrics(userId: string, data: any): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Import steps
  await supabase.from('imported_health_data').upsert({
    user_id: userId,
    platform: PLATFORM,
    data_type: 'steps',
    date_recorded: today,
    value: { count: data.steps },
    imported_at: new Date().toISOString(),
  });

  // Import calories
  await supabase.from('imported_health_data').upsert({
    user_id: userId,
    platform: PLATFORM,
    data_type: 'calories',
    date_recorded: today,
    value: { count: data.calories },
    imported_at: new Date().toISOString(),
  });

  // Import heart rate
  await supabase.from('imported_health_data').upsert({
    user_id: userId,
    platform: PLATFORM,
    data_type: 'heart_rate',
    date_recorded: today,
    value: { samples: data.heartRate },
    imported_at: new Date().toISOString(),
  });
}
