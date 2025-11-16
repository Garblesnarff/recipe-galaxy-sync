import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { WearableConnection } from "@/services/wearables/syncService";
import { Info } from "lucide-react";

interface SyncPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: WearableConnection | null;
  onSave: (preferences: WearableConnection['sync_preferences']) => void;
}

export function SyncPreferencesDialog({
  open,
  onOpenChange,
  connection,
  onSave,
}: SyncPreferencesDialogProps) {
  const [preferences, setPreferences] = useState<WearableConnection['sync_preferences']>({
    import_workouts: true,
    export_workouts: true,
    import_hr: true,
    import_calories: true,
    import_steps: true,
  });

  useEffect(() => {
    if (connection?.sync_preferences) {
      setPreferences(connection.sync_preferences);
    }
  }, [connection]);

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Preferences</DialogTitle>
          <DialogDescription>
            Configure what data to sync with {connection.platform.replace('_', ' ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Import Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Import from Device</h3>
              <p className="text-xs text-gray-500">
                Pull data from your wearable device into the app
              </p>
            </div>

            <div className="space-y-3 pl-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="import-workouts" className="text-sm">
                  Workouts
                </Label>
                <Switch
                  id="import-workouts"
                  checked={preferences.import_workouts}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, import_workouts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="import-hr" className="text-sm">
                  Heart Rate
                </Label>
                <Switch
                  id="import-hr"
                  checked={preferences.import_hr}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, import_hr: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="import-steps" className="text-sm">
                  Steps
                </Label>
                <Switch
                  id="import-steps"
                  checked={preferences.import_steps}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, import_steps: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="import-calories" className="text-sm">
                  Calories
                </Label>
                <Switch
                  id="import-calories"
                  checked={preferences.import_calories}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, import_calories: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Export to Device</h3>
              <p className="text-xs text-gray-500">
                Send your app workouts to your wearable device
              </p>
            </div>

            <div className="space-y-3 pl-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="export-workouts" className="text-sm">
                  Workouts
                </Label>
                <Switch
                  id="export-workouts"
                  checked={preferences.export_workouts}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, export_workouts: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 p-3 rounded-lg flex gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>
                Your health data is synced securely and stored with encryption. You can
                disconnect and delete this data at any time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
