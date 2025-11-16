
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { WorkoutLoadingState } from "@/components/workout/WorkoutLoadingState";
import { WorkoutContent } from "@/components/workout/WorkoutContent";
import { WorkoutEditButton } from "@/components/workout/WorkoutEditButton";
import { RecipeRecommendations } from "@/components/workout/RecipeRecommendations";
import { LinkedRecipes } from "@/components/workout/LinkedRecipes";
import { LinkRecipeDialog } from "@/components/workout/LinkRecipeDialog";
import { ScheduleWorkoutDialog } from "@/components/workout/ScheduleWorkoutDialog";
import { ShareWorkoutDialog } from "@/components/social/ShareWorkoutDialog";
import { HeartRateZoneChart } from "@/components/wearables/HeartRateZoneChart";
import { useWorkoutDetail } from "@/hooks/useWorkoutDetail";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Edit, Trash2, Plus, Calendar, Share2, Heart, MessageCircle, Send, Watch } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWorkoutHeartRateData } from "@/services/wearables/syncService";
import {
  getWorkoutLikeCount,
  hasUserLikedWorkout,
  likeWorkout,
  unlikeWorkout,
  getWorkoutComments,
  addComment,
  type WorkoutComment,
} from "@/services/social/workoutSharing";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
} from "@/components/ui/alert-dialog";

export const WorkoutDetail = () => {
  const {
    workout,
    isLoading,
    navigateToEdit,
    isFavorite,
    handleToggleFavorite,
    handleDelete,
  } = useWorkoutDetail();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [linkRecipeDialogOpen, setLinkRecipeDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [nutritionKey, setNutritionKey] = useState(0);

  // Social features state
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Heart rate data from wearable
  const [heartRateData, setHeartRateData] = useState<number[] | null>(null);

  const handleNutritionUpdate = () => {
    // Trigger re-render of nutrition components
    setNutritionKey((prev) => prev + 1);
  };

  // Load social data
  useEffect(() => {
    if (workout?.id) {
      loadSocialData();
      loadHeartRateData();
    }
  }, [workout?.id, user?.id]);

  const loadSocialData = async () => {
    if (!workout?.id) return;

    try {
      // Load like count
      const count = await getWorkoutLikeCount(workout.id);
      setLikeCount(count);

      // Load user's like status
      if (user?.id) {
        const liked = await hasUserLikedWorkout(workout.id, user.id);
        setIsLiked(liked);
      }

      // Load comments
      setLoadingComments(true);
      const workoutComments = await getWorkoutComments(workout.id);
      setComments(workoutComments);
    } catch (error) {
      console.error("Error loading social data:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadHeartRateData = async () => {
    if (!workout?.id || !user?.id) return;

    try {
      // Try to get heart rate data from imported wearable data
      const hrData = await getWorkoutHeartRateData(user.id, workout.id);
      if (hrData && hrData.length > 0) {
        setHeartRateData(hrData);
      }
    } catch (error) {
      console.error("Error loading heart rate data:", error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user?.id || !workout?.id) {
      toast.error("Please sign in to like workouts");
      return;
    }

    try {
      if (isLiked) {
        await unlikeWorkout(workout.id, user.id);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        toast.success("Unliked workout");
      } else {
        await likeWorkout(workout.id, user.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        toast.success("Liked workout");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !workout?.id || !newComment.trim()) return;

    try {
      const comment = await addComment(workout.id, user.id, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  if (isLoading || !workout) {
    return <WorkoutLoadingState isLoading={isLoading} />;
  }

  const handleStartWorkout = () => {
    navigate(`/workouts/active/${workout.id}`);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <WorkoutEditButton onClick={navigateToEdit} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScheduleDialogOpen(true)}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this workout? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button onClick={handleStartWorkout} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          </div>

          <WorkoutHeader
            workout={workout}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />

          <WorkoutContent
            workout={workout}
          />

          {/* Heart Rate Data - From Wearable Integration */}
          {heartRateData && heartRateData.length > 0 && (
            <HeartRateZoneChart heartRateData={heartRateData} />
          )}

          {/* Link to Wearables */}
          {!heartRateData && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Watch className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Connect Your Wearable</h3>
                      <p className="text-sm text-gray-600">
                        Sync your heart rate and health data for detailed insights
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings/wearables')}
                  >
                    Connect Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nutrition Section - UNIQUE DIFFERENTIATOR! */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Nutrition</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkRecipeDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Link Recipe
              </Button>
            </div>

            <div key={nutritionKey} className="space-y-4">
              <LinkedRecipes
                workoutId={workout.id}
                onRecipesChanged={handleNutritionUpdate}
              />

              <RecipeRecommendations
                workout={workout}
                onRecipeLinked={handleNutritionUpdate}
              />
            </div>
          </div>

          {/* Social Engagement Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Social</span>
                <div className="flex gap-4 text-sm font-normal text-gray-600">
                  <div className="flex items-center gap-1">
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{comments.length}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Like Button */}
              <div className="flex gap-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
                  onClick={handleLikeToggle}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-white" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({comments.length})
                </h3>

                {/* Add Comment */}
                {user && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-3">
                  {loadingComments ? (
                    <p className="text-sm text-gray-500">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {comment.user_profile?.username?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {comment.user_profile?.display_name || comment.user_profile?.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LinkRecipeDialog
        open={linkRecipeDialogOpen}
        onOpenChange={setLinkRecipeDialogOpen}
        workout={workout}
        onRecipeLinked={handleNutritionUpdate}
      />

      <ScheduleWorkoutDialog
        workoutId={workout.id}
        workoutTitle={workout.title}
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
      />

      {user && (
        <ShareWorkoutDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          workoutId={workout.id}
          workoutName={workout.title}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default WorkoutDetail;
