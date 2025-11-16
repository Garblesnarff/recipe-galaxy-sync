import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Smartphone, Watch, Activity, Settings2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { WearableConnection } from "@/services/wearables/syncService";

interface WearableConnectionCardProps {
  connection: WearableConnection;
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onToggleSync: (platform: string, enabled: boolean) => void;
  onConfigurePreferences: (platform: string) => void;
}

const PLATFORM_INFO = {
  apple_health: {
    name: 'Apple Health',
    icon: Smartphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    description: 'Sync with Apple Health (iOS only)',
  },
  google_fit: {
    name: 'Google Fit',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Sync with Google Fit',
  },
  fitbit: {
    name: 'Fitbit',
    icon: Watch,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    description: 'Sync with Fitbit devices',
  },
  garmin: {
    name: 'Garmin',
    icon: Watch,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Sync with Garmin Connect',
  },
};

export function WearableConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onToggleSync,
  onConfigurePreferences,
}: WearableConnectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const platformInfo = PLATFORM_INFO[connection.platform];
  const Icon = platformInfo.icon;

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect(connection.platform);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect(connection.platform);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSync = async (checked: boolean) => {
    await onToggleSync(connection.platform, checked);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${platformInfo.bgColor} opacity-20 rounded-full -mr-16 -mt-16`} />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${platformInfo.bgColor}`}>
              <Icon className={`h-6 w-6 ${platformInfo.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{platformInfo.name}</CardTitle>
              <CardDescription className="text-sm">
                {platformInfo.description}
              </CardDescription>
            </div>
          </div>

          {connection.is_connected ? (
            <Badge variant="default" className="bg-green-500">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connection.is_connected ? (
          <>
            {/* Last Sync Info */}
            {connection.last_sync_at && (
              <div className="text-sm text-gray-600">
                Last synced: {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}
              </div>
            )}

            {/* Sync Toggle */}
            <div className="flex items-center justify-between py-2 border-t">
              <Label htmlFor={`sync-${connection.platform}`} className="text-sm font-medium">
                Auto-sync enabled
              </Label>
              <Switch
                id={`sync-${connection.platform}`}
                checked={connection.sync_enabled}
                onCheckedChange={handleToggleSync}
              />
            </div>

            {/* Sync Preferences Summary */}
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Syncing:</div>
              <div className="flex flex-wrap gap-2">
                {connection.sync_preferences.import_workouts && (
                  <Badge variant="outline" className="text-xs">Workouts</Badge>
                )}
                {connection.sync_preferences.import_hr && (
                  <Badge variant="outline" className="text-xs">Heart Rate</Badge>
                )}
                {connection.sync_preferences.import_steps && (
                  <Badge variant="outline" className="text-xs">Steps</Badge>
                )}
                {connection.sync_preferences.import_calories && (
                  <Badge variant="outline" className="text-xs">Calories</Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigurePreferences(connection.platform)}
                className="flex-1"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Not Connected State */}
            <div className="text-sm text-gray-500 py-2">
              Connect to sync your workouts, heart rate, steps, and more.
            </div>

            {connection.platform === 'fitbit' || connection.platform === 'garmin' ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                Coming soon! This integration is currently in development.
              </div>
            ) : null}

            <Button
              onClick={handleConnect}
              disabled={isLoading || connection.platform === 'fitbit' || connection.platform === 'garmin'}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
