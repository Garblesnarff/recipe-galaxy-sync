/**
 * RouteLibrary Page
 * Browse and manage saved routes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/layout/MainNav';
import { SavedRouteCard } from '@/components/gps/SavedRouteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Plus, TrendingUp, Loader2 } from 'lucide-react';
import {
  useSavedRoutes,
  useDeleteRoute,
  useDuplicateRoute,
  usePopularRoutes,
} from '@/hooks/useRoutes';
import { toast } from 'sonner';

type SortOption = 'recent' | 'distance-asc' | 'distance-desc' | 'completions';
type FilterOption = 'all' | 'easy' | 'moderate' | 'hard';

export default function RouteLibrary() {
  const navigate = useNavigate();
  const { data: myRoutes, isLoading: isLoadingMy } = useSavedRoutes();
  const { data: popularRoutes, isLoading: isLoadingPopular } = usePopularRoutes(10);
  const deleteRouteMutation = useDeleteRoute();
  const duplicateRouteMutation = useDuplicateRoute();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterOption>('all');

  const handleRouteClick = (routeId: string) => {
    navigate(`/routes/${routeId}`);
  };

  const handleStartRoute = (routeId: string) => {
    navigate(`/workouts/gps?route=${routeId}`);
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await deleteRouteMutation.mutateAsync(routeId);
      toast.success('Route deleted successfully');
    } catch (error) {
      toast.error('Failed to delete route');
      console.error('Error deleting route:', error);
    }
  };

  const handleDuplicateRoute = async (routeId: string) => {
    try {
      await duplicateRouteMutation.mutateAsync(routeId);
      toast.success('Route duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate route');
      console.error('Error duplicating route:', error);
    }
  };

  // Filter and sort routes
  const filterAndSortRoutes = (routes: any[] | undefined) => {
    if (!routes) return [];

    let filtered = routes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (route) =>
          route.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((route) => route.difficulty_level === filterDifficulty);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'distance-asc':
          return a.distance_meters - b.distance_meters;
        case 'distance-desc':
          return b.distance_meters - a.distance_meters;
        case 'completions':
          return b.times_completed - a.times_completed;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredMyRoutes = filterAndSortRoutes(myRoutes);

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Route Library</h1>
              <p className="text-gray-600">Browse and manage your saved routes</p>
            </div>
            <Button onClick={() => navigate('/workouts/gps')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Route
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="distance-asc">Distance (Low to High)</SelectItem>
                <SelectItem value="distance-desc">Distance (High to Low)</SelectItem>
                <SelectItem value="completions">Most Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterDifficulty === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDifficulty('all')}
            >
              All
            </Button>
            <Button
              variant={filterDifficulty === 'easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDifficulty('easy')}
            >
              Easy
            </Button>
            <Button
              variant={filterDifficulty === 'moderate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDifficulty('moderate')}
            >
              Moderate
            </Button>
            <Button
              variant={filterDifficulty === 'hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterDifficulty('hard')}
            >
              Hard
            </Button>
          </div>

          {/* Routes Tabs */}
          <Tabs defaultValue="my-routes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="my-routes">My Routes</TabsTrigger>
              <TabsTrigger value="popular">
                <TrendingUp className="h-4 w-4 mr-2" />
                Popular
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-routes" className="space-y-6">
              {isLoadingMy ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredMyRoutes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMyRoutes.map((route) => (
                    <SavedRouteCard
                      key={route.id}
                      route={route}
                      onClick={() => handleRouteClick(route.id)}
                      onStart={() => handleStartRoute(route.id)}
                      onDelete={() => handleDeleteRoute(route.id)}
                      onDuplicate={() => handleDuplicateRoute(route.id)}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    No routes found. Complete a GPS workout to save your first route!
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              {isLoadingPopular ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : popularRoutes && popularRoutes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {popularRoutes.map((route) => (
                    <SavedRouteCard
                      key={route.id}
                      route={route}
                      onClick={() => handleRouteClick(route.id)}
                      onStart={() => handleStartRoute(route.id)}
                      onDuplicate={() => handleDuplicateRoute(route.id)}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>No popular routes available yet.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
