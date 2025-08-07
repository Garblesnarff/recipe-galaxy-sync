import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Trophy, 
  Target, 
  Users, 
  Flame, 
  Award, 
  Star,
  Share,
  Calendar
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'cooking_streaks' | 'recipe_exploration' | 'community_engagement' | 'dietary_mastery';
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  userId: string;
}

export const AchievementSystem = ({ userId }: AchievementSystemProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [userStats, setUserStats] = useState({
    totalRecipesCooked: 12,
    currentStreak: 5,
    recipesShared: 3,
    commentsHelped: 8,
    adaptationsMade: 15
  });

  useEffect(() => {
    // Mock achievements data - replace with real API
    setAchievements([
      {
        id: '1',
        title: 'First Steps',
        description: 'Cook your first recipe',
        icon: '👨‍🍳',
        category: 'cooking_streaks',
        progress: 1,
        target: 1,
        completed: true,
        completedAt: '2024-01-15',
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Fire Starter',
        description: 'Cook 3 days in a row',
        icon: '🔥',
        category: 'cooking_streaks',
        progress: 5,
        target: 3,
        completed: true,
        completedAt: '2024-01-18',
        rarity: 'common'
      },
      {
        id: '3',
        title: 'Kitchen Warrior',
        description: 'Cook 7 days in a row',
        icon: '⚔️',
        category: 'cooking_streaks',
        progress: 5,
        target: 7,
        completed: false,
        rarity: 'rare'
      },
      {
        id: '4',
        title: 'Adaptation Master',
        description: 'Adapt 10 recipes to your dietary needs',
        icon: '🎯',
        category: 'recipe_exploration',
        progress: 15,
        target: 10,
        completed: true,
        completedAt: '2024-01-20',
        rarity: 'rare'
      },
      {
        id: '5',
        title: 'Community Helper',
        description: 'Help 5 other cooks with comments and tips',
        icon: '🤝',
        category: 'community_engagement',
        progress: 8,
        target: 5,
        completed: true,
        completedAt: '2024-01-22',
        rarity: 'rare'
      },
      {
        id: '6',
        title: 'Gluten-Free Master',
        description: 'Successfully adapt 20 recipes to be gluten-free',
        icon: '🌾',
        category: 'dietary_mastery',
        progress: 12,
        target: 20,
        completed: false,
        rarity: 'epic'
      }
    ]);
  }, [userId]);

  const completedAchievements = achievements.filter(a => a.completed);
  const inProgressAchievements = achievements.filter(a => !a.completed);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-yellow-100 text-yellow-800'
    };
    return colors[rarity];
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    const icons = {
      cooking_streaks: <Flame className="h-4 w-4" />,
      recipe_exploration: <Target className="h-4 w-4" />,
      community_engagement: <Users className="h-4 w-4" />,
      dietary_mastery: <Award className="h-4 w-4" />
    };
    return icons[category];
  };

  const handleShareAchievement = (achievement: Achievement) => {
    const shareText = `🎉 I just unlocked "${achievement.title}" on KitchenSync! ${achievement.description}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'KitchenSync Achievement',
        text: shareText,
        url: window.location.origin
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      // Show toast or feedback
    }
  };

  const simulateAchievementUnlock = () => {
    // Simulate unlocking the "Kitchen Warrior" achievement
    const achievement = achievements.find(a => a.id === '3');
    if (achievement && !achievement.completed) {
      setUnlockedAchievement({...achievement, completed: true, completedAt: new Date().toISOString()});
      setShowAchievementModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Achievement Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Your Cooking Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.totalRecipesCooked}</div>
              <div className="text-sm text-gray-600">Recipes Cooked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userStats.currentStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedAchievements.length}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.recipesShared}</div>
              <div className="text-sm text-gray-600">Recipes Shared</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Recent Achievements
            </CardTitle>
            <Button 
              size="sm" 
              onClick={simulateAchievementUnlock}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Achievement 🎉
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedAchievements.slice(-3).map(achievement => (
              <div key={achievement.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{achievement.icon}</div>
                  <div>
                    <div className="font-medium flex items-center">
                      {achievement.title}
                      <Badge className={`ml-2 text-xs ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                    <div className="text-xs text-gray-500">
                      Completed {new Date(achievement.completedAt!).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleShareAchievement(achievement)}
                >
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Towards Next Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Next Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inProgressAchievements.slice(0, 3).map(achievement => (
              <div key={achievement.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="text-xl mr-3">{achievement.icon}</div>
                    <div>
                      <div className="font-medium flex items-center">
                        {achievement.title}
                        <Badge className={`ml-2 text-xs ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{achievement.progress}/{achievement.target}</div>
                    <div className="flex items-center">
                      {getCategoryIcon(achievement.category)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.target) * 100} 
                    className="h-2"
                  />
                </div>
                
                {achievement.progress >= achievement.target * 0.8 && (
                  <div className="mt-2 text-xs text-orange-600 font-medium">
                    🔥 Almost there! Keep going!
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Unlock Modal */}
      <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-xl">Achievement Unlocked!</DialogTitle>
          </DialogHeader>
          
          {unlockedAchievement && (
            <div className="text-center space-y-4">
              <div className="text-4xl">{unlockedAchievement.icon}</div>
              <div>
                <h3 className="font-bold text-lg text-purple-600">{unlockedAchievement.title}</h3>
                <p className="text-gray-600">{unlockedAchievement.description}</p>
              </div>
              
              {/* Social sharing incentive */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
                <h5 className="font-bold mb-2">Share Your Achievement!</h5>
                <p className="text-sm text-gray-700 mb-3">
                  Let your friends know about your cooking progress and inspire them to start their own journey.
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 flex-1"
                    onClick={() => handleShareAchievement(unlockedAchievement)}
                  >
                    Share on Social Media 📱
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAchievementModal(false)}
                  >
                    Continue Cooking 👨‍🍳
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};