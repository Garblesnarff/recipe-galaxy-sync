// ConflictResolver Component for Recipe Galaxy Sync
// Resolves conflicts between local and server data

import { useState } from 'react';
import { resolveConflict } from '@/services/offline/syncService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Server, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConflictResolverProps {
  conflict: {
    id: string;
    tableName: string;
    recordId: string;
    localData: any;
    serverData: any;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}

export function ConflictResolver({
  conflict,
  open,
  onOpenChange,
  onResolved,
}: ConflictResolverProps) {
  const [strategy, setStrategy] = useState<'local' | 'server'>('server');
  const [isResolving, setIsResolving] = useState(false);
  const { toast } = useToast();

  if (!conflict) return null;

  const handleResolve = async () => {
    setIsResolving(true);

    try {
      await resolveConflict(conflict.id, strategy);

      toast({
        title: 'Conflict Resolved',
        description: `Using ${strategy === 'local' ? 'local' : 'server'} data`,
      });

      onResolved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        title: 'Resolution Failed',
        description: error instanceof Error ? error.message : 'Failed to resolve conflict',
        variant: 'destructive',
      });
    } finally {
      setIsResolving(false);
    }
  };

  const getDifferences = () => {
    const differences: Array<{ key: string; local: any; server: any }> = [];
    const allKeys = new Set([
      ...Object.keys(conflict.localData),
      ...Object.keys(conflict.serverData),
    ]);

    allKeys.forEach((key) => {
      const localValue = conflict.localData[key];
      const serverValue = conflict.serverData[key];

      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        differences.push({
          key,
          local: localValue,
          server: serverValue,
        });
      }
    });

    return differences;
  };

  const differences = getDifferences();

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resolve Sync Conflict</DialogTitle>
          <DialogDescription>
            Choose which version to keep: your local changes or the server version
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conflict Info */}
          <div className="flex items-center gap-2">
            <Badge>{conflict.tableName}</Badge>
            <span className="text-sm text-gray-500">ID: {conflict.recordId}</span>
          </div>

          {/* Strategy Selection */}
          <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as any)}>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`p-4 cursor-pointer transition-colors ${
                  strategy === 'local' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setStrategy('local')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-semibold">Use Local Data</span>
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-6">
                  Keep the changes made on this device
                </p>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-colors ${
                  strategy === 'server' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setStrategy('server')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="server" id="server" />
                  <Label htmlFor="server" className="flex items-center gap-2 cursor-pointer">
                    <Server className="h-4 w-4" />
                    <span className="font-semibold">Use Server Data</span>
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-6">
                  Discard local changes and use server version
                </p>
              </Card>
            </div>
          </RadioGroup>

          {/* Differences */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Differences ({differences.length})</h3>

            <ScrollArea className="h-60 border rounded-lg p-4">
              <div className="space-y-4">
                {differences.map((diff, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">{diff.key}</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-600">Local</span>
                        </div>
                        <pre className="text-xs bg-blue-50 p-2 rounded overflow-x-auto">
                          {formatValue(diff.local)}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Server className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-semibold text-green-600">Server</span>
                        </div>
                        <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                          {formatValue(diff.server)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleResolve} disabled={isResolving}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {isResolving ? 'Resolving...' : 'Apply Resolution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
