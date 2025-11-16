/**
 * Now Playing Widget Component
 * Minimal music player widget for the ActiveWorkout page
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSpotify } from '@/hooks/useSpotify';
import { Play, Pause, Music, Maximize2, Minimize2 } from 'lucide-react';
import { MusicPlayer } from './MusicPlayer';

export function NowPlayingWidget() {
  const { currentlyPlaying, isPlaying, play, pause, isConnected } =
    useSpotify();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isConnected) {
    return null;
  }

  const track = currentlyPlaying?.item;

  if (!track && !isExpanded) {
    return (
      <Card className="p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-500">
            <Music className="h-4 w-4" />
            <span className="text-sm">No music playing</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (isExpanded) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Now Playing</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
        <MusicPlayer compact={false} showPlaylist={false} />
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="flex items-center space-x-3">
        {/* Album Art */}
        <img
          src={track.album.images[0]?.url}
          alt={track.album.name}
          className="w-12 h-12 rounded shadow-sm"
        />

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.name}</p>
          <p className="text-xs text-gray-600 truncate">
            {track.artists.map((a: any) => a.name).join(', ')}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (isPlaying ? pause() : play())}
            className="bg-white"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-green-600 h-1 rounded-full transition-all"
            style={{
              width: `${
                (currentlyPlaying?.progress_ms / track.duration_ms) * 100
              }%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
}
