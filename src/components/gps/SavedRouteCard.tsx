/**
 * SavedRouteCard Component
 * Displays a saved route with actions
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Route,
  Mountain,
  Clock,
  MapPin,
  Play,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { metersToKilometers } from '@/utils/geomath';
import type { SavedRoute } from '@/services/gps/savedRoutes';

interface SavedRouteCardProps {
  route: SavedRoute;
  onStart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onClick?: () => void;
  className?: string;
}

export function SavedRouteCard({
  route,
  onStart,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
  className = '',
}: SavedRouteCardProps) {
  const distanceKm = metersToKilometers(route.distance_meters);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  };

  const terrainIcons = {
    road: '🚴',
    trail: '🥾',
    mixed: '🏃',
  };

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold line-clamp-1">{route.route_name}</h3>
              {route.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
            {route.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{route.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBadge icon={<Route />} label="Distance" value={`${distanceKm.toFixed(2)} km`} />
          <StatBadge
            icon={<Mountain />}
            label="Elevation"
            value={`${route.elevation_gain_meters.toFixed(0)} m`}
          />
          <StatBadge
            icon={<TrendingUp />}
            label="Completed"
            value={`${route.times_completed}x`}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {route.difficulty_level && (
            <Badge className={difficultyColors[route.difficulty_level]}>
              {route.difficulty_level}
            </Badge>
          )}
          {route.terrain_type && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>{terrainIcons[route.terrain_type]}</span>
              {route.terrain_type}
            </Badge>
          )}
          {route.average_completion_time && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Avg: {formatInterval(route.average_completion_time)}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {onStart && (
          <div className="pt-4 border-t">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start This Route
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatBadge({ icon, label, value }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

/**
 * Format PostgreSQL interval to readable string
 */
function formatInterval(interval: string): string {
  // Simple parser for intervals
  if (interval.includes(':')) {
    const parts = interval.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
  }
  return interval;
}
