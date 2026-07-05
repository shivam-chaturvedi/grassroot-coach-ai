import { Navigate, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";
import { fetchSession, signIn } from "@/lib/supabase-api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — CricketIQ" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
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
      await navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  if (sessionQuery.data) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your cricket operations hub."
      description="Manage players, matches, training feedback, and AI-powered insights from one platform built for modern cricket academies."
      panelLabel="Explore the app"
      panelTitle="The operating system for cricket academies that want sharper decisions."
      panelDescription="CricketIQ brings player development, match workflow, selection context, and analytics into one calm, high-visibility workspace."
      form={(
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              className="mt-1 w-full h-11 px-3 border border-input bg-background"
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
              className="mt-1 w-full h-11 px-3 border border-input bg-background"
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
      )}
      footer={(
        <p>
          New here? <Link to="/signup" className="font-semibold text-cricket-red">Create an account</Link>
        </p>
      )}
    />
  );
}
