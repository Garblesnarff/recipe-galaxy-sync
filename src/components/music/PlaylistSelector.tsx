/**
 * Playlist Selector Component
 * Allows selecting and managing workout playlists
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSpotify } from '@/hooks/useSpotify';
import { useWorkoutPlaylists } from '@/hooks/useMusicPlayer';
import { Music, Clock, Hash, ExternalLink, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PlaylistSelectorProps {
  workoutId?: string;
  onPlaylistSelect?: (playlistId: string) => void;
}

export function PlaylistSelector({
  workoutId,
  onPlaylistSelect,
}: PlaylistSelectorProps) {
  const { playlists, isLoadingPlaylists } = useSpotify();
  const {
    workoutPlaylist,
    linkPlaylist,
    setDefaultPlaylist,
    isLinkingPlaylist,
  } = useWorkoutPlaylists(workoutId);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    workoutPlaylist?.platform_playlist_id || ''
  );
  const [showPreview, setShowPreview] = useState(false);

  const selectedPlaylist = playlists?.find(
    (p: any) => p.id === selectedPlaylistId
  );

  const handlePlaylistChange = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    if (workoutId) {
      linkPlaylist({ playlistId, workoutId });
    }
    onPlaylistSelect?.(playlistId);
  };

  const handleSetDefault = (isDefault: boolean) => {
    if (isDefault && selectedPlaylistId) {
      setDefaultPlaylist(selectedPlaylistId);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="playlist-select" className="text-sm font-medium">
          Select Workout Playlist
        </Label>
        <Select
          value={selectedPlaylistId}
          onValueChange={handlePlaylistChange}
          disabled={isLoadingPlaylists || isLinkingPlaylist}
        >
          <SelectTrigger id="playlist-select" className="mt-1">
            <SelectValue placeholder="Choose a playlist..." />
          </SelectTrigger>
          <SelectContent>
            {playlists?.map((playlist: any) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                <div className="flex items-center space-x-2">
                  {playlist.images?.[0]?.url && (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-6 h-6 rounded"
                    />
                  )}
                  <span>{playlist.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {playlist.tracks.total} tracks
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlaylist && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {selectedPlaylist.images?.[0]?.url && (
                <img
                  src={selectedPlaylist.images[0].url}
                  alt={selectedPlaylist.name}
                  className="w-16 h-16 rounded shadow-sm"
                />
              )}
              <div>
                <h4 className="font-semibold">{selectedPlaylist.name}</h4>
                {selectedPlaylist.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {selectedPlaylist.description}
                  </p>
                )}
              </div>
            </div>
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{selectedPlaylist.name}</DialogTitle>
                  <DialogDescription>
                    {selectedPlaylist.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Track preview not available in this version
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        selectedPlaylist.external_urls.spotify,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Spotify
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              {selectedPlaylist.tracks.total} tracks
            </div>
            {selectedPlaylist.tracks.total > 0 && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                ~{formatDuration(selectedPlaylist.tracks.total * 180000)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Label
              htmlFor="default-playlist"
              className="text-sm flex items-center cursor-pointer"
            >
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Use for all workouts
            </Label>
            <Switch
              id="default-playlist"
              onCheckedChange={handleSetDefault}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              window.open(selectedPlaylist.external_urls.spotify, '_blank')
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </Button>
        </div>
      )}

      {!isLoadingPlaylists && (!playlists || playlists.length === 0) && (
        <div className="text-center py-6 text-gray-500">
          <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No playlists found</p>
          <p className="text-xs mt-1">Create playlists in Spotify first</p>
        </div>
      )}
    </div>
  );
}
