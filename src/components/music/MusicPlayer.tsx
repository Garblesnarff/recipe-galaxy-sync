/**
 * Music Player Component
 * Full-featured music player with playback controls
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpotify } from '@/hooks/useSpotify';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface MusicPlayerProps {
  compact?: boolean;
  showPlaylist?: boolean;
}

export function MusicPlayer({ compact = false, showPlaylist = true }: MusicPlayerProps) {
  const {
    currentlyPlaying,
    playbackState,
    isPlaying,
    play,
    pause,
    skipNext,
    skipPrevious,
    setVolume,
  } = useSpotify();

  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);

  const track = currentlyPlaying?.item;
  const progress = playbackState?.progress_ms || 0;
  const duration = track?.duration_ms || 0;

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(volume);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Music className="h-5 w-5 mr-2" />
          <span className="text-sm">No track playing</span>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center space-x-3">
          <img
            src={track.album.images[0]?.url}
            alt={track.album.name}
            className="w-12 h-12 rounded"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {track.artists.map((a: any) => a.name).join(', ')}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => (isPlaying ? pause() : play())}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Album Art and Track Info */}
        <div className="flex items-start space-x-4">
          <img
            src={track.album.images[0]?.url}
            alt={track.album.name}
            className="w-20 h-20 rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{track.name}</h3>
            <p className="text-sm text-gray-600 truncate">
              {track.artists.map((a: any) => a.name).join(', ')}
            </p>
            <p className="text-xs text-gray-500 truncate mt-1">
              {track.album.name}
            </p>
          </div>
          {showPlaylist && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPlaylistPanel(!showPlaylistPanel)}
            >
              {showPlaylistPanel ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => skipPrevious()}
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={() => (isPlaying ? pause() : play())}
            className="rounded-full w-12 h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => skipNext()}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className="flex-shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-8 text-right">
            {Math.round(isMuted ? 0 : volume)}%
          </span>
        </div>

        {/* Playlist Panel */}
        {showPlaylist && showPlaylistPanel && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Queue and playlist features coming soon
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
