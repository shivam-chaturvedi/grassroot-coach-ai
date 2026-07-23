import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, ShieldCheck, Target, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createMatchStats,
  fetchMatch,
  fetchMatchSquads,
  fetchPlayerMatchStatsForMatch,
  fetchPlayers,
  fetchProfile,
  fetchSession,
  formatEnumLabel,
  type MatchSquadRow,
  type PlayerMatchStatsRow,
  type PlayerRow,
} from "@/lib/supabase-api";
import { canManageAcademyUi } from "@/lib/role-access";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailPage,
  head: () => ({ meta: [{ title: "Match Details" }] }),
});

type EditorState = {
  playerId: string;
  didBat: boolean;
  didBowl: boolean;
  battingOrder: string;
  rolePerformed: string;
  runs: string;
  ballsFaced: string;
  fours: string;
  sixes: string;
  dismissalType: string;
  dismissalDetails: string;
  onesTaken: string;
  twosTaken: string;
  wickets: string;
  oversBowled: string;
  runsConceded: string;
  maidens: string;
  catches: string;
  runOuts: string;
  dotBalls: string;
  stumpings: string;
  droppedCatches: string;
  missedChances: string;
  bowlingSpell: string;
  positiveTags: string;
  mistakeTags: string;
  selfFeedback: string;
  improvementGoal: string;
  selfConfidenceRating: string;
  selfEnergyRating: string;
  selfFocusRating: string;
  pressureHandlingRating: string;
  matchImpactRating: string;
  coachFeedback: string;
  coachActionPoints: string;
  coachTags: string;
  coachRating: string;
  notes: string;
};

