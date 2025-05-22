
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-primary">KitchenSync</h1>
        <div className="flex justify-center mb-6">
          <Button variant={mode === "login" ? "app" : "outline"} className="mr-2" onClick={() => setMode("login")}>Login</Button>
          <Button variant={mode === "signup" ? "app" : "outline"} onClick={() => setMode("signup")}>Sign Up</Button>
        </div>
        <form className="space-y-4" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm mb-1 font-medium" htmlFor="email">Email</label>
            <Input id="email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium" htmlFor="password">Password</label>
            <Input id="password" type="password" autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" variant="app" className="w-full" disabled={loading}>
            {loading ? (mode === "login" ? "Logging in..." : "Signing up...") : (mode === "login" ? "Login" : "Sign Up")}
          </Button>
        </form>
        <div className="text-center mt-6">
          <span className="text-xs text-gray-500">By signing up, you agree to our Terms of Service.</span>
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
