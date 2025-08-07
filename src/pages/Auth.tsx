
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  // Check if coming from landing page or direct signup intent
  const urlParams = new URLSearchParams(window.location.search);
  const isSignupFlow = urlParams.get('flow') === 'signup' || mode === 'signup';

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
    // If successful, redirection will be handled by session effect in App.tsx
  }

  // Show full onboarding for new signups
  if (showOnboarding || (isSignupFlow && mode === 'signup')) {
    return (
      <OnboardingFlow 
        onComplete={() => {
          navigate('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-primary">KitchenSync</h1>
        
        {/* Enhanced mode selector */}
        <div className="flex justify-center mb-6">
          <Button 
            variant={mode === "login" ? "default" : "outline"} 
            className="mr-2" 
            onClick={() => setMode("login")}
          >
            Login
          </Button>
          <Button 
            variant={mode === "signup" ? "default" : "outline"} 
            onClick={() => {
              setMode("signup");
              // For new signups, show enhanced onboarding
              if (isSignupFlow) {
                setShowOnboarding(true);
              }
            }}
          >
            Sign Up
          </Button>
        </div>
        
        {/* Quick value prop for signup mode */}
        {mode === 'signup' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-center">
            <p className="text-sm text-green-800 font-medium">🎉 Join 10,000+ home cooks</p>
            <p className="text-xs text-green-700">Adapt any recipe to your diet in 30 seconds</p>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm mb-1 font-medium" htmlFor="email">
              Email
            </label>
            <Input 
              id="email" 
              type="email" 
              autoComplete="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              disabled={loading} 
              required 
              placeholder={mode === 'signup' ? 'Enter your email to get started' : 'Your email'}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium" htmlFor="password">
              Password
            </label>
            <Input 
              id="password" 
              type="password" 
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={loading} 
              required
              placeholder={mode === 'signup' ? 'Choose a secure password' : 'Your password'}
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 
              (mode === "login" ? "Logging in..." : "Creating account...") : 
              (mode === "login" ? "Login" : "Get MY Free Recipe Adaptations →")
            }
          </Button>
        </form>
        
        {/* Enhanced footer */}
        {mode === 'signup' && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-600">
              🆓 Start with 5 free adaptations • No credit card required
            </p>
          </div>
        )}
        
        <div className="text-center mt-4">
          <span className="text-xs text-gray-500">
            {mode === 'signup' ? 'By signing up, you agree to our Terms of Service.' : ''}
          </span>
        </div>
        
        <div className="mt-6 flex justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Back to Home
          </Button>
          {mode === 'login' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOnboarding(true)}
            >
              New? Try Demo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