function toEditorState(playerId: string, squad: MatchSquadRow | undefined, stats: PlayerMatchStatsRow | undefined): EditorState {
  return {
    playerId,
    didBat: stats?.did_bat ?? !!squad?.batting_position,
    didBowl: stats?.did_bowl ?? false,
    battingOrder: stats?.batting_order?.toString() ?? squad?.batting_position?.toString() ?? "",
    rolePerformed: stats?.role_performed ?? squad?.role_in_match ?? "",
    runs: (stats?.runs ?? 0).toString(),
    ballsFaced: (stats?.balls_faced ?? 0).toString(),
    fours: (stats?.fours ?? 0).toString(),
    sixes: (stats?.sixes ?? 0).toString(),
    dismissalType: stats?.dismissal_type ?? "",
    dismissalDetails: stats?.dismissal_details ?? "",
    onesTaken: (stats?.ones_taken ?? 0).toString(),
    twosTaken: (stats?.twos_taken ?? 0).toString(),
    wickets: (stats?.wickets ?? 0).toString(),
    oversBowled: (stats?.overs_bowled ?? 0).toString(),
    runsConceded: (stats?.runs_conceded ?? 0).toString(),
    maidens: (stats?.maidens ?? 0).toString(),
    catches: (stats?.catches ?? 0).toString(),
    runOuts: (stats?.run_outs ?? 0).toString(),
    dotBalls: (stats?.dot_balls ?? 0).toString(),
    stumpings: (stats?.stumpings ?? 0).toString(),
    droppedCatches: (stats?.dropped_catches ?? 0).toString(),
    missedChances: (stats?.missed_chances ?? 0).toString(),
    bowlingSpell: stats?.bowling_spell ?? "",
    positiveTags: (stats?.positive_tags ?? []).join(", "),
    mistakeTags: (stats?.mistake_tags ?? []).join(", "),
    selfFeedback: stats?.self_feedback ?? "",
    improvementGoal: stats?.improvement_goal ?? "",
    selfConfidenceRating: (stats?.self_confidence_rating ?? 0).toString(),
    selfEnergyRating: (stats?.self_energy_rating ?? 0).toString(),
    selfFocusRating: (stats?.self_focus_rating ?? 0).toString(),
    pressureHandlingRating: (stats?.pressure_handling_rating ?? 0).toString(),
    matchImpactRating: (stats?.match_impact_rating ?? 0).toString(),
    coachFeedback: stats?.coach_feedback ?? "",
    coachActionPoints: stats?.coach_action_points ?? "",
    coachTags: (stats?.coach_tags ?? []).join(", "),
    coachRating: (stats?.coach_rating ?? 0).toString(),
    notes: stats?.notes ?? "",
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const queryClient = useQueryClient();
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [autoOpenedPlayerId, setAutoOpenedPlayerId] = useState<string | null>(null);

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const matchQuery = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatch(matchId),
  });
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const squadsQuery = useQuery({
    queryKey: ["match-squads", matchId],
    queryFn: async () => fetchMatchSquads([matchId]),
  });
  const statsQuery = useQuery({
    queryKey: ["player-match-stats", matchId],
    queryFn: () => fetchPlayerMatchStatsForMatch(matchId),
  });

  const canManage = canManageAcademyUi(profileQuery.data?.role);
  const linkedPlayer = useMemo(() => {
    const players = playersQuery.data ?? [];
    return players.find((item) => item.profile_id === sessionQuery.data?.user.id) ?? null;
  }, [playersQuery.data, sessionQuery.data?.user.id]);

  const squadRows = useMemo(() => {
    const playersById = new Map((playersQuery.data ?? []).map((player) => [player.id, player]));
    const statsByPlayerId = new Map((statsQuery.data ?? []).map((stat) => [stat.player_id, stat]));
    return (squadsQuery.data ?? [])
      .map((squad) => {
        const player = playersById.get(squad.player_id);
        if (!player) return null;
        return {
          squad,
          player,
          stats: statsByPlayerId.get(squad.player_id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.squad.batting_position ?? 99) - (b!.squad.batting_position ?? 99)) as Array<{
        squad: MatchSquadRow;
        player: PlayerRow;
        stats?: PlayerMatchStatsRow;
      }>;
  }, [playersQuery.data, squadsQuery.data, statsQuery.data]);

  const isPlayerAssigned = !!squadRows.find((row) => row.player.id === linkedPlayer?.id);
  const ownSquadRow = squadRows.find((row) => row.player.id === linkedPlayer?.id);
  const match = matchQuery.data;
  const completed = match?.status === "completed";

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editorState) throw new Error("No player selected.");
      return createMatchStats({
        matchId,
        playerId: editorState.playerId,
        didBat: editorState.didBat,
        didBowl: editorState.didBowl,
        battingOrder: editorState.battingOrder ? Number(editorState.battingOrder) : null,
        rolePerformed: editorState.rolePerformed || null,
        runs: Number(editorState.runs || 0),
        ballsFaced: Number(editorState.ballsFaced || 0),
        fours: Number(editorState.fours || 0),
        sixes: Number(editorState.sixes || 0),
        dismissalType: editorState.dismissalType || null,
        dismissalDetails: editorState.dismissalDetails || null,
        onesTaken: Number(editorState.onesTaken || 0),
        twosTaken: Number(editorState.twosTaken || 0),
        wickets: Number(editorState.wickets || 0),
        oversBowled: Number(editorState.oversBowled || 0),
        runsConceded: Number(editorState.runsConceded || 0),
        maidens: Number(editorState.maidens || 0),
        catches: Number(editorState.catches || 0),
        runOuts: Number(editorState.runOuts || 0),
        dotBalls: Number(editorState.dotBalls || 0),
        stumpings: Number(editorState.stumpings || 0),
        droppedCatches: Number(editorState.droppedCatches || 0),
        missedChances: Number(editorState.missedChances || 0),
        bowlingSpell: editorState.bowlingSpell || null,
        positiveTags: parseTags(editorState.positiveTags),
        mistakeTags: parseTags(editorState.mistakeTags),
        selfFeedback: editorState.selfFeedback || null,
        improvementGoal: editorState.improvementGoal || null,
        selfConfidenceRating: Number(editorState.selfConfidenceRating || 0),
        selfEnergyRating: Number(editorState.selfEnergyRating || 0),
        selfFocusRating: Number(editorState.selfFocusRating || 0),
        pressureHandlingRating: Number(editorState.pressureHandlingRating || 0),
        matchImpactRating: Number(editorState.matchImpactRating || 0),
        coachFeedback: canManage ? editorState.coachFeedback || null : null,
        coachActionPoints: canManage ? editorState.coachActionPoints || null : null,
        coachTags: canManage ? parseTags(editorState.coachTags) : [],
        coachRating: canManage ? Number(editorState.coachRating || 0) : 0,
        reviewedByCoachId: canManage ? sessionQuery.data?.user.id ?? null : null,
        notes: editorState.notes || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["player-match-stats", matchId] });
      await queryClient.invalidateQueries({ queryKey: ["player-match-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["player-season-stats"] });
      setEditingPlayerId(null);
      setEditorState(null);
    },
  });

  useEffect(() => {
    if (
      profileQuery.data?.role !== "player" ||
      !completed ||
      !linkedPlayer ||
      !ownSquadRow ||
      editingPlayerId ||
      editorState ||
      autoOpenedPlayerId === linkedPlayer.id
    ) {
      return;
    }

    setEditingPlayerId(linkedPlayer.id);
    setEditorState(toEditorState(linkedPlayer.id, ownSquadRow.squad, ownSquadRow.stats));
    setAutoOpenedPlayerId(linkedPlayer.id);
  }, [
    autoOpenedPlayerId,
    completed,
    editingPlayerId,
    editorState,
    linkedPlayer,
    ownSquadRow,
    profileQuery.data?.role,
  ]);

  if (!matchQuery.data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="stat-card text-sm text-muted-foreground">Match details are not available right now.</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {profileQuery.data?.role === "player" && !isPlayerAssigned && (
        <div className="stat-card border-cricket-red">
          <div className="text-sm font-semibold">You are not selected in this match</div>
          <div className="mt-1 text-xs text-muted-foreground">
            You can still view the match summary, but you will not see a personal analysis form unless you are part of the playing XI.
          </div>
        </div>
      )}

      {profileQuery.data?.role === "player" && isPlayerAssigned && !completed && (
        <div className="stat-card border-cricket-red">
          <div className="text-sm font-semibold">Stats form unlocks after completion</div>
          <div className="mt-1 text-xs text-muted-foreground">
            This match is still {formatEnumLabel(match.status)}, so your post-match analysis form will open once the match is marked completed.
          </div>
        </div>
      )}

      <div className="stat-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {match.match_name ? `${match.match_name} · ` : ""}vs {match.opponent_name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(match.scheduled_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.ground ?? match.venue ?? "Venue TBD"}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <span className="cricket-badge badge-red">{formatEnumLabel(match.match_format)}</span>
            <span className="cricket-badge badge-dark">{formatEnumLabel(match.status)}</span>
            {completed && (
              <div className="text-sm font-semibold">
                {match.team_runs ?? "-"} / {match.team_wickets ?? "-"}{" "}
                <span className="text-muted-foreground">vs</span>{" "}
                {match.opponent_runs ?? "-"} / {match.opponent_wickets ?? "-"}
              </div>
            )}
            {match.result_summary && <div className="text-xs text-muted-foreground">{match.result_summary}</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="space-y-4">
          <div className="section-title">Playing XI</div>
          <div className="grid md:grid-cols-2 gap-3">
            {squadRows.map(({ squad, player, stats }, index) => {
              const isOwnCard = linkedPlayer?.id === player.id;
              const canEditThis =
                completed &&
                (canManage || (profileQuery.data?.role === "player" && isOwnCard));
              const strikeRate = stats && stats.balls_faced > 0 ? ((stats.runs / stats.balls_faced) * 100).toFixed(1) : "0.0";
              const economy = stats && stats.overs_bowled > 0 ? (stats.runs_conceded / stats.overs_bowled).toFixed(2) : "0.00";

              return (
                <div key={player.id} className={`stat-card ${isOwnCard ? "border-cricket-red" : ""}`}>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold" title={player.full_name}>{index + 1}. {player.full_name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        #{player.jersey_number} · {formatEnumLabel(player.player_role)}
                        {squad.role_in_match ? ` · ${squad.role_in_match}` : ""}
                      </div>
                    </div>
                    <div className="flex max-w-[5.5rem] shrink-0 flex-wrap justify-end gap-1">
                      {squad.is_captain && <span className="cricket-badge badge-dark">Captain</span>}
                      {squad.is_vice_captain && <span className="cricket-badge badge-green">Vice</span>}
                      {isOwnCard && <span className="cricket-badge badge-red">You</span>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-sm border border-border bg-background p-2">
                      <div className="text-[0.55rem] uppercase text-muted-foreground">Runs</div>
                      <div className="mt-1 text-sm font-bold font-mono">{stats?.runs ?? 0}</div>
                    </div>
                    <div className="rounded-sm border border-border bg-background p-2">
                      <div className="text-[0.55rem] uppercase text-muted-foreground">SR</div>
                      <div className="mt-1 text-sm font-bold font-mono">{strikeRate}</div>
                    </div>
                    <div className="rounded-sm border border-border bg-background p-2">
                      <div className="text-[0.55rem] uppercase text-muted-foreground">Wkts</div>
                      <div className="mt-1 text-sm font-bold font-mono">{stats?.wickets ?? 0}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Economy: {economy}</div>
                    <div>Impact: {stats?.match_impact_rating ?? 0}/10</div>
                    <div>Confidence: {stats?.self_confidence_rating ?? 0}/10</div>
                    <div>Coach rating: {stats?.coach_rating ?? 0}/10</div>
                  </div>

                  {canEditThis && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPlayerId(player.id);
                          setEditorState(toEditorState(player.id, squad, stats));
                        }}
                      >
                        {canManage ? "Open analysis" : stats ? "Edit my analysis" : "Add my analysis"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {squadRows.length === 0 && <div className="stat-card text-sm text-muted-foreground md:col-span-2">No squad has been selected for this match yet.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-title">Analysis Snapshot</div>
          <div className="tactical-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-cricket-green" /> Team review readiness
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {squadRows.filter((row) => row.stats?.submitted_by_player_at).length} of {squadRows.length} player reviews submitted.
            </div>
          </div>
          <div className="tactical-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="w-4 h-4 text-cricket-red" /> Common mistake themes
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {aggregateTags(squadRows.flatMap((row) => row.stats?.mistake_tags ?? [])).slice(0, 8).map((tag) => (
                <span key={tag.label} className="cricket-badge badge-dark">{tag.label} · {tag.count}</span>
              ))}
              {aggregateTags(squadRows.flatMap((row) => row.stats?.mistake_tags ?? [])).length === 0 && (
                <div className="text-xs text-muted-foreground">No recurring mistakes logged yet.</div>
              )}
            </div>
          </div>
          <div className="tactical-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserCircle2 className="w-4 h-4 text-cricket-red" /> Positive signals
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {aggregateTags(squadRows.flatMap((row) => row.stats?.positive_tags ?? [])).slice(0, 8).map((tag) => (
                <span key={tag.label} className="cricket-badge badge-green">{tag.label} · {tag.count}</span>
              ))}
              {aggregateTags(squadRows.flatMap((row) => row.stats?.positive_tags ?? [])).length === 0 && (
                <div className="text-xs text-muted-foreground">Positive trends will appear once reviews are added.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingPlayerId && editorState && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 py-6 overflow-y-auto" onClick={() => { setEditingPlayerId(null); setEditorState(null); }}>
          <div className="w-full max-w-4xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold">Post-match analysis</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {canManage ? "Review and refine this player's full match analysis." : "Submit your full post-match self review."}
              </p>
            </div>
            <div className="space-y-5 px-5 py-4">
              <div className="grid md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editorState.didBat} onChange={(event) => setEditorState({ ...editorState, didBat: event.target.checked })} /> Did bat</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editorState.didBowl} onChange={(event) => setEditorState({ ...editorState, didBowl: event.target.checked })} /> Did bowl</label>
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Batting order</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={editorState.battingOrder} onChange={(event) => setEditorState({ ...editorState, battingOrder: event.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Role in match</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.rolePerformed} onChange={(event) => setEditorState({ ...editorState, rolePerformed: event.target.value })} placeholder="Opener, finisher, death bowler" />
                </div>
              </div>

              <div>
                <div className="section-title">Batting details</div>
                <div className="grid md:grid-cols-6 gap-3">
                  {[
                    ["runs", "Runs"],
                    ["ballsFaced", "Balls"],
                    ["fours", "4s"],
                    ["sixes", "6s"],
                    ["onesTaken", "1s"],
                    ["twosTaken", "2s"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
                      <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={editorState[key as keyof EditorState] as string} onChange={(event) => setEditorState({ ...editorState, [key]: event.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Dismissal type</label>
                    <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.dismissalType} onChange={(event) => setEditorState({ ...editorState, dismissalType: event.target.value })} placeholder="Bowled, caught, not out" />
                  </div>
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Dismissal details</label>
                    <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.dismissalDetails} onChange={(event) => setEditorState({ ...editorState, dismissalDetails: event.target.value })} placeholder="Pulled early, edged to slip" />
                  </div>
                </div>
              </div>

              <div>
                <div className="section-title">Bowling and fielding</div>
                <div className="grid md:grid-cols-6 gap-3">
                  {[
                    ["wickets", "Wickets"],
                    ["oversBowled", "Overs"],
                    ["runsConceded", "Runs against"],
                    ["maidens", "Maidens"],
                    ["dotBalls", "Dots"],
                    ["catches", "Catches"],
                    ["runOuts", "Run outs"],
                    ["stumpings", "Stumpings"],
                    ["droppedCatches", "Drops"],
                    ["missedChances", "Missed chances"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
                      <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" value={editorState[key as keyof EditorState] as string} onChange={(event) => setEditorState({ ...editorState, [key]: event.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Bowling spell notes</label>
                  <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.bowlingSpell} onChange={(event) => setEditorState({ ...editorState, bowlingSpell: event.target.value })} placeholder="Powerplay 2 overs, death over 18" />
                </div>
              </div>

              <div>
                <div className="section-title">Self analysis</div>
                <div className="grid md:grid-cols-5 gap-3">
                  {[
                    ["selfConfidenceRating", "Confidence"],
                    ["selfEnergyRating", "Energy"],
                    ["selfFocusRating", "Focus"],
                    ["pressureHandlingRating", "Pressure"],
                    ["matchImpactRating", "Impact"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label} / 10</label>
                      <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" min="0" max="10" value={editorState[key as keyof EditorState] as string} onChange={(event) => setEditorState({ ...editorState, [key]: event.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Positives</label>
                    <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.positiveTags} onChange={(event) => setEditorState({ ...editorState, positiveTags: event.target.value })} placeholder="timing, discipline, calm under pressure" />
                  </div>
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Mistakes</label>
                    <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.mistakeTags} onChange={(event) => setEditorState({ ...editorState, mistakeTags: event.target.value })} placeholder="loose drive, slow footwork, overpitching" />
                  </div>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Self feedback</label>
                    <textarea className="mt-1 h-24 w-full border border-input bg-background px-3 py-2" value={editorState.selfFeedback} onChange={(event) => setEditorState({ ...editorState, selfFeedback: event.target.value })} placeholder="How did the match feel? What worked? What broke down?" />
                  </div>
                  <div>
                    <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Improvement goal</label>
                    <textarea className="mt-1 h-24 w-full border border-input bg-background px-3 py-2" value={editorState.improvementGoal} onChange={(event) => setEditorState({ ...editorState, improvementGoal: event.target.value })} placeholder="What will you work on before the next match?" />
                  </div>
                </div>
              </div>

              {canManage && (
                <div>
                  <div className="section-title">Coach review</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Coach tags</label>
                      <input className="mt-1 h-10 w-full border border-input bg-background px-3" value={editorState.coachTags} onChange={(event) => setEditorState({ ...editorState, coachTags: event.target.value })} placeholder="shot selection, body language, execution" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Coach rating / 10</label>
                      <input className="mt-1 h-10 w-full border border-input bg-background px-3" type="number" min="0" max="10" value={editorState.coachRating} onChange={(event) => setEditorState({ ...editorState, coachRating: event.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Coach feedback</label>
                      <textarea className="mt-1 h-24 w-full border border-input bg-background px-3 py-2" value={editorState.coachFeedback} onChange={(event) => setEditorState({ ...editorState, coachFeedback: event.target.value })} placeholder="Technical and tactical review..." />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Action points</label>
                      <textarea className="mt-1 h-24 w-full border border-input bg-background px-3 py-2" value={editorState.coachActionPoints} onChange={(event) => setEditorState({ ...editorState, coachActionPoints: event.target.value })} placeholder="Next-session drills and corrections..." />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Additional notes</label>
                <textarea className="mt-1 h-20 w-full border border-input bg-background px-3 py-2" value={editorState.notes} onChange={(event) => setEditorState({ ...editorState, notes: event.target.value })} placeholder="Anything else worth tracking from this match." />
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button type="button" className="flex-1 border border-input px-4 py-2 text-sm font-semibold hover:bg-accent" onClick={() => { setEditingPlayerId(null); setEditorState(null); }} disabled={saveMutation.isPending}>
                Cancel
              </button>
              <button type="button" className="flex-1 bg-cricket-red px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : canManage ? "Save analysis" : "Submit my analysis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function aggregateTags(tags: string[]) {
  const counts = new Map<string, number>();
  for (const tag of tags) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
