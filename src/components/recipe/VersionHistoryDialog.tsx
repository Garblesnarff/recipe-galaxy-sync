/**
 * Version History Dialog
 * Dialog component for viewing and managing recipe version history
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  GitCompare,
  RotateCcw,
  Trash2,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import {
  getRecipeVersionHistory,
  getRecipeVersion,
  compareRecipeVersions,
  restoreRecipeVersion,
  deleteRecipeVersion
} from "@/services/recipeVersioningService";
import {
  RecipeVersion,
  VersionComparison,
  RecipeVersionHistory as RecipeVersionHistoryType
} from "@/types/recipeVersioning";

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export const VersionHistoryDialog = ({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
}: VersionHistoryDialogProps) => {
  const [versionHistory, setVersionHistory] = useState<RecipeVersionHistoryType | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [comparisonResult, setComparisonResult] = useState<VersionComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [currentView, setCurrentView] = useState<'history' | 'comparison' | 'details'>('history');

  // Load version history when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadVersionHistory();
    }
  }, [isOpen]);

  const loadVersionHistory = async () => {
    setIsLoading(true);

    try {
      const history = await getRecipeVersionHistory(recipeId);
      setVersionHistory(history);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (versionNumber: number, isChecked: boolean) => {
    if (isChecked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionNumber]);
      } else {
        toast.info('You can only compare up to 2 versions at a time');
      }
    } else {
      setSelectedVersions(selectedVersions.filter(v => v !== versionNumber));
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare');
      return;
    }

    setIsComparing(true);

    try {
      const [fromVersion, toVersion] = selectedVersions.sort((a, b) => a - b);
      const comparison = await compareRecipeVersions(recipeId, fromVersion, toVersion);
      setComparisonResult(comparison);
      setCurrentView('comparison');
    } catch (error) {
      console.error('Error comparing versions:', error);
      toast.error('Failed to compare versions');
    } finally {
      setIsComparing(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    setIsLoading(true);

    try {
      await restoreRecipeVersion(recipeId, versionNumber, {
        change_notes: `Restored from version ${versionNumber} via UI`,
      });

      toast.success(`Recipe restored to version ${versionNumber}`);
      await loadVersionHistory(); // Refresh the history
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVersion = async (versionNumber: number) => {
    if (versionNumber === versionHistory?.current_version) {
      toast.error('Cannot delete the current version');
      return;
    }

    setIsLoading(true);

    try {
      await deleteRecipeVersion(recipeId, versionNumber);
      toast.success(`Version ${versionNumber} deleted`);
      await loadVersionHistory(); // Refresh the history
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVersion = async (versionNumber: number) => {
    setIsLoading(true);

    try {
      const version = await getRecipeVersion(recipeId, versionNumber);
      // TODO: Implement version details view
      console.log('Viewing version:', version);
      toast.info('Version details view coming soon');
    } catch (error) {
      console.error('Error loading version:', error);
      toast.error('Failed to load version details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added': return 'bg-green-100 text-green-800';
      case 'removed': return 'bg-red-100 text-red-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added': return <CheckCircle className="h-3 w-3" />;
      case 'removed': return <AlertCircle className="h-3 w-3" />;
      case 'modified': return <FileText className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History: {recipeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[600px]">
          {/* Sidebar - Version List */}
          <div className="w-1/3 border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Versions</h3>
              <p className="text-sm text-muted-foreground">
                {versionHistory?.total_versions || 0} total versions
              </p>
            </div>

            <ScrollArea className="h-[500px] p-4">
              {versionHistory?.versions.map((version) => (
                <Card
                  key={version.version_number}
                  className={`mb-3 cursor-pointer transition-colors ${
                    selectedVersions.includes(version.version_number)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleViewVersion(version.version_number)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.is_current ? "default" : "outline"}>
                          v{version.version_number}
                          {version.is_current && " (Current)"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.version_number)}
                          onChange={(e) => handleVersionSelect(version.version_number, e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(version.created_at)}
                      </div>
                      {version.change_notes && (
                        <div className="text-xs">
                          {version.change_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 mt-2">
                      {!version.is_current && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version.version_number);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      )}

                      {!version.is_current && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(version.version_number);
                          }}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {currentView === 'history' && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Version Management</span>
                    <Button
                      onClick={handleCompareVersions}
                      disabled={selectedVersions.length !== 2 || isComparing}
                      size="sm"
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      {isComparing ? 'Comparing...' : 'Compare Selected'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select versions from the list to view details or compare them</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentView === 'comparison' && comparisonResult && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      Comparing v{comparisonResult.from_version.version_number} → v{comparisonResult.to_version.version_number}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentView('history')}
                    >
                      Back to History
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <h4 className="font-semibold mb-2">From Version {comparisonResult.from_version.version_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(comparisonResult.from_version.created_at)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">To Version {comparisonResult.to_version.version_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(comparisonResult.to_version.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Changes Summary */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">
                            {comparisonResult.summary.fields_changed}
                          </div>
                          <div className="text-xs text-blue-700">Fields Changed</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">
                            {comparisonResult.summary.ingredients_changed}
                          </div>
                          <div className="text-xs text-green-700">Ingredients</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-lg font-bold text-purple-600">
                            {comparisonResult.summary.instructions_changed ? 'Yes' : 'No'}
                          </div>
                          <div className="text-xs text-purple-700">Instructions</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-600">
                            {comparisonResult.summary.metadata_changed ? 'Yes' : 'No'}
                          </div>
                          <div className="text-xs text-orange-700">Metadata</div>
                        </div>
                      </div>

                      {/* Detailed Changes */}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Detailed Changes</h4>
                        {comparisonResult.changes.map((change, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <Badge className={`text-xs ${getChangeTypeColor(change.change_type)}`}>
                              <div className="flex items-center gap-1">
                                {getChangeTypeIcon(change.change_type)}
                                {change.change_type}
                              </div>
                            </Badge>
                            <span className="font-medium">{change.field}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm">
                              {change.change_type === 'added' && (
                                <span className="text-green-600">+ {change.new_value}</span>
                              )}
                              {change.change_type === 'removed' && (
                                <span className="text-red-600">- {change.old_value}</span>
                              )}
                              {change.change_type === 'modified' && (
                                <span>
                                  <span className="text-red-600">{change.old_value}</span>
                                  <span className="text-muted-foreground"> → </span>
                                  <span className="text-green-600">{change.new_value}</span>
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
