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
              <Button variant="app" onClick={() => navigate("/dashboard")}>Try Demo</Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center text-center pt-10 pb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl mb-5 bg-gradient-to-r from-green-600 via-lime-500 to-yellow-400 text-transparent bg-clip-text animate-fade-in">
          Meal Planning Chaos to Kitchen Calm: Your Recipes, Your Budget, Your Way
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl">
          Save time, money, and stress with the only recipe app that connects your favorite meals to local grocery sales.
        </p>
        <Button size="lg" variant="app" className="text-lg px-8 py-4 mb-4 shadow-md" onClick={() => alert('Download coming soon!')}>
          Get KitchenSync – Free 14-Day Trial
        </Button>
        <div className="text-xs text-gray-500">Download KitchenSync free for 14 days. Import your first recipe in under 60 seconds and discover how peaceful meal planning can be.</div>
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

      {/* Feature Highlight */}
      <section className="container py-12 md:py-16">
        <div className="bg-gradient-to-br from-green-100 via-white to-yellow-50 border shadow-lg rounded-2xl md:flex items-center px-6 py-8 md:gap-10">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-green-900 mb-2">Our AI Recipe Adaptation</h4>
            <div className="text-base md:text-lg text-gray-700 mb-3 font-medium">The feature everyone's talking about</div>
            <p className="text-gray-800">
              Not just basic substitutions – KitchenSync&apos;s AI understands the chemistry of cooking. When we adapt a recipe to be gluten-free or dairy-free, we preserve texture, flavor, and cooking techniques. Your dietary restrictions should never mean settling for less delicious meals.
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
