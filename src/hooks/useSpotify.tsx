/**
 * Spotify Integration Hook
 * Manages Spotify connection and playback using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import * as spotifyService from '@/services/music/spotify';
import * as playbackControl from '@/services/music/playbackControl';
import { toast } from '@/hooks/use-toast';

export function useSpotify() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  // Check if Spotify is connected
  const { data: isConnected, isLoading: isCheckingConnection } = useQuery({
    queryKey: ['spotify', 'connection', userId],
    queryFn: () => spotifyService.isSpotifyConnected(userId),
    enabled: !!userId,
  });

  // Get connection details
  const { data: connection } = useQuery({
    queryKey: ['spotify', 'connectionDetails', userId],
    queryFn: () => spotifyService.getSpotifyConnection(userId),
    enabled: !!userId && !!isConnected,
  });

  // Get user's playlists
  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ['spotify', 'playlists', userId],
    queryFn: () => spotifyService.getUserPlaylists(userId),
    enabled: !!userId && !!isConnected,
  });

  // Get currently playing
  const { data: currentlyPlaying, refetch: refetchCurrentlyPlaying } = useQuery({
    queryKey: ['spotify', 'currentlyPlaying', userId],
    queryFn: () => spotifyService.getCurrentlyPlaying(userId),
    enabled: !!userId && !!isConnected,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false,
  });

  // Get playback state
  const { data: playbackState, refetch: refetchPlaybackState } = useQuery({
    queryKey: ['spotify', 'playbackState', userId],
    queryFn: () => playbackControl.getPlaybackState(userId),
    enabled: !!userId && !!isConnected,
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: false,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const authUrl = await spotifyService.connectSpotify();
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => spotifyService.disconnectSpotify(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotify'] });
      toast({
        title: 'Disconnected',
        description: 'Spotify has been disconnected',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disconnect Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Play mutation
  const playMutation = useMutation({
    mutationFn: (playlistUri?: string) => spotifyService.play(userId, playlistUri),
    onSuccess: () => {
      refetchPlaybackState();
      refetchCurrentlyPlaying();
    },
    onError: (error: Error) => {
      toast({
        title: 'Playback Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Pause mutation
  const pauseMutation = useMutation({
    mutationFn: () => spotifyService.pause(userId),
    onSuccess: () => {
      refetchPlaybackState();
    },
    onError: (error: Error) => {
      toast({
        title: 'Pause Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Skip to next mutation
  const skipNextMutation = useMutation({
    mutationFn: () => spotifyService.skipToNext(userId),
    onSuccess: () => {
      refetchCurrentlyPlaying();
      refetchPlaybackState();
    },
    onError: (error: Error) => {
      toast({
        title: 'Skip Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Skip to previous mutation
  const skipPreviousMutation = useMutation({
    mutationFn: () => spotifyService.skipToPrevious(userId),
    onSuccess: () => {
      refetchCurrentlyPlaying();
      refetchPlaybackState();
    },
    onError: (error: Error) => {
      toast({
        title: 'Skip Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set volume mutation
  const setVolumeMutation = useMutation({
    mutationFn: (volume: number) => spotifyService.setVolume(userId, volume),
    onError: (error: Error) => {
      toast({
        title: 'Volume Adjustment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: ({
      name,
      trackUris,
      description,
    }: {
      name: string;
      trackUris: string[];
      description?: string;
    }) => spotifyService.createWorkoutPlaylist(userId, name, trackUris, description),
    onSuccess: () => {
      refetchPlaylists();
      toast({
        title: 'Playlist Created',
        description: 'Your workout playlist has been created',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Search tracks mutation
  const searchTracksMutation = useMutation({
    mutationFn: (query: string) => spotifyService.searchTracks(userId, query),
  });

  return {
    // Connection state
    isConnected,
    isCheckingConnection,
    connection,

    // Playlists
    playlists,
    isLoadingPlaylists,
    refetchPlaylists,

    // Playback state
    currentlyPlaying,
    playbackState,
    isPlaying: playbackState?.is_playing || false,

    // Mutations
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    play: playMutation.mutate,
    pause: pauseMutation.mutate,
    skipNext: skipNextMutation.mutate,
    skipPrevious: skipPreviousMutation.mutate,
    setVolume: setVolumeMutation.mutate,
    createPlaylist: createPlaylistMutation.mutate,
    searchTracks: searchTracksMutation.mutateAsync,

    // Loading states
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isCreatingPlaylist: createPlaylistMutation.isPending,
    isSearching: searchTracksMutation.isPending,
  };
}
