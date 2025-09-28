import { useState, useEffect } from "react";
import { DemoRecipeCard } from "@/components/DemoRecipeCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Mock recipe data for demo with real food images
const mockRecipes = [
  {
    id: "demo-1",
    title: "15-Minute Chicken Alfredo Your Family Will Beg You To Make Again",
    description: "Creamy, restaurant-quality Alfredo that comes together in just 15 minutes. Perfect for busy weeknights when you need dinner fast.",
    image_url: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    rating: 4.9,
    cook_time: "15 minutes",
    difficulty: "Easy",
    is_favorite: false,
    categories: ["Quick Meals", "Pasta", "Family Favorites"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: true
  },
  {
    id: "demo-2", 
    title: "Perfect Chocolate Chip Cookies That Turn Out Every Single Time",
    description: "No more cookie disasters! This foolproof recipe delivers perfectly chewy cookies with crispy edges every single time you make them.",
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    rating: 4.8,
    cook_time: "25 minutes",
    difficulty: "Easy",
    is_favorite: true,
    categories: ["Desserts", "Baking", "Kid-Friendly"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: false
  },
  {
    id: "demo-3",
    title: "One-Pot Beef Stew That Makes Your House Smell Like Heaven", 
    description: "Rich, hearty beef stew that simmers to perfection in one pot. The aroma alone will have your neighbors asking for the recipe.",
    image_url: "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    rating: 4.7,
    cook_time: "2 hours",
    difficulty: "Medium",
    is_favorite: false,
    categories: ["Comfort Food", "One Pot", "Winter Meals"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: false
  },
  {
    id: "demo-4",
    title: "Foolproof Gluten-Free Bread That Actually Tastes Like Real Bread",
    description: "Finally! Gluten-free bread that doesn't taste like cardboard. Soft, fluffy, and perfect for sandwiches or toast.",
    image_url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", 
    rating: 4.6,
    cook_time: "3 hours",
    difficulty: "Medium",
    is_favorite: false,
    categories: ["Gluten-Free", "Bread", "Special Diet"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: false
  },
  {
    id: "demo-5",
    title: "5-Ingredient Salmon That Beats Any Restaurant",
    description: "Restaurant-quality salmon with just 5 ingredients. Flaky, flavorful, and ready in 20 minutes.",
    image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    rating: 4.9,
    cook_time: "20 minutes", 
    difficulty: "Easy",
    is_favorite: true,
    categories: ["Seafood", "Quick Meals", "Healthy"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: true
  },
  {
    id: "demo-6",
    title: "The Vegetarian Bowl Recipe That Converted My Meat-Loving Husband",
    description: "So satisfying and flavorful, even the biggest meat lovers will ask for seconds. Packed with protein and incredible flavors.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    rating: 4.8,
    cook_time: "30 minutes",
    difficulty: "Easy", 
    is_favorite: false,
    categories: ["Vegetarian", "Healthy", "Bowl Meals"],
    savesCount: 0, // Demo mode - no fake save counts
    recentCooks: [], // Demo mode - no fake social proof
    adaptable: true,
    trending: false
  }
];

export default function Demo() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(mockRecipes);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load real recipes from Supabase, fallback to mock data
    const loadRecipes = async () => {
      try {
        const { data: realRecipes, error } = await supabase
          .from('recipes')
          .select('*')
          .limit(6);
        
        if (realRecipes && realRecipes.length > 0) {
          // Use real recipes but enhance with conversion optimizations
          const enhancedRecipes = realRecipes.map((recipe, index) => ({
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            image_url: recipe.image_url || mockRecipes[index]?.image_url || mockRecipes[0].image_url,
            rating: recipe.rating || 4.8,
            cook_time: recipe.cook_time || '30 minutes',
            difficulty: recipe.difficulty || 'Medium',
            is_favorite: recipe.is_favorite || false,
            categories: recipe.categories || ['General'],
            // Demo mode - no fake social proof data
            savesCount: 0,
            recentCooks: [],
            adaptable: true,
            trending: index < 2 // First two are trending
          }));
          setRecipes(enhancedRecipes);
        } else {
          // Use enhanced mock data with real images
          setRecipes(mockRecipes);
        }
      } catch (error) {
        console.log('Using demo data (Supabase not available)');
        setRecipes(mockRecipes);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Demo Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">KitchenSync Demo</h1>
                <p className="text-sm text-gray-600">
                  Experience the power of recipe adaptation - no signup required
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✨ Demo Mode
              </div>
              <Button 
                onClick={() => navigate('/auth?flow=signup')}
                className="bg-green-600 hover:bg-green-700"
              >
                Get MY Free Account →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🍽️ Welcome to Your Personal Recipe Collection
            </h2>
            <p className="text-gray-700 mb-4">
              Discover recipes that adapt to your dietary needs, match grocery sales, and guarantee cooking success every time.
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center text-green-700">
                <span className="text-green-500 mr-1">🍽️</span>
                <span>Adapt any recipe to your diet</span>
              </div>
              <div className="flex items-center text-blue-700">
                <span className="text-blue-500 mr-1">💰</span>
                <span>Match ingredients to grocery sales</span>
              </div>
              <div className="flex items-center text-purple-700">
                <span className="text-purple-500 mr-1">⚡</span>
                <span>Quick & easy meal planning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="font-bold text-gray-800">Dietary Adaptation</div>
            <div className="text-sm text-gray-600">Transform any recipe for gluten-free, keto, vegan, or other dietary needs</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-bold text-gray-800">Smart Shopping</div>
            <div className="text-sm text-gray-600">Match recipe ingredients to local grocery sales and save money</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-bold text-gray-800">Meal Planning</div>
            <div className="text-sm text-gray-600">Plan your week, generate shopping lists, and stay organized</div>
          </div>
        </div>

        {/* Recipe Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Recipes</h2>
              <p className="text-gray-600">
                Discover recipes designed for easy adaptation and cooking success
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🎥 Demo Mode
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <DemoRecipeCard 
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                image={recipe.image_url}
                rating={recipe.rating}
                cookTime={recipe.cook_time}
                difficulty={recipe.difficulty}
                isFavorite={recipe.is_favorite}
                tags={recipe.categories}
                savesCount={recipe.savesCount}
                recentCooks={recipe.recentCooks}
                adaptable={recipe.adaptable}
                trending={recipe.trending}
              />
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Adapt These Recipes for Your Diet?
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Sign up now to start adapting any of these recipes to be gluten-free, dairy-free, keto, 
            vegan, or any dietary need. Plus get grocery sale matching and smart shopping lists.
          </p>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-yellow-800">
                🎆 Early Access - Be among the first to experience KitchenSync!
              </p>
            </div>
          </div>
          
          <Button 
            size="lg"
            onClick={() => navigate('/auth?flow=signup')}
            className="bg-green-600 hover:bg-green-700 text-xl px-8 py-4"
          >
            Get MY Free Recipe Adaptations →
          </Button>
          
          <p className="text-sm text-gray-500 mt-3">
            Start with 5 free adaptations • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}