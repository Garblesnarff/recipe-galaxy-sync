/**
 * SplitsTable Component
 * Displays pace splits per kilometer
 */

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Timer, TrendingUp, TrendingDown } from 'lucide-react';
import type { Split } from '@/services/gps/routeAnalysis';

interface SplitsTableProps {
  splits: Split[];
  className?: string;
}

export function SplitsTable({ splits, className = '' }: SplitsTableProps) {
  if (!splits || splits.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Timer className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No split data available</p>
        </div>
      </Card>
    );
  }

  // Calculate average pace
  const paceSeconds = splits.map((split) => paceToSeconds(split.pace));
  const avgPaceSeconds = paceSeconds.reduce((a, b) => a + b, 0) / paceSeconds.length;

  // Find fastest split
  const fastestSplitIndex = paceSeconds.indexOf(Math.min(...paceSeconds));

  return (
    <Card className={`${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pace Splits</h3>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Km</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Pace</TableHead>
                <TableHead className="text-right">Elevation</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((split, index) => {
                const splitPaceSeconds = paceToSeconds(split.pace);
                const isFaster = splitPaceSeconds < avgPaceSeconds;
                const isFastest = index === fastestSplitIndex;

                return (
                  <TableRow
                    key={index}
                    className={isFastest ? 'bg-green-50 dark:bg-green-950/20' : ''}
                  >
                    <TableCell className="font-medium">
                      {split.km}
                      {isFastest && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-100">
                          Best
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{(split.distance / 1000).toFixed(2)} km</TableCell>
                    <TableCell className="font-mono">{split.time}</TableCell>
                    <TableCell className="font-mono font-medium">{split.pace}/km</TableCell>
                    <TableCell className="text-right">
                      {split.elevationGain > 0 && (
                        <span className="text-green-600">+{split.elevationGain.toFixed(0)}m</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isFaster ? (
                        <div className="flex items-center justify-end gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">Faster</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-orange-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs">Slower</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Average pace: <span className="font-mono font-medium">{secondsToPace(avgPaceSeconds)}/km</span></span>
          <span>Total splits: {splits.length}</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Convert pace string to seconds
 */
function paceToSeconds(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to pace string
 */
function secondsToPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
