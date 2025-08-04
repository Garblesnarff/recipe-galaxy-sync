import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecipeDetail } from '@/hooks/useRecipeDetail';
import { adaptRecipeForDiet } from '@/services/adaptationService';
import { Recipe } from '@/types/recipe';
import { DietaryRestriction } from '@/types/dietary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipeLoadingState } from '@/components/recipe/RecipeLoadingState';
import { useAuthSession } from '@/hooks/useAuthSession';
import { isFeatureAvailable, createCheckoutSession } from '@/services/subscriptionService';
import { PaywallModal } from '@/components/subscription/PaywallModal';
import { getMonthlyUsage, trackUsage } from '@/services/usageService';

const AdaptRecipe = () => {
  const { id } = useParams<{ id: string }>();
  const { recipe, isLoading } = useRecipeDetail(id);
  const { session } = useAuthSession();
  const [adaptedRecipe, setAdaptedRecipe] = useState<Recipe | null>(null);
  const [userRestrictions, setUserRestrictions] = useState<DietaryRestriction[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    // Fetch user's dietary restrictions from your auth/user service
    // For now, we'll use a mock
    setUserRestrictions([{ id: '1', name: 'No Peanuts', type: 'allergy' }]);
  }, []);

  useEffect(() => {
    const checkAvailability = async () => {
      if (recipe && userRestrictions.length > 0 && session?.user.id) {
        const canAdapt = await isFeatureAvailable(session.user.id, 'recipe_adapt');
        if (canAdapt) {
          await trackUsage(session.user.id, 'recipe_adapt', recipe.id);
          const adapted = await adaptRecipeForDiet(recipe.id, userRestrictions);
          setAdaptedRecipe(adapted);
        } else {
          const usage = await getMonthlyUsage(session.user.id, 'recipe_adapt');
          setUsageCount(usage);
          setShowPaywall(true);
        }
      }
    };
    checkAvailability();
  }, [recipe, userRestrictions, session]);

  const handleUpgrade = async () => {
    if (!session?.user.id) return;
    const checkoutUrl = await createCheckoutSession(session.user.id);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  if (isLoading || !recipe) {
    return <RecipeLoadingState isLoading={isLoading} />;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Adapt Recipe</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold">{recipe.title}</h2>
            {/* Display original ingredients */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Adapted Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            {adaptedRecipe ? (
              <div>
                <h2 className="text-xl font-semibold">{adaptedRecipe.title}</h2>
                {/* Display adapted ingredients with changes highlighted */}
              </div>
            ) : (
              <p>Adapting recipe...</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Adapted Recipe</Button>
      </div>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="recipe adaptation"
        usageCount={usageCount}
        limit={5}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default AdaptRecipe;
