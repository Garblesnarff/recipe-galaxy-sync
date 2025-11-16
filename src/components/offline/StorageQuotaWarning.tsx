// StorageQuotaWarning Component for Recipe Galaxy Sync
// Warns when storage quota is running low

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, X } from 'lucide-react';
import { getStorageQuota } from '@/lib/indexedDB';
import { useNavigate } from 'react-router-dom';

interface StorageQuotaWarningProps {
  threshold?: number; // Percentage threshold (default: 80)
  onDismiss?: () => void;
}

export function StorageQuotaWarning({ threshold = 80, onDismiss }: StorageQuotaWarningProps) {
  const [show, setShow] = useState(false);
  const [usage, setUsage] = useState(0);
  const [quota, setQuota] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkStorage();

    // Check storage every 5 minutes
    const interval = setInterval(checkStorage, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [threshold]);

  const checkStorage = async () => {
    try {
      const { usage, quota } = await getStorageQuota();

      if (quota === 0) return;

      const percentage = (usage / quota) * 100;

      setUsage(usage);
      setQuota(quota);

      // Check if dismissed
      const dismissed = localStorage.getItem('storage-warning-dismissed');
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
        // Dismissed within last 24 hours
        return;
      }

      setShow(percentage >= threshold);
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('storage-warning-dismissed', String(Date.now()));
    setShow(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleManageStorage = () => {
    navigate('/settings/offline');
    handleDismiss();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const percentage = quota > 0 ? (usage / quota) * 100 : 0;

  if (!show) return null;

  return (
    <Alert variant="destructive" className="relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pr-8">Storage Running Low</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Your offline storage is {percentage.toFixed(1)}% full ({formatBytes(usage)} of{' '}
          {formatBytes(quota)} used). Consider clearing old data to free up space.
        </p>

        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span>{formatBytes(usage)} used</span>
            <span>{formatBytes(quota - usage)} available</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={handleManageStorage}>
            Manage Storage
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
