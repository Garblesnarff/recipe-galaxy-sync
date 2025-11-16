/**
 * LiveGPSTracker Component
 * Real-time GPS tracking display with live stats and map
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  Square,
  Navigation,
  Gauge,
  Route,
  Clock,
  Flame,
  Battery,
  Signal,
} from 'lucide-react';
import { GPSMap } from './GPSMap';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { calculateDistance, calculatePace } from '@/services/gps/routeAnalysis';
import { formatDuration, getSignalStrength } from '@/lib/geolocation';
import type { GPSCoordinate } from '@/utils/geomath';

interface LiveGPSTrackerProps {
  onComplete?: (sessionId: string) => void;
  className?: string;
}

export function LiveGPSTracker({ onComplete, className = '' }: LiveGPSTrackerProps) {
  const { session, isTracking, isPaused, pauseTracking, resumeTracking, stopTracking } =
    useGPSTracking();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState('0:00');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [calories, setCalories] = useState(0);
  const [signalStrength, setSignalStrength] = useState<'excellent' | 'good' | 'fair' | 'poor'>(
    'good'
  );

  // Update elapsed time
  useEffect(() => {
    if (!isTracking || isPaused || !session) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - session.startTime.getTime()) / 1000;
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, isPaused, session]);

  // Update stats from session coordinates
  useEffect(() => {
    if (!session || session.coordinates.length === 0) return;

    // Calculate distance
    const distance = calculateDistance(session.coordinates);
    setCurrentDistance(distance);

    // Calculate pace
    const pace = calculatePace(distance, elapsedTime);
    setCurrentPace(pace);

    // Get current speed from latest coordinate
    const latestCoord = session.coordinates[session.coordinates.length - 1];
    if (latestCoord.speed !== undefined) {
      const speedKmh = (latestCoord.speed * 3600) / 1000;
      setCurrentSpeed(speedKmh);
    }

    // Update signal strength
    setSignalStrength(getSignalStrength(latestCoord.accuracy));

    // Estimate calories (rough estimate: 70 cal per km for running)
    const distanceKm = distance / 1000;
    setCalories(Math.round(distanceKm * 70));
  }, [session, elapsedTime]);

  const handlePauseResume = () => {
    if (isPaused) {
      resumeTracking();
    } else {
      pauseTracking();
    }
  };

  const handleStop = () => {
    if (session) {
      stopTracking();
      onComplete?.(session.sessionId);
    }
  };

  if (!isTracking || !session) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">GPS Tracking Not Active</p>
          <p className="text-sm">Start a GPS workout to begin tracking</p>
        </div>
      </Card>
    );
  }

  const mapCoordinates = session.coordinates.map((c) => ({
    lat: c.latitude,
    lng: c.longitude,
  }));

  const currentLocation =
    session.coordinates.length > 0
      ? {
          lat: session.coordinates[session.coordinates.length - 1].latitude,
          lng: session.coordinates[session.coordinates.length - 1].longitude,
        }
      : undefined;

  const signalColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Alerts */}
      {isPaused && (
        <Alert>
          <Pause className="h-4 w-4" />
          <AlertDescription>Tracking paused. Resume to continue recording.</AlertDescription>
        </Alert>
      )}

      {signalStrength === 'poor' && (
        <Alert variant="destructive">
          <Signal className="h-4 w-4" />
          <AlertDescription>
            Poor GPS signal. Move to an area with better sky visibility.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LiveStat
            icon={<Route className="h-5 w-5" />}
            label="Distance"
            value={`${(currentDistance / 1000).toFixed(2)} km`}
            color="blue"
          />
          <LiveStat
            icon={<Clock className="h-5 w-5" />}
            label="Time"
            value={formatDuration(elapsedTime)}
            color="green"
          />
          <LiveStat
            icon={<Gauge className="h-5 w-5" />}
            label="Current Pace"
            value={`${currentPace}/km`}
            color="purple"
          />
          <LiveStat
            icon={<Flame className="h-5 w-5" />}
            label="Calories"
            value={calories.toString()}
            color="orange"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current Speed</p>
            <p className="text-lg font-semibold">{currentSpeed.toFixed(1)} km/h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">GPS Signal</p>
            <div className="flex items-center justify-center gap-2">
              <div className={`h-3 w-3 rounded-full ${signalColors[signalStrength]}`} />
              <span className="text-sm font-medium capitalize">{signalStrength}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Waypoints</p>
            <p className="text-lg font-semibold">{session.coordinates.length}</p>
          </div>
        </div>
      </Card>

      {/* Live Map */}
      <GPSMap
        coordinates={mapCoordinates}
        currentLocation={currentLocation}
        interactive={true}
        height="400px"
      />

      {/* Control Buttons */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Button
            onClick={handlePauseResume}
            variant={isPaused ? 'default' : 'outline'}
            className="flex-1"
            size="lg"
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button onClick={handleStop} variant="destructive" className="flex-1" size="lg">
            <Square className="h-5 w-5 mr-2" />
            Finish
          </Button>
        </div>

        {/* Battery Warning */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Battery className="h-4 w-4" />
          <span>High accuracy GPS tracking may drain battery faster</span>
        </div>
      </Card>
    </div>
  );
}

interface LiveStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function LiveStat({ icon, label, value, color }: LiveStatProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-950/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
  };

  return (
    <div className="text-center">
      <div className={`inline-flex p-3 rounded-lg mb-2 ${colorClasses[color]}`}>{icon}</div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
