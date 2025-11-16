/**
 * RouteDetail Page
 * Display detailed information about a saved route
 */

import { useParams, useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/layout/MainNav';
import { GPSMap } from '@/components/gps/GPSMap';
import { ElevationChart } from '@/components/gps/ElevationChart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Route,
  Mountain,
  TrendingUp,
  Clock,
  Calendar,
} from 'lucide-react';
import { useSavedRoute, useRouteCompletions, useDeleteRoute } from '@/hooks/useRoutes';
import { decodePolyline } from '@/lib/polyline';
import { formatDistance } from '@/utils/geomath';
import { toast } from 'sonner';

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: route, isLoading: isLoadingRoute } = useSavedRoute(id);
  const { data: completions, isLoading: isLoadingCompletions } = useRouteCompletions(id);
  const deleteRouteMutation = useDeleteRoute();

  const handleStartWorkout = () => {
    navigate(`/workouts/gps?route=${id}`);
  };

  const handleEdit = () => {
    // Navigate to edit page (to be implemented)
    toast.info('Edit functionality coming soon');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await deleteRouteMutation.mutateAsync(id!);
      toast.success('Route deleted successfully');
      navigate('/routes');
    } catch (error) {
      toast.error('Failed to delete route');
      console.error('Error deleting route:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: route?.route_name,
          text: `Check out my route: ${route?.route_name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoadingRoute) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  if (!route) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Route Not Found</h2>
            <p className="text-gray-600 mb-4">The route you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/routes')}>Back to Routes</Button>
          </Card>
        </div>
      </>
    );
  }

  // Decode polyline
  const coordinates = decodePolyline(route.route_polyline);

  // Prepare elevation data (simplified - in reality would need actual elevation data)
  const elevationData = coordinates.map((coord, index) => ({
    distance: (index / coordinates.length) * route.distance_meters,
    elevation: 100 + Math.sin(index / 10) * 50, // Mock elevation data
  }));

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{route.route_name}</h1>
              {route.description && (
                <p className="text-gray-600 mb-4">{route.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {route.difficulty_level && (
                  <Badge className={difficultyColors[route.difficulty_level]}>
                    {route.difficulty_level}
                  </Badge>
                )}
                {route.terrain_type && (
                  <Badge variant="outline">{route.terrain_type}</Badge>
                )}
                {route.is_public && <Badge variant="secondary">Public</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Route className="h-5 w-5" />}
              label="Distance"
              value={formatDistance(route.distance_meters)}
            />
            <StatCard
              icon={<Mountain className="h-5 w-5" />}
              label="Elevation Gain"
              value={`${route.elevation_gain_meters.toFixed(0)} m`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Times Completed"
              value={route.times_completed.toString()}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Avg Time"
              value={route.average_completion_time || 'N/A'}
            />
          </div>

          {/* Start Workout Button */}
          <Button onClick={handleStartWorkout} size="lg" className="w-full">
            <Play className="h-5 w-5 mr-2" />
            Start This Route
          </Button>

          {/* Map */}
          <GPSMap coordinates={coordinates} interactive={true} height="500px" />

          {/* Elevation Chart */}
          <ElevationChart data={elevationData} />

          {/* Previous Completions */}
          {!isLoadingCompletions && completions && completions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Previous Completions</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Pace</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completions.slice(0, 10).map((completion: any) => (
                      <TableRow key={completion.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(completion.completed_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {completion.completion_time}
                        </TableCell>
                        <TableCell className="font-mono">
                          {completion.average_pace || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Route Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Route Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{new Date(route.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span>{new Date(route.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="text-blue-600">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
