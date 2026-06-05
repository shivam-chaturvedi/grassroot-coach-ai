import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/supabase-api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — CricketIQ" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { session } = await signIn(email, password);
      if (session) {
        queryClient.setQueryData(["session"], session);
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        await queryClient.invalidateQueries({ queryKey: ["academy"] });
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
      await navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CricketIQ</div>
          <h1 className="mt-2 text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Use your account to access the dashboard.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              className="mt-1 w-full h-10 px-3 border border-input bg-background"
              type="text"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
            <input
              className="mt-1 w-full h-10 px-3 border border-input bg-background"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-cricket-red">{error}</div>}
          <Button variant="cricket" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          New here? <Link to="/signup" className="text-cricket-red font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
