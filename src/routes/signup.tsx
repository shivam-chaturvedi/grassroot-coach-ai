import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/supabase-api";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Signup — CricketIQ" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CricketIQ</div>
          <h1 className="mt-2 text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your account first.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full name</label>
            <input className="mt-1 w-full h-10 px-3 border border-input bg-background" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
            <input className="mt-1 w-full h-10 px-3 border border-input bg-background" type="text" inputMode="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
            <input className="mt-1 w-full h-10 px-3 border border-input bg-background" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
          {error && <div className="text-sm text-cricket-red">{error}</div>}
          {info && <div className="text-sm text-cricket-green">{info}</div>}
          <Button variant="cricket" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-cricket-red font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
