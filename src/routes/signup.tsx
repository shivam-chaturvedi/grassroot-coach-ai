import { Navigate, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";
import { fetchSession, signIn, signUp } from "@/lib/supabase-api";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Signup — CricketIQ" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const signupResult = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      });

      if (signupResult.session) {
        queryClient.setQueryData(["session"], signupResult.session);
        await navigate({ to: "/onboarding", replace: true });
        return;
      }

      try {
        const loginResult = await signIn(form.email, form.password);
        if (loginResult.session) {
          queryClient.setQueryData(["session"], loginResult.session);
          await navigate({ to: "/onboarding", replace: true });
          return;
        }
      } catch {
        // If account confirmation is required, the user will need to sign in later.
      }

      setInfo("Account created. Sign in to continue setup if your session did not start automatically.");
      await navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (sessionQuery.data) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AuthShell
      eyebrow="Start your setup"
      title="Create your account and launch your cricket workspace."
      description="Set up your academy, organize your squad, and start tracking player growth, match performance, and coaching actions in one place."
      panelLabel="What you get"
      panelTitle="One platform for player intel, match operations, and academy growth."
      panelDescription="From onboarding to performance reviews, CricketIQ helps your staff stay aligned while giving players a clearer development journey."
      form={(
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full name</label>
            <input
              className="mt-1 w-full h-11 px-3 border border-input bg-background"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              className="mt-1 w-full h-11 px-3 border border-input bg-background"
              type="text"
              inputMode="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
            <input
              className="mt-1 w-full h-11 px-3 border border-input bg-background"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
          {error && <div className="text-sm text-cricket-red">{error}</div>}
          {info && <div className="text-sm text-cricket-green">{info}</div>}
          <Button variant="cricket" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      )}
      footer={(
        <p>
          Already have an account? <Link to="/login" className="font-semibold text-cricket-red">Sign in</Link>
        </p>
      )}
    />
  );
}
