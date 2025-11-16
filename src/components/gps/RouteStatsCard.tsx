/**
 * RouteStatsCard Component
 * Displays comprehensive route statistics
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Route,
  Clock,
  Gauge,
  Mountain,
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
} from 'lucide-react';
import { formatDistance, formatDuration, metersToKilometers } from '@/utils/geomath';
import type { RouteStats } from '@/services/gps/routeAnalysis';

interface RouteStatsCardProps {
  stats: RouteStats;
  className?: string;
  compareWithPR?: {
    distance: number;
    time: number;
    pace: string;
  };
}

export function RouteStatsCard({ stats, className = '', compareWithPR }: RouteStatsCardProps) {
  const distanceKm = metersToKilometers(stats.totalDistance);
  const isFasterThanPR = compareWithPR
    ? paceToSeconds(stats.averagePace) < paceToSeconds(compareWithPR.pace)
    : false;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold mb-2">Route Summary</h3>
          {compareWithPR && (
            <Badge variant={isFasterThanPR ? 'default' : 'secondary'} className="mb-2">
              {isFasterThanPR ? (
                <>
                  <Award className="h-3 w-3 mr-1" />
                  New Personal Record!
                </>
              ) : (
                'Compare with PR'
              )}
            </Badge>
          )}
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            icon={<Route className="h-5 w-5" />}
            label="Distance"
            value={`${distanceKm.toFixed(2)} km`}
            color="blue"
          />
          <StatItem
            icon={<Clock className="h-5 w-5" />}
            label="Time"
            value={formatDuration(stats.totalTime)}
            color="green"
          />
          <StatItem
            icon={<Gauge className="h-5 w-5" />}
            label="Avg Pace"
            value={`${stats.averagePace}/km`}
            color="purple"
            comparison={
              compareWithPR && isFasterThanPR ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Faster!
                </span>
              ) : undefined
            }
          />
          <StatItem
            icon={<Flame className="h-5 w-5" />}
            label="Calories"
            value={stats.calories.toString()}
            color="orange"
          />
        </div>

        {/* Elevation Stats */}
        {(stats.elevationGain > 0 || stats.elevationLoss > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <StatItem
              icon={<Mountain className="h-5 w-5 text-green-600" />}
              label="Elevation Gain"
              value={`${stats.elevationGain.toFixed(0)} m`}
              color="green"
              small
            />
            <StatItem
              icon={<TrendingDown className="h-5 w-5 text-red-600" />}
              label="Elevation Loss"
              value={`${stats.elevationLoss.toFixed(0)} m`}
              color="red"
              small
            />
          </div>
        )}

        {/* Speed Stats */}
        {stats.maxSpeed > 0 && (
          <div className="pt-4 border-t">
            <StatItem
              icon={<Gauge className="h-5 w-5" />}
              label="Max Speed"
              value={`${stats.maxSpeed.toFixed(1)} km/h`}
              color="blue"
              small
            />
          </div>
        )}

        {/* Best Split */}
        {stats.splits.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Best Split</p>
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <span className="text-sm">
                Kilometer {stats.splits.reduce((best, split, idx) => {
                  return paceToSeconds(split.pace) < paceToSeconds(stats.splits[best].pace)
                    ? idx
                    : best;
                }, 0) + 1}
              </span>
              <span className="font-mono font-semibold text-green-600">
                {stats.splits.reduce((best, split) => {
                  return paceToSeconds(split.pace) < paceToSeconds(best.pace) ? split : best;
                }).pace}/km
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  small?: boolean;
  comparison?: React.ReactNode;
}

function StatItem({ icon, label, value, color, small = false, comparison }: StatItemProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-950/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-950/20',
  };

  return (
    <div className={small ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <span className={`text-gray-600 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
      </div>
      <div>
        <p className={`font-bold ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
        {comparison}
      </div>
    </div>
  );
}

/**
 * Convert pace string to seconds
 */
function paceToSeconds(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
}
