import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Zap, Target, Shield, BarChart3, Sparkles, ClipboardCheck, RefreshCw, Cpu, Award } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  fetchMatches,
  fetchPlayerMatchStats,
  fetchPlayers,
  fetchPlayerSeasonStats,
  fetchProfile,
  fetchSession,
  formatEnumLabel,
} from "@/lib/supabase-api";
import { generateGeminiBestPlaying11, generateGeminiTeamInsights } from "@/lib/gemini";
import { evaluatePlayerScore, selectBestPlaying11 } from "@/lib/player-algorithm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "AI Analytics — CricketIQ" }] }),
});

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function aggregateTags(tags: (string[] | string | undefined | null)[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of tags) {
    if (!item) continue;
    const list = Array.isArray(item) ? item : [item];
    for (const tag of list) {
      const clean = tag.trim();
      if (clean) {
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function AnalyticsPage() {
  const [tab, setTab] = useState<"xi" | "reviews" | "compare" | "simulation">("xi");
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const matchesQuery = useQuery({
    queryKey: ["matches", profileQuery.data?.academy_id],
    queryFn: () => fetchMatches(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const seasonStatsQuery = useQuery({
    queryKey: ["player-season-stats", profileQuery.data?.academy_id],
    queryFn: async () => fetchPlayerSeasonStats((playersQuery.data ?? []).map((player) => player.id)),
    enabled: !!profileQuery.data?.academy_id && (playersQuery.data?.length ?? 0) > 0,
  });
  const matchStatsQuery = useQuery({
    queryKey: ["player-match-stats", profileQuery.data?.academy_id],
    queryFn: async () => fetchPlayerMatchStats((matchesQuery.data ?? []).map((match) => match.id)),
    enabled: !!profileQuery.data?.academy_id && (matchesQuery.data?.length ?? 0) > 0,
  });

  // Gemini 2.5 Flash Lite Queries
  const geminiXIQuery = useQuery({
    queryKey: ["gemini-best-xi", profileQuery.data?.academy_id, playersQuery.data?.length],
    queryFn: () =>
      generateGeminiBestPlaying11(
        playersQuery.data ?? [],
        seasonStatsQuery.data ?? [],
        matchStatsQuery.data ?? [],
      ),
    enabled: !!playersQuery.data && playersQuery.data.length > 0,
  });

  const geminiInsightsQuery = useQuery({
    queryKey: ["gemini-team-insights", profileQuery.data?.academy_id, playersQuery.data?.length],
    queryFn: () =>
      generateGeminiTeamInsights(
        "Academy Squad",
        playersQuery.data ?? [],
        seasonStatsQuery.data ?? [],
        matchStatsQuery.data ?? [],
      ),
    enabled: !!playersQuery.data && playersQuery.data.length > 0,
  });

  const playerLookup = useMemo(
    () => new Map((playersQuery.data ?? []).map((player) => [player.id, player])),
    [playersQuery.data],
  );
  const seasonLookup = useMemo(
    () => new Map((seasonStatsQuery.data ?? []).map((item) => [item.player_id, item])),
    [seasonStatsQuery.data],
  );
  const statsByPlayer = useMemo(() => {
    const grouped = new Map<string, Awaited<ReturnType<typeof fetchPlayerMatchStats>>>();
    for (const stat of matchStatsQuery.data ?? []) {
      const list = grouped.get(stat.player_id) ?? [];
      list.push(stat);
      grouped.set(stat.player_id, list);
    }
    return grouped;
  }, [matchStatsQuery.data]);

  const evaluatedPlayers = useMemo(() => {
    return (playersQuery.data ?? []).map((player) =>
      evaluatePlayerScore(
        player,
        seasonLookup.get(player.id),
        statsByPlayer.get(player.id) ?? [],
      ),
    );
  }, [playersQuery.data, seasonLookup, statsByPlayer]);

  const localAlgorithmicResult = useMemo(() => {
    return selectBestPlaying11(evaluatedPlayers);
  }, [evaluatedPlayers]);

  const playingXIData = geminiXIQuery.data?.playingXI || localAlgorithmicResult.playingXI;

  const reviewCoverage = useMemo(() => {
    const stats = matchStatsQuery.data ?? [];
    if (stats.length === 0) return 0;
    const submitted = stats.filter((item) => item.submitted_by_player_at).length;
    return Math.round((submitted / stats.length) * 100);
  }, [matchStatsQuery.data]);

  const pressureData = useMemo(() => {
    const stats = matchStatsQuery.data ?? [];
    return [
      { metric: "Confidence", score: average(stats.map((item) => item.self_confidence_rating)) * 10 },
      { metric: "Focus", score: average(stats.map((item) => item.self_focus_rating)) * 10 },
      { metric: "Energy", score: average(stats.map((item) => item.self_energy_rating)) * 10 },
      { metric: "Pressure", score: average(stats.map((item) => item.pressure_handling_rating)) * 10 },
      { metric: "Impact", score: average(stats.map((item) => item.match_impact_rating)) * 10 },
      { metric: "Coach", score: average(stats.map((item) => item.coach_rating)) * 10 },
    ];
  }, [matchStatsQuery.data]);

  const commonMistakes = useMemo(
    () => aggregateTags((matchStatsQuery.data ?? []).flatMap((item) => item.mistake_tags)),
    [matchStatsQuery.data],
  );
  const commonPositives = useMemo(
    () => aggregateTags((matchStatsQuery.data ?? []).flatMap((item) => item.positive_tags)),
    [matchStatsQuery.data],
  );

  const recentImpactTrend = useMemo(() => {
    const completedMatches = (matchesQuery.data ?? []).filter((match) => match.status === "completed");
    return completedMatches.slice(0, 6).map((match) => {
      const matchStats = (matchStatsQuery.data ?? []).filter((item) => item.match_id === match.id);
      return {
        label: match.opponent_name || "Match",
        impact: average(matchStats.map((item) => item.match_impact_rating)) * 10,
        confidence: average(matchStats.map((item) => item.self_confidence_rating)) * 10,
        coach: average(matchStats.map((item) => item.coach_rating)) * 10,
      };
    });
  }, [matchesQuery.data, matchStatsQuery.data]);

  const reviewFeed = useMemo(() => {
    const completedMatches = (matchesQuery.data ?? []).filter((match) => match.status === "completed");
    return completedMatches.slice(0, 6).map((match, index) => {
      const matchStats = (matchStatsQuery.data ?? []).filter((item) => item.match_id === match.id);
      return {
        id: match.id,
        opponent: match.opponent_name,
        date: new Date(match.scheduled_at).toLocaleDateString(),
        result: match.result_summary ?? "Completed",
        reviewCount: matchStats.length,
        avgCoach: average(matchStats.map((item) => item.coach_rating)).toFixed(1),
        avgConfidence: average(matchStats.map((item) => item.self_confidence_rating)).toFixed(1),
      };
    });
  }, [matchesQuery.data, matchStatsQuery.data]);

  const playerA = evaluatedPlayers[compareA] || evaluatedPlayers[0];
  const playerB = evaluatedPlayers[compareB] || evaluatedPlayers[1] || evaluatedPlayers[0];

  const radarData = useMemo(() => {
    if (!playerA || !playerB) return [];
    return [
      { subject: "Batting", A: playerA.battingScore, B: playerB.battingScore },
      { subject: "Bowling", A: playerA.bowlingScore, B: playerB.bowlingScore },
      { subject: "Coach Rating", A: playerA.coachScore, B: playerB.coachScore },
      { subject: "Confidence", A: playerA.playerConfidenceScore, B: playerB.playerConfidenceScore },
      { subject: "Fitness", A: playerA.fitnessScore, B: playerB.fitnessScore },
      { subject: "Impact", A: playerA.recentImpactScore, B: playerB.recentImpactScore },
    ];
  }, [playerA, playerB]);

  const winProbability = Math.min(
    92,
    Math.max(
      28,
      35 +
        average((matchStatsQuery.data ?? []).map((item) => item.match_impact_rating)) * 4 +
        average((matchStatsQuery.data ?? []).map((item) => item.coach_rating)) * 3 +
        average((matchStatsQuery.data ?? []).map((item) => item.self_confidence_rating)) * 2,
    ),
  );

  const tabs = [
    { key: "xi" as const, label: "Selection Engine", icon: Brain },
    { key: "reviews" as const, label: "Coach & AI Insights", icon: ClipboardCheck },
    { key: "compare" as const, label: "Player Compare", icon: BarChart3 },
    { key: "simulation" as const, label: "Match Projection", icon: Zap },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-cricket-red" /> Performance Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selection, review, and performance analytics built from match stats.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="cricket-badge badge-dark flex items-center gap-1">
            <Brain className="w-3 h-3 text-cricket-green" />
            AI Intelligence
          </span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              void geminiXIQuery.refetch();
              void geminiInsightsQuery.refetch();
            }}
            disabled={geminiXIQuery.isFetching}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${geminiXIQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh Insights
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Review Coverage", value: `${reviewCoverage}%` },
          {
            label: "Avg Confidence",
            value: average((matchStatsQuery.data ?? []).map((item) => item.self_confidence_rating)).toFixed(1),
          },
          {
            label: "Avg Impact",
            value: average((matchStatsQuery.data ?? []).map((item) => item.match_impact_rating)).toFixed(1),
          },
          {
            label: "Coach Score",
            value: average((matchStatsQuery.data ?? []).map((item) => item.coach_rating)).toFixed(1),
          },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{item.label}</div>
            <div className="text-xl font-bold mt-1 font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Performance Insights Banner */}
      {geminiInsightsQuery.data && (
        <div className="stat-card border-l-4 border-l-cricket-red bg-accent/20">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-cricket-red" /> Team Performance Insights
            </div>
          </div>
          <p className="text-xs font-semibold text-foreground">{geminiInsightsQuery.data.headline}</p>

          <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="bg-background/80 p-2.5 rounded border border-border">
              <div className="font-semibold text-cricket-green mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Key Team Strengths
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {geminiInsightsQuery.data.keyStrengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="bg-background/80 p-2.5 rounded border border-border">
              <div className="font-semibold text-cricket-red mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Tactical Recommendations
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {geminiInsightsQuery.data.tacticalRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-1.5 px-4 h-9 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border ${
              tab === tabItem.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:bg-accent"
            }`}
          >
            <tabItem.icon className="w-3.5 h-3.5" /> {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "xi" && (
        <div className="space-y-5">
          <div className="tactical-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <div className="section-title flex items-center gap-1">
                  <Brain className="w-4 h-4 text-cricket-red" /> Recommended Playing XI
                </div>
                <p className="text-xs text-muted-foreground">
                  AI-selected XI combining match ratings, season metrics, coach scores, and role balance.
                </p>
              </div>
              {geminiXIQuery.data?.aiTacticalOverview && (
                <div className="text-xs bg-accent/40 p-2 rounded max-w-lg border border-border">
                  <span className="font-bold text-foreground">AI Strategy: </span>
                  <span className="text-muted-foreground">{geminiXIQuery.data.aiTacticalOverview}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {playingXIData.map((item) => (
                <div
                  key={`${item.assignedPosition}-${item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 bg-background border border-border hover:border-cricket-red transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-cricket-red text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {item.assignedPosition}
                    </div>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        {item.full_name}
                        <span className="cricket-badge badge-dark text-[0.6rem]">{item.designatedRole}</span>
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">{item.selectionReason}</div>
                    </div>
                  </div>

                  <div className="sm:ml-auto flex items-center gap-2 text-xs">
                    <div className="text-right">
                      <span className="font-mono font-bold text-cricket-green text-sm">{item.compositeScore}</span>
                      <span className="text-[0.6rem] text-muted-foreground block">Composite</span>
                    </div>
                    <div className="text-right pl-2 border-l border-border">
                      <span className="font-mono font-semibold text-foreground">{item.coachScore}</span>
                      <span className="text-[0.6rem] text-muted-foreground block">Coach</span>
                    </div>
                  </div>
                </div>
              ))}
              {playingXIData.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Add player reviews to generate a stronger playing XI.
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="section-title">Performance Readiness</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pressureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                  <Bar dataKey="score" fill="var(--cricket-red)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-cricket-green" /> Positive themes
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {commonPositives.slice(0, 8).map((item) => (
                    <span key={item.label} className="cricket-badge badge-green">
                      {item.label} · {item.count}
                    </span>
                  ))}
                  {commonPositives.length === 0 && (
                    <div className="text-xs text-muted-foreground">No positive review themes captured yet.</div>
                  )}
                </div>
              </div>
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="w-4 h-4 text-cricket-red" /> Recurring correction areas
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {commonMistakes.slice(0, 8).map((item) => (
                    <span key={item.label} className="cricket-badge badge-dark">
                      {item.label} · {item.count}
                    </span>
                  ))}
                  {commonMistakes.length === 0 && (
                    <div className="text-xs text-muted-foreground">No mistake patterns found yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="section-title">Impact vs Confidence Trend</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={recentImpactTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                  <Line type="monotone" dataKey="impact" stroke="var(--cricket-red)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="confidence" stroke="var(--cricket-green)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="w-4 h-4 text-cricket-green" /> AI reading
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {commonMistakes[0]
                    ? `The strongest recurring issue is "${commonMistakes[0].label}". That makes it the first training priority for the next cycle.`
                    : "Once players submit reviews, this panel will summarize the strongest recurring correction area."}
                </div>
              </div>
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Brain className="w-4 h-4 text-cricket-red" /> Response plan
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {commonPositives[0]
                    ? `The squad's clearest strength signal is "${commonPositives[0].label}". The system would preserve that while correcting the top mistake trend.`
                    : "Positive review patterns will appear here and help balance confidence with correction."}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">Completed Match Review Feed</div>
            <div className="space-y-2">
              {reviewFeed.map((item) => (
                <div key={item.id} className="stat-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">vs {item.opponent}</div>
                    <span className="cricket-badge badge-dark">{item.result}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex gap-4">
                    <span>Date: {item.date}</span>
                    <span>Reviews: {item.reviewCount}</span>
                    <span>Avg Coach: {item.avgCoach}</span>
                    <span>Avg Confidence: {item.avgConfidence}</span>
                  </div>
                </div>
              ))}
              {reviewFeed.length === 0 && (
                <div className="stat-card text-sm text-muted-foreground">No completed match reviews yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "compare" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Player A</label>
              <select
                className="w-full h-9 bg-background border border-input px-3 text-xs"
                value={compareA}
                onChange={(e) => setCompareA(Number(e.target.value))}
              >
                {evaluatedPlayers.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.full_name} ({p.compositeScore}/100)
                  </option>
                ))}
              </select>
            </div>
            <div className="stat-card">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Player B</label>
              <select
                className="w-full h-9 bg-background border border-input px-3 text-xs"
                value={compareB}
                onChange={(e) => setCompareB(Number(e.target.value))}
              >
                {evaluatedPlayers.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.full_name} ({p.compositeScore}/100)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {playerA && playerB && (
            <div className="stat-card">
              <div className="section-title">
                {playerA.full_name} vs {playerB.full_name}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name={playerA.full_name} dataKey="A" stroke="var(--cricket-red)" fill="var(--cricket-red)" fillOpacity={0.4} />
                  <Radar name={playerB.full_name} dataKey="B" stroke="var(--cricket-green)" fill="var(--cricket-green)" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === "simulation" && (
        <div className="stat-card space-y-4">
          <div className="section-title flex items-center gap-1">
            <Zap className="w-4 h-4 text-cricket-red" /> Win Projection & Match Simulation
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold font-mono text-cricket-red">{winProbability}%</div>
            <div className="text-xs text-muted-foreground">
              Estimated win probability based on overall coach ratings, player confidence, and match impact history.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
