import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Clock3, LogOut, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { labelFromEnum, playerRoles } from "@/lib/lookups";
import {
  createAcademyOnboarding,
  fetchAcademyDirectory,
  fetchMyJoinRequests,
  fetchProfile,
  fetchSession,
  signOut,
  submitAcademyJoinRequest,
} from "@/lib/supabase-api";

type OnboardingRole = "coach" | "player";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Onboarding — CricketIQ" }] }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
    staleTime: 60_000,
  });

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<OnboardingRole>("coach");
  const [coachForm, setCoachForm] = useState({
    academyName: "",
    academySlug: "",
    foundedYear: "",
  });
  const [playerRole, setPlayerRole] = useState<(typeof playerRoles)[number]>("batsman");
  const [academySearch, setAcademySearch] = useState("");
  const [academySort, setAcademySort] = useState<"name" | "rank" | "newest">("name");
  const [error, setError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(academySearch);

  const academyDirectoryQuery = useQuery({
    queryKey: ["academy-directory", deferredSearch],
    queryFn: () => fetchAcademyDirectory(deferredSearch),
    enabled: !!sessionQuery.data?.user.id && role === "player" && step === 2,
    staleTime: 30_000,
  });
  const myJoinRequestsQuery = useQuery({
    queryKey: ["my-join-requests"],
    queryFn: fetchMyJoinRequests,
    enabled: !!sessionQuery.data?.user.id,
    staleTime: 15_000,
  });

  const coachMutation = useMutation({
    mutationFn: async () => {
      if (!sessionQuery.data?.user.id) throw new Error("Sign in again to continue.");
      return createAcademyOnboarding(
        sessionQuery.data.user.id,
        {
          academyName: coachForm.academyName,
          academySlug: coachForm.academySlug,
          foundedYear: coachForm.foundedYear ? Number(coachForm.foundedYear) : null,
        },
        "coach",
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", sessionQuery.data?.user.id] });
      await queryClient.invalidateQueries({ queryKey: ["academy"] });
      await navigate({ to: "/", replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to complete setup");
    },
  });

  const requestMutation = useMutation({
    mutationFn: (academyId: string) => submitAcademyJoinRequest(academyId, playerRole),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to send academy request");
    },
  });
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.clear();
      await navigate({ to: "/login", replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to log out right now");
    },
  });

  const pendingRequest = useMemo(
    () => (myJoinRequestsQuery.data ?? []).find((item) => item.status === "pending") ?? null,
    [myJoinRequestsQuery.data],
  );
  const rejectedRequest = useMemo(
    () => (myJoinRequestsQuery.data ?? []).find((item) => item.status === "rejected") ?? null,
    [myJoinRequestsQuery.data],
  );
  const lockedPlayerRequestFlow = !!pendingRequest || !!rejectedRequest;

  const sortedAcademies = useMemo(() => {
    const academies = [...(academyDirectoryQuery.data ?? [])];
    if (academySort === "rank") {
      return academies.sort((a, b) => {
        const left = a.district_rank ?? Number.MAX_SAFE_INTEGER;
        const right = b.district_rank ?? Number.MAX_SAFE_INTEGER;
        return left - right;
      });
    }
    if (academySort === "newest") {
      return academies.sort((a, b) => (b.founded_year ?? 0) - (a.founded_year ?? 0));
    }
    return academies.sort((a, b) => a.name.localeCompare(b.name));
  }, [academyDirectoryQuery.data, academySort]);

  const canContinueCoach = coachForm.academyName.trim().length > 0 && coachForm.academySlug.trim().length > 0;

  useEffect(() => {
    if (!lockedPlayerRequestFlow) return;
    setRole("player");
    setStep(2);
  }, [lockedPlayerRequestFlow]);

  if (sessionQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Preparing setup…</div>
      </div>
    );
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" />;
  }

  if (profileQuery.data?.academy_id) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-3xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Step {step} of 2
                </div>
                <h1 className="mt-2 text-2xl font-bold">
                  {step === 1 ? "Choose your role" : role === "coach" ? "Create academy" : "Find academy"}
                </h1>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {profileQuery.data?.full_name || "New account"}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="inline-flex items-center gap-2 border border-input px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-accent disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-1.5 bg-accent">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: step >= item ? "100%" : "0%" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8 lg:py-8">
            {step === 1 && (
              <div className="space-y-3">
                <RoleCard
                  selected={role === "coach"}
                  title="Coach"
                  description="Create and manage an academy, players, matches, and requests."
                  onClick={() => setRole("coach")}
                />
                <RoleCard
                  selected={role === "player"}
                  title="Player"
                  description="Search for an academy and request access to join its player workspace."
                  onClick={() => setRole("player")}
                />
              </div>
            )}

            {step === 2 && role === "coach" && (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!canContinueCoach) return;
                  setError(null);
                  coachMutation.mutate();
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Academy name
                    </label>
                    <input
                      className="mt-1 w-full h-11 border border-input bg-background px-3"
                      value={coachForm.academyName}
                      onChange={(event) => setCoachForm({ ...coachForm, academyName: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Academy slug
                    </label>
                    <input
                      className="mt-1 w-full h-11 border border-input bg-background px-3"
                      value={coachForm.academySlug}
                      onChange={(event) => setCoachForm({ ...coachForm, academySlug: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Founded year
                    </label>
                    <input
                      className="mt-1 w-full h-11 border border-input bg-background px-3"
                      type="number"
                      value={coachForm.foundedYear}
                      onChange={(event) => setCoachForm({ ...coachForm, foundedYear: event.target.value })}
                    />
                  </div>
                </div>

                {error && <div className="text-sm text-cricket-red">{error}</div>}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={coachMutation.isPending}
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button variant="cricket" disabled={coachMutation.isPending || !canContinueCoach}>
                    {coachMutation.isPending ? "Finishing..." : "Continue to dashboard"}
                    {!coachMutation.isPending && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && role === "player" && (
              <div className="space-y-5">
                {rejectedRequest && !pendingRequest && (
                  <div className="border border-cricket-red/30 bg-cricket-red/5 px-4 py-3 text-sm">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-cricket-red" />
                      <div>
                        <div className="font-semibold text-cricket-red">Request not approved</div>
                        <div className="mt-1 text-foreground">
                          {rejectedRequest.response_message || "You can try searching for another academy."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pendingRequest && (
                  <div className="border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold">Request pending</div>
                        <div className="mt-1 text-muted-foreground">
                          Your academy request is waiting for review. You will be notified when a coach responds.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="h-11 w-full border border-input bg-background pl-10 pr-3"
                      placeholder="Search academies"
                      value={academySearch}
                      onChange={(event) => setAcademySearch(event.target.value)}
                    />
                  </div>
                  <select
                    className="h-11 border border-input bg-background px-3"
                    value={academySort}
                    onChange={(event) => setAcademySort(event.target.value as "name" | "rank" | "newest")}
                  >
                    <option value="name">Sort by name</option>
                    <option value="rank">Sort by rank</option>
                    <option value="newest">Sort by founded year</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Your playing role
                  </label>
                  <select
                    className="mt-1 h-11 w-full border border-input bg-background px-3"
                    value={playerRole}
                    onChange={(event) => setPlayerRole(event.target.value as (typeof playerRoles)[number])}
                    disabled={lockedPlayerRequestFlow}
                  >
                    {playerRoles.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {labelFromEnum(roleOption)}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <div className="text-sm text-cricket-red">{error}</div>}

                <div className="space-y-3">
                  {sortedAcademies.map((academy) => {
                    const hasPendingSomewhere = !!pendingRequest;
                    const isRequestedAcademy = pendingRequest?.academy_id === academy.id;
                    return (
                      <div key={academy.id} className="border border-border bg-background px-4 py-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-base font-semibold">{academy.name}</div>
                            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                              {academy.slug}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Founded: {academy.founded_year ?? "-"}</span>
                              <span>District Rank: {academy.district_rank ? `#${academy.district_rank}` : "-"}</span>
                              <span>State Rank: {academy.state_rank ? `#${academy.state_rank}` : "-"}</span>
                            </div>
                            {academy.address && (
                              <div className="mt-2 text-sm text-muted-foreground">{academy.address}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isRequestedAcademy && (
                              <span className="cricket-badge badge-dark">Pending</span>
                            )}
                            <Button
                              variant="cricket"
                              disabled={requestMutation.isPending || hasPendingSomewhere}
                              onClick={() => {
                                setError(null);
                                requestMutation.mutate(academy.id);
                              }}
                            >
                              {isRequestedAcademy
                                ? "Request sent"
                                : requestMutation.isPending
                                  ? "Sending..."
                                  : "Request to join"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {sortedAcademies.length === 0 && (
                    <div className="border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                      No academies match your search yet.
                    </div>
                  )}
                </div>

                <div className="flex justify-start pt-2">
                  {!lockedPlayerRequestFlow && (
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 1 && !lockedPlayerRequestFlow && (
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="cricket" onClick={() => setStep(2)}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full border px-4 py-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent/70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        <div
          className={[
            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
          ].join(" ")}
        >
          {selected ? <Check className="h-3 w-3" /> : null}
        </div>
      </div>
    </button>
  );
}
