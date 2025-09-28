import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { PricingCard } from "@/components/subscription/PricingCard";

export default function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuthSession();

  // Logout button handler
  async function handleLogout() {
    await supabase.auth.signOut();
    // Optionally, you may redirect to home
    navigate("/");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-yellow-50 py-0">
      <nav className="container flex justify-between items-center py-6">
        <div>
          <span className="text-2xl md:text-3xl font-extrabold text-primary">KitchenSync</span>
        </div>
        <div className="flex gap-2">
          {session ? (
            <>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to App
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button variant="default" onClick={() => navigate("/demo")}>Try Demo</Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center text-center pt-10 pb-16">
        {/* 4-U Formula Headline: Useful, Unique, Urgent, Ultra-specific */}
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-4xl mb-5 bg-gradient-to-r from-green-600 via-lime-500 to-yellow-400 text-transparent bg-clip-text animate-fade-in">
          Stop Letting Dietary Restrictions Ruin Your Favorite Recipes
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl">
          Adapt any recipe for gluten-free, keto, vegan, or any diet in 30 seconds. 
          Plus match ingredients to grocery sales and save $150/month.
        </p>
        
        {/* Social proof above CTA */}
        <div className="flex items-center justify-center mb-6 space-x-4">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-200 border-2 border-white flex items-center justify-center text-sm">👩</div>
            <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-sm">👨</div>
            <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-sm">👩</div>
          </div>
          <span className="text-sm text-gray-600">
            <strong>10,247 home cooks</strong> adapted recipes this week
          </span>
        </div>
        
        {/* Loss Aversion & Urgency Elements */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-2">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="font-bold text-yellow-800 text-sm">Limited Time Offer</span>
          </div>
          <p className="text-sm text-yellow-700 text-center">
            🎁 <strong>Early Access Bonus:</strong> Sign up in the next <span className="font-bold">24 hours</span> and get <strong>20 free recipe adaptations</strong> instead of 5!
          </p>
        </div>

        {/* First-person CTA psychology */}
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-xl px-8 py-4 mb-2 shadow-lg" onClick={() => navigate('/auth')}>
          Get MY Free Recipe Adaptations →
        </Button>
        <div className="text-sm text-gray-600 mb-4">Start with 5 free adaptations. No credit card required.</div>
        
        {/* Interactive Demo - Integrated from Onboarding Flow */}
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
          <div className="text-center mb-6">
            <h3 className="font-bold text-lg mb-2">🍽️ Try the Recipe Adapter - No Signup Required!</h3>
            <p className="text-sm text-gray-600">See how any recipe transforms for your dietary needs</p>
          </div>

          {/* Demo Recipe Preview */}
          <div className="demo-card bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 rounded-lg mb-4">
            <div className="flex items-center mb-3">
              <img
                src="https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80"
                className="w-16 h-16 rounded-lg mr-4 object-cover"
                alt="Classic Chicken Alfredo"
              />
              <div>
                <h4 className="font-bold">Classic Chicken Alfredo</h4>
                <p className="text-sm text-gray-600">30 minutes • Serves 4</p>
                <div className="flex text-yellow-500 text-sm mt-1">
                  ★★★★★ <span className="text-gray-500 ml-1">(2,847 reviews)</span>
                </div>
              </div>
            </div>

            {/* Interactive Dietary Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">👉 Click to adapt this recipe for:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { diet: 'Gluten-free', benefit: '15-Minute Gluten-Free Alfredo That Actually Tastes Amazing' },
                  { diet: 'Dairy-free', benefit: 'Creamy Dairy-Free Pasta That Fooled My Italian Grandmother' },
                  { diet: 'Low-carb', benefit: 'Satisfying Low-Carb "Pasta" That Curbs Cravings for Hours' },
                  { diet: 'Vegetarian', benefit: 'Protein-Packed Vegetarian Bowl That Beats Any Takeout' }
                ].map(option => (
                  <button
                    key={option.diet}
                    className="p-3 border rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors text-left"
                    onClick={() => {
                      alert(`✨ Demo: "${option.benefit}"\n\nIn the full app, this would instantly adapt the recipe with:\n• Modified ingredients\n• Adjusted cooking instructions\n• Nutritional information\n• Grocery sale matching`);
                    }}
                  >
                    <div className="font-medium text-sm">{option.diet}</div>
                    <div className="text-xs text-gray-600 mt-1">Click to see!</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Social Proof */}
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-1">👩‍🍳</span>
                <span>10,247 adapted this week</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-1">⚡</span>
                <span>30 second adaptation</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 mb-2"
              onClick={() => navigate('/demo')}
            >
              See More Demo Recipes →
            </Button>
            <p className="text-xs text-gray-500">Experience the full collection</p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-white/70 py-12 md:py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Tired of...</h2>
          <ul className="space-y-3 text-lg text-gray-700 mb-4 pl-5 list-disc">
            <li>Scrambling to find dinner ideas while grocery prices skyrocket?</li>
            <li>Discovering you're missing a key ingredient halfway through cooking?</li>
            <li>Having recipes scattered across bookmarks, screenshots, and family texts?</li>
            <li>Adapting recipes for dietary needs with guesswork and disappointing results?</li>
          </ul>
          <p className="mt-4 text-gray-700">
            Most recipe apps just store recipes. <b>KitchenSync</b> solves your entire meal journey – from inspiration to grocery shopping to serving the perfect plate.
          </p>
        </div>
      </section>

      {/* Agitation Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-50 via-yellow-100 to-green-50">
        <div className="container max-w-3xl text-center md:text-left">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Lose the Waste, Not the Flavor</h2>
          <p className="text-base md:text-lg text-gray-800">
            Every week, Americans waste 30% of their grocery budget on forgotten ingredients and impulse purchases. Meanwhile, dietary restrictions turn meal planning into a frustrating puzzle of substitutions and compromises. <b>The disconnection between recipes, shopping, and real-world budgets costs you time, money, and peace of mind.</b>
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="container py-12 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">KitchenSync brings harmony to your kitchen with four powerful tools:</h2>
        <div className="grid md:grid-cols-2 gap-7">
          <div className="bg-white rounded-xl shadow p-6 border border-green-100 animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-green-700">Smart Recipe Collection</h3>
            <p className="text-gray-700">Import recipes from any website or add your own family favorites. Organize everything in custom collections that make sense for your life – weeknight dinners, kid-friendly meals, entertaining favorites.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-green-100 animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-green-700">Sale-Smart Shopping</h3>
            <p className="text-gray-700">KitchenSync automatically highlights ingredients on sale at your local stores, helping you save up to 30% on your grocery bills. Add ingredients to your smart shopping list with one tap.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-green-100 animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-green-700">Dietary Adaptation Magic</h3>
            <p className="text-gray-700">Transform any recipe for your dietary needs with our AI-powered adaptation tool. Gluten-free, dairy-free, vegan – we don't just substitute ingredients, we preserve the flavor and texture you love.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-green-100 animate-fade-in">
            <h3 className="font-semibold text-lg mb-2 text-green-700">Streamlined Cooking</h3>
            <p className="text-gray-700">Clear, step-by-step instructions with integrated cooking timers make execution foolproof. Scale recipes up or down with perfect proportions every time.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            title="Free"
            price="$0"
            features={[
              "5 recipe adaptations/month",
              "Unlimited recipe imports",
              "Basic shopping lists",
            ]}
          />
          <PricingCard
            title="Pro"
            price="$9.99/month"
            features={[
              "Unlimited adaptations",
              "Grocery sale matching",
              "Priority support",
              "Export to PDF",
            ]}
            highlighted={true}
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-green-50 py-10 md:py-16">
        <div className="max-w-2xl mx-auto text-center px-0 md:px-8">
          <div className="italic text-xl text-gray-700 mb-2">&quot;KitchenSync saved my weeknights. I imported all my favorite recipes, and now I meal plan around what&apos;s on sale. I&apos;m saving at least $60 a week, and my family thinks I&apos;ve become a better cook!&quot;</div>
          <div className="text-gray-600 mt-2">– Sarah, Working Parent of Three</div>
        </div>
      </section>

      {/* FOMO Premium Preview */}
      <section className="container py-12 md:py-16">
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border border-yellow-200 rounded-2xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-yellow-600 mr-2">👑</span>
              <span className="font-bold text-yellow-800">Pro Cook Features</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">See What You're Missing!</h3>
            <p className="text-gray-700">Pro users get these exclusive features (and save $150+/month)</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/80 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <span className="text-green-500 mr-2">💰</span>
                <span className="font-bold text-green-700">Grocery Sale Matching</span>
              </div>
              <p className="text-sm text-gray-600">Pro users save 30% on groceries by automatically matching recipe ingredients to local sales</p>
            </div>
            <div className="bg-white/80 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-2">⚡</span>
                <span className="font-bold text-blue-700">Unlimited Adaptations</span>
              </div>
              <p className="text-sm text-gray-600">Adapt every recipe in your collection without monthly limits</p>
            </div>
            <div className="bg-white/80 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <span className="text-purple-500 mr-2">📱</span>
                <span className="font-bold text-purple-700">Priority Support</span>
              </div>
              <p className="text-sm text-gray-600">Get help from real chefs when you need recipe customization advice</p>
            </div>
            <div className="bg-white/80 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <span className="text-orange-500 mr-2">📄</span>
                <span className="font-bold text-orange-700">Export to PDF</span>
              </div>
              <p className="text-sm text-gray-600">Print beautiful, formatted recipe cards for your kitchen</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4 inline-block">
              <p className="text-sm font-bold text-yellow-800">
                🔥 Only $9.99/month • Cancel anytime • 30-day money-back guarantee
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
              onClick={() => navigate('/auth')}
            >
              Upgrade to Pro & Save $150/Month →
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="container py-12 md:py-16">
        <div className="bg-gradient-to-br from-green-100 via-white to-yellow-50 border shadow-lg rounded-2xl md:flex items-center px-6 py-8 md:gap-10">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-green-900 mb-2">Our AI Recipe Adaptation</h4>
            <div className="text-base md:text-lg text-gray-700 mb-3 font-medium">The feature everyone's talking about</div>
            <p className="text-gray-800">
              Not just basic substitutions – KitchenSync's AI understands the chemistry of cooking. When we adapt a recipe to be gluten-free or dairy-free, we preserve texture, flavor, and cooking techniques. Your dietary restrictions should never mean settling for less delicious meals.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action & Secondary CTA */}
      <section className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <Button size="lg" variant="app" className="px-8 py-4 shadow-md mb-2 md:mb-0" onClick={() => alert('Download coming soon!')}>
            Get KitchenSync – Free 14-Day Trial
          </Button>
        </div>
        <div>
          <div className="text-sm text-gray-700 mb-1 md:text-right">Join 50,000+ home cooks who've reduced meal planning stress and grocery bills with KitchenSync.</div>
          <Button variant="outline" size="lg" className="px-8" onClick={() => alert('See How It Works coming soon!')}>
            See How It Works
          </Button>
        </div>
      </section>
      <footer className="text-center text-xs text-gray-400 py-5">
        &copy; {new Date().getFullYear()} KitchenSync – Recipe Manager
      </footer>
    </div>
  );
}
