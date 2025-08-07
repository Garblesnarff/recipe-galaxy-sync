import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Users, 
  Clock, 
  TrendingUp,
  Camera,
  ChefHat
} from "lucide-react";

interface CommunityPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    cookingLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  recipe: {
    id: string;
    name: string;
    adaptationType?: string;
  };
  recipeImage: string;
  adaptationNote: string;
  timeAgo: string;
  likes: number;
  comments: number;
  userLiked: boolean;
  recentComments: Array<{
    id: string;
    user: { name: string; avatar: string };
    text: string;
  }>;
}

interface TrendingRecipe {
  id: string;
  name: string;
  trendingRank: number;
  cooksToday: number;
  photosToday: number;
  growthPercent: number;
  recentCooks: Array<{
    id: string;
    name: string;
    avatar: string;
    timeAgo: string;
  }>;
  totalCooks: number;
}

export const CommunityFeed = () => {
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipe[]>([]);
  const [activeCooks, setActiveCooks] = useState(127);
  const [todayShares, setTodayShares] = useState(89);

  useEffect(() => {
    // Mock data - replace with real API calls
    setCommunityPosts([
      {
        id: '1',
        user: {
          id: 'user1',
          name: 'Sarah Martinez',
          avatar: '/api/placeholder/40/40',
          cookingLevel: 'intermediate'
        },
        recipe: {
          id: 'recipe1',
          name: 'Gluten-Free Chicken Alfredo',
          adaptationType: 'Gluten-Free'
        },
        recipeImage: '/api/placeholder/400/300',
        adaptationNote: 'Made this for my family tonight - they had no idea it was gluten-free! The sauce came out perfectly creamy.',
        timeAgo: '2 hours ago',
        likes: 47,
        comments: 12,
        userLiked: false,
        recentComments: [
          {
            id: '1',
            user: { name: 'Mike Chen', avatar: '/api/placeholder/24/24' },
            text: 'This looks incredible! What flour did you use?'
          }
        ]
      },
      {
        id: '2',
        user: {
          id: 'user2',
          name: 'David Kim',
          avatar: '/api/placeholder/40/40',
          cookingLevel: 'beginner'
        },
        recipe: {
          id: 'recipe2',
          name: 'Keto Chocolate Chip Cookies',
          adaptationType: 'Keto'
        },
        recipeImage: '/api/placeholder/400/300',
        adaptationNote: 'First time making keto cookies - they actually taste amazing! My kids couldn\'t tell the difference.',
        timeAgo: '4 hours ago',
        likes: 23,
        comments: 8,
        userLiked: true,
        recentComments: []
      }
    ]);

    setTrendingRecipes([
      {
        id: 'trending1',
        name: 'Pumpkin Spice Latte Overnight Oats',
        trendingRank: 1,
        cooksToday: 234,
        photosToday: 89,
        growthPercent: 145,
        totalCooks: 1247,
        recentCooks: [
          { id: '1', name: 'Emma', avatar: '/api/placeholder/32/32', timeAgo: '10 min ago' },
          { id: '2', name: 'Jake', avatar: '/api/placeholder/32/32', timeAgo: '23 min ago' },
          { id: '3', name: 'Lisa', avatar: '/api/placeholder/32/32', timeAgo: '1h ago' }
        ]
      }
    ]);
  }, []);

  const handleLike = (postId: string) => {
    setCommunityPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              likes: post.userLiked ? post.likes - 1 : post.likes + 1,
              userLiked: !post.userLiked
            }
          : post
      )
    );
  };

  const handleMakeThisToo = (recipeId: string) => {
    // Navigate to recipe with cooking intent
    window.location.href = `/recipe/${recipeId}?intent=cook`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Community Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Community Kitchen</h2>
          <p className="text-gray-600">See what fellow cooks are creating</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <ChefHat className="h-4 w-4 mr-1" />
            <span>{activeCooks} cooking now</span>
          </div>
          <div className="flex items-center">
            <Camera className="h-4 w-4 mr-1" />
            <span>{todayShares} shared today</span>
          </div>
        </div>
      </div>

      {/* Trending Recipes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
              🔥 Trending in Community
            </h3>
            <span className="text-sm text-gray-600">Updated every hour</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingRecipes.map(recipe => (
              <div key={recipe.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Badge className="bg-red-500 text-white text-xs mr-2">
                      #{recipe.trendingRank}
                    </Badge>
                    <h4 className="font-bold">{recipe.name}</h4>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span>👨‍🍳 {recipe.cooksToday}</span>
                    <span>📸 {recipe.photosToday}</span>
                    <span className="text-green-600">⬆️ +{recipe.growthPercent}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-3">
                      {recipe.recentCooks.map(cook => (
                        <Avatar key={cook.id} className="w-6 h-6 border border-white">
                          <AvatarImage src={cook.avatar} />
                          <AvatarFallback>{cook.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      <div className="w-6 h-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs">
                        +{recipe.totalCooks - recipe.recentCooks.length}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">people made this recently</span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => handleMakeThisToo(recipe.id)}
                  >
                    Join the Trend 🚀
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Posts Feed */}
      <div className="space-y-6">
        {communityPosts.map(post => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            {/* User header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.user.name}</div>
                    <div className="text-sm text-gray-600">
                      <Badge variant="outline" className="text-xs mr-2">
                        {post.user.cookingLevel}
                      </Badge>
                      {post.timeAgo}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {post.recipe.adaptationType}
                </Badge>
              </div>
            </div>
            
            {/* Recipe image */}
            <div className="relative">
              <img 
                src={post.recipeImage} 
                className="w-full h-64 object-cover"
                alt={`${post.recipe.name} by ${post.user.name}`}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h4 className="text-white font-bold text-lg">{post.recipe.name}</h4>
                <p className="text-white/90 text-sm">{post.adaptationNote}</p>
              </div>
            </div>
            
            {/* Engagement actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={post.userLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.userLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments}
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save Recipe
                  </Button>
                </div>
                
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleMakeThisToo(post.recipe.id)}
                >
                  I'll Make This Too! 👨‍🍳
                </Button>
              </div>
              
              {/* Recent comments */}
              {post.recentComments.length > 0 && (
                <div className="space-y-2">
                  {post.recentComments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <span className="font-medium">{comment.user.name}</span>
                        <span className="text-gray-600 ml-1">{comment.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Social Shopping Activity */}
      <Card>
        <CardHeader>
          <h3 className="font-bold flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Shopping Activity
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm">📦 147 people added these ingredients today</span>
              <Badge className="bg-purple-100 text-purple-800">Trending</Badge>
            </div>
            
            <div className="flex items-center">
              <div className="flex -space-x-1 mr-3">
                {[1,2,3,4,5].map(i => (
                  <Avatar key={i} className="w-6 h-6 border border-white">
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                and 142+ others shopped recipes from the community
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};