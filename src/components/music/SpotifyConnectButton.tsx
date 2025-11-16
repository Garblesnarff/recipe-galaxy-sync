/**
 * Spotify Connect Button Component
 * Shows connection status and allows connecting/disconnecting Spotify
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpotify } from '@/hooks/useSpotify';
import { Music, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

export function SpotifyConnectButton() {
  const {
    isConnected,
    isCheckingConnection,
    connection,
    connect,
    disconnect,
    isConnecting,
    isDisconnecting,
  } = useSpotify();

  if (isCheckingConnection) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">
            Checking connection...
          </span>
        </div>
      </Card>
    );
  }

  if (isConnected && connection) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Music className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">Spotify Connected</h3>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Connected{' '}
                {connection.connected_at &&
                  formatDistanceToNow(new Date(connection.connected_at), {
                    addSuffix: true,
                  })}
              </p>
              {connection.last_used_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last used{' '}
                  {formatDistanceToNow(new Date(connection.last_used_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDisconnecting}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Spotify?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your Spotify connection and all saved
                  playlists. You can reconnect at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => disconnect()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Music className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Connect Spotify</h3>
            <p className="text-sm text-gray-600 mt-1">
              Play music during your workouts with Spotify integration
            </p>
            <ul className="mt-3 space-y-1">
              <li className="text-xs text-gray-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                Control playback during workouts
              </li>
              <li className="text-xs text-gray-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                Create workout playlists
              </li>
              <li className="text-xs text-gray-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                Auto-play music preferences
              </li>
            </ul>
          </div>
        </div>

        <Button
          onClick={() => connect()}
          disabled={isConnecting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Music className="h-4 w-4 mr-2" />
              Connect Spotify
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
