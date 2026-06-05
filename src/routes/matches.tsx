import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMatchModal } from "@/components/CreateMatchModal";
import { completeMatch, fetchMatches, fetchProfile, fetchSession, formatEnumLabel, type MatchRow } from "@/lib/supabase-api";
import { canManageAcademyUi } from "@/lib/role-access";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
  head: () => ({
    meta: [{ title: "Matches — CricketIQ" }],
  }),
});

function MatchesPage() {
  const queryClient = useQueryClient();
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [completingMatch, setCompletingMatch] = useState<MatchRow | null>(null);
  const [completeForm, setCompleteForm] = useState({
    teamRuns: "",
    teamWickets: "",
    opponentRuns: "",
    opponentWickets: "",
    resultSummary: "",
    notes: "",
  });
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const matchesQuery = useQuery({
    queryKey: ["matches", profileQuery.data?.academy_id],
    queryFn: () => fetchMatches(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });

  const upcoming = (matchesQuery.data ?? []).filter((match) => match.status === "scheduled");
  const history = (matchesQuery.data ?? []).filter((match) => match.status === "completed");
  const canManageMatches = canManageAcademyUi(profileQuery.data?.role);
  const openMatchWindow = (matchId: string) => {
    window.open(`/matches/${matchId}`, "_blank", "noopener,noreferrer");
  };
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!completingMatch) throw new Error("No match selected.");
      return completeMatch(completingMatch.id, {
        teamRuns: Number(completeForm.teamRuns),
        teamWickets: Number(completeForm.teamWickets),
        opponentRuns: Number(completeForm.opponentRuns),
        opponentWickets: Number(completeForm.opponentWickets),
        resultSummary: completeForm.resultSummary,
        notes: completeForm.notes || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setCompletingMatch(null);
      setCompleteForm({
        teamRuns: "",
        teamWickets: "",
        opponentRuns: "",
        opponentWickets: "",
        resultSummary: "",
        notes: "",
      });
    },
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Matches</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track all matches</p>
        </div>
        {canManageMatches && (
          <Button variant="cricket" size="sm" onClick={() => setShowCreateMatch(true)}>
            <Plus className="w-3.5 h-3.5" /> New Match
          </Button>
        )}
      </div>

      <div className="section-title">Upcoming</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcoming.map((match) => (
          <div
            key={match.id}
            className="stat-card space-y-2 cursor-pointer hover:border-cricket-red transition-colors"
            onClick={() => openMatchWindow(match.id)}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-left text-sm font-bold hover:text-cricket-red"
                onClick={(event) => {
                  event.stopPropagation();
                  openMatchWindow(match.id);
                }}
              >
                {match.match_name ? `${match.match_name} · ` : ""}vs {match.opponent_name}
              </button>
              <span className="cricket-badge badge-red">T{match.overs}</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{new Date(match.scheduled_at).toLocaleDateString()}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{match.ground ?? match.venue ?? "Venue TBD"}</div>
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {formatEnumLabel(match.match_format)} · {formatEnumLabel(match.status)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  openMatchWindow(match.id);
                }}
              >
                Open match
              </Button>
              {canManageMatches && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCompletingMatch(match);
                    setCompleteForm({
                      teamRuns: match.team_runs?.toString() ?? "",
                      teamWickets: match.team_wickets?.toString() ?? "",
                      opponentRuns: match.opponent_runs?.toString() ?? "",
                      opponentWickets: match.opponent_wickets?.toString() ?? "",
                      resultSummary: match.result_summary ?? "",
                      notes: match.notes ?? "",
                    });
                  }}
                >
                  Mark completed
                </Button>
              )}
            </div>
          </div>
        ))}
        {upcoming.length === 0 && <div className="stat-card col-span-full text-sm text-muted-foreground">No upcoming matches yet.</div>}
      </div>

      <div className="section-title">Match History</div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Date</th>
              <th>Format</th>
              <th>Score</th>
              <th>Opp Score</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map((match) => (
              <tr
                key={match.id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openMatchWindow(match.id)}
              >
                <td className="font-semibold">{match.opponent_name}</td>
                <td className="text-muted-foreground">{new Date(match.scheduled_at).toLocaleDateString()}</td>
                <td><span className="cricket-badge badge-dark">{formatEnumLabel(match.match_format)}</span></td>
                <td className="font-mono">{match.team_runs ?? "-"}/{match.team_wickets ?? "-"}</td>
                <td className="font-mono">{match.opponent_runs ?? "-"}/{match.opponent_wickets ?? "-"}</td>
                <td className={`font-semibold ${match.result_summary?.startsWith("Won") ? "text-cricket-green" : "text-cricket-red"}`}>
                  {match.result_summary ?? "Completed"}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                  No completed matches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CreateMatchModal open={showCreateMatch} onClose={() => setShowCreateMatch(false)} />

      {completingMatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setCompletingMatch(null)}>
          <div className="w-full max-w-lg border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold">Complete Match</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the final scores to move this match into history.
              </p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Our runs</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={completeForm.teamRuns} onChange={(event) => setCompleteForm({ ...completeForm, teamRuns: event.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Our wickets</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={completeForm.teamWickets} onChange={(event) => setCompleteForm({ ...completeForm, teamWickets: event.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Opponent runs</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={completeForm.opponentRuns} onChange={(event) => setCompleteForm({ ...completeForm, opponentRuns: event.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Opponent wickets</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={completeForm.opponentWickets} onChange={(event) => setCompleteForm({ ...completeForm, opponentWickets: event.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Result summary</label>
                <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={completeForm.resultSummary} onChange={(event) => setCompleteForm({ ...completeForm, resultSummary: event.target.value })} placeholder="Won by 5 wickets" />
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Notes</label>
                <textarea className="mt-1 h-20 w-full border border-input bg-background px-3 py-2" value={completeForm.notes} onChange={(event) => setCompleteForm({ ...completeForm, notes: event.target.value })} placeholder="Optional match notes" />
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                className="flex-1 border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
                onClick={() => setCompletingMatch(null)}
                disabled={completeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 bg-cricket-red px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? "Saving..." : "Save as completed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
