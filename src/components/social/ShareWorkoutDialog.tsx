import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Share2, Globe, Lock, QrCode } from "lucide-react";
import { shareWorkout, type WorkoutShare } from "@/services/social/workoutSharing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  workoutName: string;
  userId: string;
  existingShare?: WorkoutShare;
}

export function ShareWorkoutDialog({
  open,
  onOpenChange,
  workoutId,
  workoutName,
  userId,
  existingShare,
}: ShareWorkoutDialogProps) {
  const [isPublic, setIsPublic] = useState(existingShare?.is_public || false);
  const [share, setShare] = useState<WorkoutShare | null>(existingShare || null);
  const [isSharing, setIsSharing] = useState(false);

  const getShareUrl = (shareCode: string) => {
    return `${window.location.origin}/shared/workout/${shareCode}`;
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const newShare = await shareWorkout(workoutId, userId, isPublic);
      setShare(newShare);
      toast.success("Workout shared successfully!");
    } catch (error) {
      console.error("Error sharing workout:", error);
      toast.error("Failed to share workout");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!share) return;

    try {
      const url = getShareUrl(share.share_code);
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (!share) return;

    const url = getShareUrl(share.share_code);

    if (navigator.share) {
      try {
        await navigator.share({
          title: workoutName,
          text: `Check out my workout: ${workoutName}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Workout</DialogTitle>
          <DialogDescription>
            Share "{workoutName}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base">
                {isPublic ? "Public" : "Private"}
              </Label>
              <p className="text-sm text-gray-500">
                {isPublic
                  ? "Anyone with the link can view"
                  : "Only people you share with can view"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-600" />
              )}
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          {/* Share Button */}
          {!share && (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? "Creating share link..." : "Create Share Link"}
            </Button>
          )}

          {/* Share Link */}
          {share && (
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getShareUrl(share.share_code)}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleCopyLink} size="icon" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleCopyLink} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button onClick={handleNativeShare} variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Share Stats */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <p>Views: {share.view_count || 0}</p>
                    <p className="text-xs mt-1">
                      Share Code: <code className="bg-gray-100 px-1 rounded">{share.share_code}</code>
                    </p>
                  </div>
                </div>

                {/* Update Share */}
                {(share.is_public !== isPublic) && (
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    variant="secondary"
                    className="w-full"
                  >
                    Update Share Settings
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <QrCode className="h-32 w-32 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    QR Code generation coming soon!
                  </p>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    For now, you can use the link to share
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
