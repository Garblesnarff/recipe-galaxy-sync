/**
 * Music Settings Page
 * Configure Spotify integration and music preferences
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Music, Settings, List, Plus } from 'lucide-react';
import { SpotifyConnectButton } from '@/components/music/SpotifyConnectButton';
import { MusicPreferencesDialog } from '@/components/music/MusicPreferencesDialog';
import { WorkoutPlaylistCreator } from '@/components/music/WorkoutPlaylistCreator';
import { useSpotify } from '@/hooks/useSpotify';
import { Badge } from '@/components/ui/badge';

export default function MusicSettings() {
  const { isConnected, playlists, isLoadingPlaylists } = useSpotify();
  const [activeTab, setActiveTab] = useState('connection');

  const formatTrackCount = (count: number) => {
    return `${count} track${count !== 1 ? 's' : ''}`;
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Music Integration</h1>
            <p className="text-gray-600 mt-2">
              Connect Spotify and manage your workout music
            </p>
          </div>
          <Music className="h-12 w-12 text-green-600" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">
            <Music className="h-4 w-4 mr-2" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="preferences" disabled={!isConnected}>
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="playlists" disabled={!isConnected}>
            <List className="h-4 w-4 mr-2" />
            Playlists
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-6">
          <SpotifyConnectButton />

          {!isConnected && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Why Connect Spotify?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">🎵</span>
                  <span>
                    Play your favorite music during workouts to stay motivated
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span>
                    Create custom workout playlists tailored to your training
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚡</span>
                  <span>
                    Auto-play music when you start a workout (configurable)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎶</span>
                  <span>
                    Get workout-optimized track recommendations based on your
                    preferences
                  </span>
                </li>
              </ul>
            </Card>
          )}

          {isConnected && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">What's Next?</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('preferences')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Music Preferences
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('playlists')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Browse Your Playlists
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Music Preferences</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Customize how music plays during your workouts
                </p>
              </div>
              <MusicPreferencesDialog />
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Quick Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    • Enable auto-play to start music automatically when you
                    begin a workout
                  </li>
                  <li>
                    • Set your preferred volume level to avoid manual
                    adjustments
                  </li>
                  <li>
                    • Use fade-in for a smoother music start experience
                  </li>
                  <li>
                    • Select your favorite genres to get better workout
                    recommendations
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Your Playlists</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Browse and manage your Spotify playlists
                </p>
              </div>
              <WorkoutPlaylistCreator />
            </div>

            {isLoadingPlaylists ? (
              <div className="text-center py-8 text-gray-500">
                Loading playlists...
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {playlists.map((playlist: any) => (
                  <Card key={playlist.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      {playlist.images?.[0]?.url && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="w-16 h-16 rounded shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {playlist.name}
                        </h4>
                        {playlist.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatTrackCount(playlist.tracks.total)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() =>
                        window.open(playlist.external_urls.spotify, '_blank')
                      }
                    >
                      Open in Spotify
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No playlists found</p>
                <WorkoutPlaylistCreator />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
