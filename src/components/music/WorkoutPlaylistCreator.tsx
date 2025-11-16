/**
 * Workout Playlist Creator Component
 * Creates custom workout playlists with track search and recommendations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpotify } from '@/hooks/useSpotify';
import {
  Plus,
  Search,
  Music,
  X,
  GripVertical,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as spotifyService from '@/services/music/spotify';
import { useAuth } from '@/hooks/useAuth';

export function WorkoutPlaylistCreator() {
  const { user } = useAuth();
  const { createPlaylist, isCreatingPlaylist, refetchPlaylists } = useSpotify();

  const [open, setOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    try {
      const results = await spotifyService.searchTracks(user.id, searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Failed to search tracks',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!user) return;

    setShowRecommendations(true);
    try {
      const recs = await spotifyService.getRecommendedWorkoutTracks(
        user.id,
        'high'
      );
      setRecommendations(recs);
    } catch (error) {
      toast({
        title: 'Recommendations Failed',
        description: 'Failed to get recommended tracks',
        variant: 'destructive',
      });
    }
  };

  const addTrack = (track: any) => {
    if (!selectedTracks.find((t) => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const removeTrack = (trackId: string) => {
    setSelectedTracks(selectedTracks.filter((t) => t.id !== trackId));
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a playlist name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTracks.length === 0) {
      toast({
        title: 'Tracks Required',
        description: 'Please add at least one track',
        variant: 'destructive',
      });
      return;
    }

    const trackUris = selectedTracks.map((track) => track.uri);

    createPlaylist(
      {
        name: playlistName,
        trackUris,
        description: 'Created with WorkoutApp',
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPlaylistName('');
          setSelectedTracks([]);
          setSearchResults([]);
          setSearchQuery('');
          refetchPlaylists();
        },
      }
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Workout Playlist</DialogTitle>
          <DialogDescription>
            Search for tracks or get workout recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Playlist Name */}
          <div>
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              placeholder="My Workout Mix"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Tracks</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search for songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGetRecommendations}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Recommended
              </Button>
            </div>
          </div>

          {/* Search Results / Recommendations */}
          {(searchResults.length > 0 || showRecommendations) && (
            <div className="space-y-2">
              <Label>
                {showRecommendations ? 'Recommended Tracks' : 'Search Results'}
              </Label>
              <ScrollArea className="h-48 border rounded-lg p-2">
                {(showRecommendations ? recommendations : searchResults).map(
                  (track: any) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img
                          src={track.album.images[0]?.url}
                          alt={track.album.name}
                          className="w-10 h-10 rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {track.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {track.artists.map((a: any) => a.name).join(', ')}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTrack(track)}
                        disabled={selectedTracks.some((t) => t.id === track.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </ScrollArea>
            </div>
          )}

          {/* Selected Tracks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selected Tracks ({selectedTracks.length})</Label>
              {selectedTracks.length > 0 && (
                <span className="text-xs text-gray-500">
                  Total:{' '}
                  {formatDuration(
                    selectedTracks.reduce(
                      (sum, t) => sum + t.duration_ms,
                      0
                    )
                  )}
                </span>
              )}
            </div>
            <ScrollArea className="h-48 border rounded-lg p-2">
              {selectedTracks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Music className="h-8 w-8 mb-2" />
                  <p className="text-sm">No tracks selected</p>
                </div>
              ) : (
                selectedTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500 w-6">
                      {index + 1}
                    </span>
                    <img
                      src={track.album.images[0]?.url}
                      alt={track.album.name}
                      className="w-10 h-10 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {track.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.artists.map((a: any) => a.name).join(', ')}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDuration(track.duration_ms)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTrack(track.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePlaylist}
            disabled={isCreatingPlaylist || selectedTracks.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreatingPlaylist ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
