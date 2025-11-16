// OfflineSettings Component for Recipe Galaxy Sync
// Settings for offline mode configuration

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getStorageQuota, clearAllData } from '@/lib/indexedDB';
import { clearAllCaches, getCacheStats } from '@/services/offline/cacheManager';
import { Download, Trash2, Database, HardDrive, RefreshCw, CheckCircle } from 'lucide-react';

export function OfflineSettings() {
  const [autoSync, setAutoSync] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0 });
  const [cacheStats, setCacheStats] = useState({ itemCount: 0, totalSize: 0 });
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = () => {
    const savedAutoSync = localStorage.getItem('offline-auto-sync');
    if (savedAutoSync !== null) {
      setAutoSync(savedAutoSync === 'true');
    }
  };

  const loadStorageInfo = async () => {
    try {
      const quota = await getStorageQuota();
      setStorageUsage(quota);

      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem('offline-auto-sync', String(enabled));

    toast({
      title: 'Setting Updated',
      description: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleClearOfflineData = async () => {
    setIsClearing(true);

    try {
      await clearAllData();
      await clearAllCaches();
      await loadStorageInfo();

      toast({
        title: 'Data Cleared',
        description: 'All offline data and caches have been cleared',
      });

      setShowClearDialog(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear offline data',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getStoragePercentage = () => {
    if (storageUsage.quota === 0) return 0;
    return (storageUsage.usage / storageUsage.quota) * 100;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = getStoragePercentage();
  const isStorageWarning = storagePercentage > 80;

  return (
    <div className="space-y-6">
      {/* Auto-Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure how offline data syncs with the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Auto-sync when online</Label>
              <p className="text-sm text-gray-500">
                Automatically sync offline data when connection is restored
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={handleAutoSyncChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Monitor your offline storage quota
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {formatBytes(storageUsage.usage)} of {formatBytes(storageUsage.quota)} used
              </span>
              <Badge variant={isStorageWarning ? 'destructive' : 'secondary'}>
                {storagePercentage.toFixed(1)}%
              </Badge>
            </div>
            <Progress
              value={storagePercentage}
              className={isStorageWarning ? 'bg-red-100' : ''}
            />
          </div>

          {isStorageWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Storage is running low. Consider clearing old offline data.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Cache Items</p>
              <p className="text-xl font-bold">{cacheStats.itemCount}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Cache Size</p>
              <p className="text-xl font-bold">{formatBytes(cacheStats.totalSize)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your offline data and cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={loadStorageInfo}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Storage Info
          </Button>

          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Offline Data
          </Button>
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Worker Status</CardTitle>
          <CardDescription>
            Offline functionality status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {'serviceWorker' in navigator ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Service Worker Supported</span>
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-red-600" />
                <span className="text-sm">Service Worker Not Supported</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Offline Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all offline data and cached content.
              Any unsynced changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearOfflineData}
              disabled={isClearing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
