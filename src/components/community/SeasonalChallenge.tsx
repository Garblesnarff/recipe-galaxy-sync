import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Trophy, 
  Users, 
  Calendar,
  Target,
  Flame
} from "lucide-react";

interface ChallengeRecipe {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SeasonalChallengeData {
  id: string;
  title: string;
  description: string;
  emoji: string;
  startDate: string;
  endDate: string;
  totalParticipants: number;
  recipes: ChallengeRecipe[];
  reward: {
    title: string;
    description: string;
    emoji: string;
  };
  userProgress: number;
}

export const SeasonalChallenge = () => {
  const [currentChallenge, setCurrentChallenge] = useState<SeasonalChallengeData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });
  const [userParticipating, setUserParticipating] = useState(false);

  useEffect(() => {
    // Mock seasonal challenge data
    const mockChallenge: SeasonalChallengeData = {
      id: 'fall-2024',
      title: 'Fall Comfort Food Challenge',
      description: 'Cook 5 cozy fall recipes and win exclusive seasonal collections',
      emoji: '🎃',
      startDate: '2024-10-01',
      endDate: '2024-10-31',
      totalParticipants: 3247,
      userProgress: 2,
      recipes: [
        {
          id: 'pumpkin-soup',
          name: 'Pumpkin Soup',
          emoji: '🎃',
          completed: true,
          difficulty: 'easy'
        },
        {
          id: 'apple-crisp',
          name: 'Apple Crisp',
          emoji: '🍎',
          completed: true,
          difficulty: 'medium'
        },
        {
          id: 'butternut-risotto',
          name: 'Butternut Risotto',
          emoji: '🧈',
          completed: false,
          difficulty: 'hard'
        },
        {
          id: 'maple-cookies',
          name: 'Maple Cookies',
          emoji: '🍪',
          completed: false,
          difficulty: 'medium'
        },
        {
          id: 'spiced-cider',
          name: 'Spiced Cider',
          emoji: '🍷',
          completed: false,
          difficulty: 'easy'
        }
      ],
      reward: {
        title: 'Fall Recipe Master',
        description: 'Exclusive access to 20+ premium fall recipes + Fall Cooking Badge',
        emoji: '🏆'
      }
    };

    setCurrentChallenge(mockChallenge);
    setUserParticipating(true);

    // Calculate time remaining
    const endDate = new Date(mockChallenge.endDate);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    
    setTimeRemaining({
      days: Math.floor(timeDiff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    });
  }, []);

  const handleJoinChallenge = () => {
    setUserParticipating(true);
    // Track challenge participation
  };

  const handleRecipeClick = (recipe: ChallengeRecipe) => {
    if (!recipe.completed && userParticipating) {
      // Navigate to recipe with challenge context
      window.location.href = `/recipe/${recipe.id}?challenge=${currentChallenge?.id}`;
    }
  };

  const getDifficultyColor = (difficulty: ChallengeRecipe['difficulty']) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty];
  };

  if (!currentChallenge) {
    return <div>Loading challenge...</div>;
  }

  const progressPercentage = (currentChallenge.userProgress / currentChallenge.recipes.length) * 100;
  const isCompleted = currentChallenge.userProgress >= currentChallenge.recipes.length;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-orange-100 to-red-100 border-b border-orange-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-orange-800">
                <span className="text-2xl mr-2">{currentChallenge.emoji}</span>
                {currentChallenge.title}
              </CardTitle>
              <p className="text-orange-700 mt-1">{currentChallenge.description}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-orange-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{currentChallenge.totalParticipants.toLocaleString()} participants</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Ends Oct 31st</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-600">Ends in</div>
              <div className="text-2xl font-bold text-orange-800">
                {timeRemaining.days} days
              </div>
              <div className="text-sm text-orange-600">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </div>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-6">
        {userParticipating ? (
          <>
            {/* User Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-green-800">Your Progress</h4>
                <span className="text-sm text-gray-600">
                  {currentChallenge.userProgress}/{currentChallenge.recipes.length} recipes
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3 mb-2" />
              
              {isCompleted ? (
                <div className="flex items-center text-green-600 font-medium">
                  <Trophy className="h-4 w-4 mr-1" />
                  Challenge Complete! 🎉
                </div>
              ) : (
                <div className="flex items-center text-orange-600">
                  <Flame className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {currentChallenge.recipes.length - currentChallenge.userProgress} more recipes to go!
                  </span>
                </div>
              )}
            </div>

            {/* Challenge Recipes */}
            <div className="mb-6">
              <h5 className="font-medium mb-3">Challenge Recipes</h5>
              <div className="grid grid-cols-5 gap-3">
                {currentChallenge.recipes.map(recipe => (
                  <div key={recipe.id} className="text-center">
                    <button
                      onClick={() => handleRecipeClick(recipe)}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 transition-all hover:scale-105 ${
                        recipe.completed 
                          ? 'border-green-500 bg-green-100' 
                          : userParticipating
                          ? 'border-orange-300 bg-orange-50 hover:border-orange-500'
                          : 'border-gray-300 bg-gray-100'
                      }`}
                      disabled={!userParticipating}
                    >
                      {recipe.completed ? (
                        <span className="text-xl">✅</span>
                      ) : (
                        <span className="text-xl">{recipe.emoji}</span>
                      )}
                    </button>
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      {recipe.name}
                    </div>
                    <Badge className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Section */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-yellow-800 flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    {currentChallenge.reward.title}
                  </h5>
                  <p className="text-sm text-yellow-700">
                    {currentChallenge.reward.description}
                  </p>
                </div>
                <div className="text-3xl">{currentChallenge.reward.emoji}</div>
              </div>
              
              {isCompleted && (
                <Button className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700">
                  Claim Your Reward! 🎁
                </Button>
              )}
            </div>

            {/* Social Encouragement */}
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Share Your Progress</p>
                  <p className="text-xs text-purple-600">
                    Show friends your fall cooking challenge progress!
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700">
                  Share Progress 📱
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Join Challenge CTA */
          <div className="text-center space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-2">Ready for the Challenge?</h4>
              <p className="text-gray-600 mb-4">
                Cook 5 delicious fall recipes and win exclusive rewards. 
                Join {currentChallenge.totalParticipants.toLocaleString()}+ other home cooks!
              </p>
            </div>

            {/* Preview recipes */}
            <div className="flex justify-center space-x-2 mb-4">
              {currentChallenge.recipes.slice(0, 5).map(recipe => (
                <div key={recipe.id} className="text-center">
                  <div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mb-1">
                    <span className="text-lg">{recipe.emoji}</span>
                  </div>
                  <div className="text-xs text-gray-600">{recipe.name}</div>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8"
              onClick={handleJoinChallenge}
            >
              Join Fall Challenge 🎃
            </Button>

            <p className="text-xs text-gray-500">
              Free to join • {timeRemaining.days} days remaining
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};