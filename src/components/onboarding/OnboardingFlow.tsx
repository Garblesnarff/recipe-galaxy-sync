import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Users, Clock, Heart } from "lucide-react";
import { toast } from "sonner";

type OnboardingStep = 'demo' | 'email' | 'profile' | 'goals' | 'first-recipe';
type CookingLevel = 'beginner' | 'intermediate' | 'advanced';
type CookingGoal = 'save_time' | 'eat_healthier' | 'save_money' | 'learn_cooking';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoPreference, setDemoPreference] = useState<string>('');
  const [cookingLevel, setCookingLevel] = useState<CookingLevel | ''>('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [cookingGoal, setCookingGoal] = useState<CookingGoal | ''>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = ['demo', 'email', 'profile', 'goals', 'first-recipe'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const dietaryOptions = [
    { id: 'gluten-free', label: 'Gluten-free' },
    { id: 'dairy-free', label: 'Dairy-free' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'keto', label: 'Keto' },
    { id: 'low-carb', label: 'Low-carb' },
  ];

  const toggleDiet = (dietId: string) => {
    setSelectedDiets(prev => 
      prev.includes(dietId) 
        ? prev.filter(d => d !== dietId)
        : [...prev, dietId]
    );
  };

  // A/B Testing Framework
  const getABTestVariant = (testName: string, variants: string[]): string => {
    // Simple client-side A/B testing - in production, use a proper service
    const userId = localStorage.getItem('userId') || 'anonymous';
    const hash = btoa(testName + userId).charCodeAt(0);
    const variantIndex = hash % variants.length;
    return variants[variantIndex];
  };

  // Analytics tracking helper
  const trackEvent = (eventName: string, properties: Record<string, unknown> = {}) => {
    // In a real app, this would send to your analytics service (Mixpanel, Google Analytics, etc.)
    console.log('Analytics Event:', eventName, properties);

    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    // Track signup attempt
    trackEvent('onboarding_signup_attempt', {
      cooking_level: cookingLevel,
      dietary_preferences: selectedDiets,
      cooking_goal: cookingGoal,
      demo_preference: demoPreference,
      step: currentStep
    });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            cooking_level: cookingLevel,
            dietary_preferences: selectedDiets,
            cooking_goal: cookingGoal,
            demo_preference: demoPreference,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        trackEvent('onboarding_signup_error', { error: error.message });
      } else {
        toast.success("Account created! Let's continue your setup...");
        trackEvent('onboarding_signup_success', {
          cooking_level: cookingLevel,
          dietary_preferences: selectedDiets,
          cooking_goal: cookingGoal
        });
        setCurrentStep('first-recipe');
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      trackEvent('onboarding_signup_error', { error: 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const getBenefitTitle = () => {
    const titles = {
      'Gluten-free': '15-Minute Gluten-Free Chicken Alfredo That Actually Tastes Amazing',
      'Dairy-free': 'Creamy Dairy-Free Pasta That Fooled My Italian Grandmother',
      'Low-carb': 'Satisfying Low-Carb "Pasta" That Curbs Cravings for Hours',
      'Vegetarian': 'Protein-Packed Vegetarian Bowl That Beats Any Takeout',
    };
    return titles[demoPreference as keyof typeof titles] || 'Perfect Chicken Alfredo That Works Every Single Time';
  };

  const getPersonalizedMessage = () => {
    const messages = {
      beginner: {
        headline: "Turn Kitchen Disasters into Family Favorites",
        subtext: "Even if you've never cooked before, we'll guide you to success",
        cta: "Show me foolproof recipes"
      },
      intermediate: {
        headline: "Expand Your Cooking Confidence",
        subtext: "Take recipes you love and make them work for your lifestyle",
        cta: "Adapt my favorite recipes"
      },
      advanced: {
        headline: "Unleash Your Kitchen Creativity",
        subtext: "Transform any recipe to match your vision and dietary goals",
        cta: "Start experimenting"
      }
    };
    return messages[cookingLevel as keyof typeof messages] || messages.intermediate;
  };

  const getDynamicSocialProof = () => {
    const proofs = {
      beginner: {
        testimonial: "I couldn't even make toast before KitchenSync. Now I cook dinner for my family 5 nights a week!",
        name: "Jenny M.",
        level: "Beginner Cook",
        adaptations: "47 recipes adapted"
      },
      intermediate: {
        testimonial: "Finally! I can make all my favorite restaurant dishes at home, adapted for my gluten-free needs.",
        name: "Mike R.",
        level: "Home Cook",
        adaptations: "132 recipes adapted"
      },
      advanced: {
        testimonial: "KitchenSync's AI understands the chemistry of cooking. My adaptations are restaurant-quality every time.",
        name: "Sarah L.",
        level: "Kitchen Pro",
        adaptations: "289 recipes adapted"
      }
    };
    return proofs[cookingLevel as keyof typeof proofs] || proofs.intermediate;
  };

  const renderDemoStep = () => {
    // A/B Test: Different demo headlines
    const demoHeadlineVariant = getABTestVariant('demo_headline', [
      'See How Easy Recipe Adaptation Is',
      'Watch Your Recipe Transform in 30 Seconds',
      'Experience the Magic of Recipe Adaptation'
    ]);

    // A/B Test: Different CTA button text
    const ctaVariant = getABTestVariant('demo_cta', [
      'Adapt This Recipe for Me ✨',
      'Transform This Recipe Now →',
      'See the Magic Happen ✨'
    ]);

    // A/B Test: Different social proof numbers
    const socialProofVariant = getABTestVariant('social_proof', [
      '10,247 adapted this week',
      '15,832 adapted this week',
      '8,694 adapted this week'
    ]);

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-4">
            {demoHeadlineVariant}
          </CardTitle>
          <p className="text-gray-600">
            Try our demo - no signup required
          </p>
        </CardHeader>
        <CardContent>
          <div className="demo-card bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <img
                src="/api/placeholder/80/80"
                className="w-16 h-16 rounded-lg mr-4"
                alt="Demo recipe"
              />
              <div>
                <h3 className="font-bold">Classic Chicken Alfredo</h3>
                <p className="text-sm text-gray-600">30 minutes • Serves 4</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-500 text-sm">★★★★★</div>
                  <span className="text-xs text-gray-500 ml-1">(2,847 reviews)</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm md:text-base font-medium mb-3">I need this recipe to be:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Gluten-free', 'Dairy-free', 'Low-carb', 'Vegetarian'].map(diet => (
                  <Button
                    key={diet}
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setDemoPreference(diet);
                      trackEvent('demo_diet_selected', {
                        diet: diet,
                        variant: demoHeadlineVariant
                      });
                    }}
                    className={`${demoPreference === diet ? 'bg-green-100 border-green-500' : ''} h-auto py-3 px-4 text-sm md:text-base min-h-[48px] touch-manipulation`}
                  >
                    {diet}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 mb-4"
              onClick={() => {
                setCurrentStep('email');
                trackEvent('demo_conversion', {
                  variant: demoHeadlineVariant,
                  selected_diet: demoPreference
                });
              }}
              disabled={!demoPreference}
            >
              {ctaVariant}
            </Button>

            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{socialProofVariant}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>30 second adaptation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmailStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">🎉</div>
        <CardTitle>That Was Just a Preview!</CardTitle>
        <p className="text-gray-600">
          Get your full {demoPreference.toLowerCase()} adapted recipe + 4 more free adaptations
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email for your adapted recipe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Choose a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setCurrentStep('profile')}
            disabled={!email || !password}
          >
            Get MY {demoPreference} Chicken Alfredo Recipe
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            No spam. Unsubscribe anytime. 5 free adaptations included.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderProfileStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome to KitchenSync! 🎉</CardTitle>
        <p className="text-gray-600">
          Let's personalize your cooking experience in 30 seconds
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cooking confidence */}
          <div>
            <h3 className="font-bold mb-4">How confident are you in the kitchen?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { level: 'beginner', label: 'Kitchen Newbie', desc: 'I burn water 🔥', icon: '🆘' },
                { level: 'intermediate', label: 'Home Cook', desc: 'I can follow recipes 👨‍🍳', icon: '👩‍🍳' },
                { level: 'advanced', label: 'Kitchen Pro', desc: 'I improvise with confidence 🌟', icon: '🏆' }
              ].map(option => (
                <div
                  key={option.level}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    cookingLevel === option.level ? 'border-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => {
                    setCookingLevel(option.level as CookingLevel);
                    trackEvent('onboarding_cooking_level_selected', {
                      level: option.level,
                      step: currentStep
                    });
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dynamic Social Proof - Shows when cooking level is selected */}
          {cookingLevel && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="flex -space-x-2 mr-3">
                  <div className="w-8 h-8 rounded-full bg-green-200 border-2 border-white flex items-center justify-center text-xs">👩</div>
                </div>
                <div>
                  <div className="font-bold text-green-800 text-sm">{getDynamicSocialProof().name}</div>
                  <div className="text-xs text-green-600">{getDynamicSocialProof().level} • {getDynamicSocialProof().adaptations}</div>
                </div>
              </div>
              <p className="text-sm text-green-700 italic">
                "{getDynamicSocialProof().testimonial}"
              </p>
            </div>
          )}

          {/* Dietary preferences */}
          <div>
            <h3 className="font-bold mb-4">Any dietary preferences?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dietaryOptions.map(option => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDiets.includes(option.id)}
                    onChange={() => toggleDiet(option.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Don't worry, you can change these anytime!
            </p>
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentStep('goals')}
            disabled={!cookingLevel}
          >
            Continue Setup →
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderGoalsStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>What's your main cooking goal?</CardTitle>
        <p className="text-gray-600">
          We'll customize your experience based on what matters most to you
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { id: 'save_time', label: 'Save time on meal planning', icon: '⏰', benefit: 'Get quick 15-minute recipes' },
            { id: 'eat_healthier', label: 'Eat healthier without sacrificing taste', icon: '🥗', benefit: 'Nutritious recipes you\'ll actually crave' },
            { id: 'save_money', label: 'Save money on groceries', icon: '💰', benefit: 'Match recipes to sales & save 40%' },
            { id: 'learn_cooking', label: 'Learn new cooking skills', icon: '📚', benefit: 'Step-by-step guidance & tips' }
          ].map(goal => (
            <div
              key={goal.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center transition-colors ${
                cookingGoal === goal.id ? 'border-green-500 bg-green-50' : ''
              }`}
              onClick={() => setCookingGoal(goal.id as CookingGoal)}
            >
              <span className="text-3xl mr-4">{goal.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{goal.label}</div>
                <div className="text-sm text-gray-600">{goal.benefit}</div>
              </div>
              {cookingGoal === goal.id && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full mt-6 bg-green-600 hover:bg-green-700"
          onClick={handleSignup}
          disabled={!cookingGoal || loading}
        >
          {loading ? 'Creating Your Account...' : 'Create My KitchenSync Account →'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderFirstRecipeStep = () => {
    const message = getPersonalizedMessage();

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Perfect! Here's Your First Recipe</CardTitle>
          <p className="text-gray-600">
            Based on your preferences, this {cookingLevel === 'beginner' ? 'foolproof' : 'delicious'} recipe is perfect for you
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <img
                src="/api/placeholder/80/80"
                className="w-20 h-20 rounded-lg mr-4"
                alt="Recommended recipe"
              />
              <div>
                <h4 className="font-bold text-lg">{getBenefitTitle()}</h4>
                <p className="text-sm text-gray-600">Perfect for {cookingLevel} skill level</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm">30 minutes</span>
                  <span className="text-sm ml-3">Serves 4</span>
                </div>
              </div>
            </div>

            {/* Success confidence boosters */}
            <div className="bg-white p-3 rounded border mb-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Why this recipe is perfect for you:</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Matches your {selectedDiets.join(' & ') || 'dietary'} needs</li>
                <li>✓ Perfect for {cookingLevel} skill level</li>
                <li>✓ Helps you {cookingGoal === 'save_time' ? 'save time on meal planning' :
                  cookingGoal === 'eat_healthier' ? 'eat healthier without sacrificing taste' :
                  cookingGoal === 'save_money' ? 'save money on groceries' : 'learn new cooking skills'}</li>
                <li>✓ 94% success rate - nearly impossible to mess up!</li>
              </ul>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-3 mb-3"
              onClick={() => {
                trackEvent('onboarding_completed', {
                  cooking_level: cookingLevel,
                  dietary_preferences: selectedDiets,
                  cooking_goal: cookingGoal,
                  demo_preference: demoPreference,
                  total_steps: steps.length,
                  completion_time: Date.now() // You could track actual start time
                });
                navigate('/dashboard');
                onComplete?.();
              }}
            >
              Start Cooking - Get MY Adapted Recipe 🍽️
            </Button>

            {/* Social proof */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-green-200 border-2 border-white flex items-center justify-center text-xs">👩</div>
                  <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xs">👨</div>
                  <div className="w-6 h-6 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-xs">👩</div>
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  Sarah, Mike and 847+ others made this recipe successfully
                </span>
              </div>
            </div>
          </div>

          {/* Post-Onboarding Success Momentum */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-6 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-bold text-lg text-yellow-800">Welcome to KitchenSync!</h3>
              <p className="text-sm text-yellow-700">
                You're now part of a community of {cookingLevel === 'beginner' ? 'successful home cooks' : cookingLevel === 'intermediate' ? 'confident chefs' : 'culinary innovators'}!
              </p>
            </div>

            {/* Momentum Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-white/80 p-3 rounded">
                <div className="text-xl font-bold text-green-600">4</div>
                <div className="text-xs text-gray-600">Free adaptations left</div>
              </div>
              <div className="text-center bg-white/80 p-3 rounded">
                <div className="text-xl font-bold text-blue-600">$12.50</div>
                <div className="text-xs text-gray-600">Avg monthly savings</div>
              </div>
            </div>

            {/* Next Steps for Habit Formation */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-yellow-800">What would you like to do next?</h4>
              <div className="space-y-2">
                {[
                  {
                    action: 'browse_recipes',
                    title: 'Discover More Recipes',
                    desc: 'Browse our collection of 10,000+ adaptable recipes',
                    icon: '📖',
                    commitment: 'low'
                  },
                  {
                    action: 'build_collection',
                    title: 'Start a Recipe Collection',
                    desc: 'Save recipes you want to try and organize by theme',
                    icon: '📚',
                    commitment: 'medium'
                  },
                  {
                    action: 'plan_week',
                    title: 'Plan This Week\'s Meals',
                    desc: 'Get grocery list + meal plan for the whole week',
                    icon: '📅',
                    commitment: 'high'
                  }
                ].map(step => (
                  <div
                    key={step.action}
                    className="p-3 border border-yellow-300 rounded-lg cursor-pointer hover:bg-white/50 transition-colors"
                    onClick={() => {
                      alert(`🚀 Next: ${step.title}\n\n${step.desc}\n\nThis would navigate to the ${step.action.replace('_', ' ')} section.`);
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{step.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-gray-600">{step.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 py-4 md:py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Mobile-Optimized Progress indicator */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm md:text-base text-gray-600">Step {currentStepIndex + 1} of {steps.length}</span>
            <span className="text-sm md:text-base text-gray-600">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2 md:h-3" />
        </div>

        {/* Step content */}
        {currentStep === 'demo' && renderDemoStep()}
        {currentStep === 'email' && renderEmailStep()}
        {currentStep === 'profile' && renderProfileStep()}
        {currentStep === 'goals' && renderGoalsStep()}
        {currentStep === 'first-recipe' && renderFirstRecipeStep()}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          <div className="flex space-x-2">
            {currentStep !== 'demo' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = steps.indexOf(currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as OnboardingStep);
                  }
                }}
                className="px-4 py-2 text-sm"
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                // Handle next step logic based on current step
                if (currentStep === 'demo' && demoPreference) {
                  setCurrentStep('email');
                } else if (currentStep === 'email' && email && password) {
                  setCurrentStep('profile');
                } else if (currentStep === 'profile' && cookingLevel) {
                  setCurrentStep('goals');
                } else if (currentStep === 'goals' && cookingGoal) {
                  handleSignup();
                } else if (currentStep === 'first-recipe') {
                  navigate('/dashboard');
                  onComplete?.();
                }
              }}
              disabled={
                (currentStep === 'demo' && !demoPreference) ||
                (currentStep === 'email' && (!email || !password)) ||
                (currentStep === 'profile' && !cookingLevel) ||
                (currentStep === 'goals' && !cookingGoal)
              }
              className="px-6 py-2 text-sm bg-green-600 hover:bg-green-700"
            >
              {currentStep === 'first-recipe' ? 'Start Cooking! 🍽️' : 'Continue →'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add bottom padding on mobile to account for fixed navigation */}
      <div className="md:hidden h-20" />
    </div>
  );
};
