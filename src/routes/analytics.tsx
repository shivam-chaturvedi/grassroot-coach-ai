import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Zap, Target, Shield, BarChart3, Sparkles, ClipboardCheck } from "lucide-react";
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

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "AI Analytics" }] }),
});

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

  const aiXI = useMemo(() => {
    return (playersQuery.data ?? []).map((player) => {
      const season = seasonLookup.get(player.id);
      const reviews = statsByPlayer.get(player.id) ?? [];
      const avgImpact = average(reviews.map((item) => item.match_impact_rating));
      const avgCoach = average(reviews.map((item) => item.coach_rating));
      const avgConfidence = average(reviews.map((item) => item.self_confidence_rating));
      const aiScore = Math.round(
        player.fitness_rating * 0.18 +
        player.consistency_rating * 0.2 +
        player.aggression_rating * 0.12 +
        (season?.strike_rate ?? 0) * 0.15 +
        (season?.batting_average ?? 0) * 0.1 +
        avgImpact * 4 +
        avgCoach * 3 +
        avgConfidence * 2
      );

      return {
        ...player,
        aiScore: Math.min(100, aiScore),
        avgImpact,
        avgCoach,
        avgConfidence,
      };
    });
  }, [playersQuery.data, seasonLookup, statsByPlayer]);

  const battingOrder = useMemo(() => {
    return [...aiXI]
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 11)
      .map((player, index) => ({
        pos: index + 1,
        id: player.id,
        name: player.full_name,
        role: formatEnumLabel(player.player_role),
        reason: `AI ${player.aiScore} · impact ${player.avgImpact.toFixed(1)} · coach ${player.avgCoach.toFixed(1)} · confidence ${player.avgConfidence.toFixed(1)}`,
      }));
  }, [aiXI]);

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

  const comparePlayers = playersQuery.data ?? [];
  const playerA = comparePlayers[compareA] ?? comparePlayers[0];
  const playerB = comparePlayers[compareB] ?? comparePlayers[1] ?? comparePlayers[0];
  const playerAReviews = playerA ? statsByPlayer.get(playerA.id) ?? [] : [];
  const playerBReviews = playerB ? statsByPlayer.get(playerB.id) ?? [] : [];

  const radarCompareData = playerA && playerB ? [
    { stat: "Runs", a: seasonLookup.get(playerA.id)?.runs ?? 0, b: seasonLookup.get(playerB.id)?.runs ?? 0 },
    { stat: "SR", a: seasonLookup.get(playerA.id)?.strike_rate ?? 0, b: seasonLookup.get(playerB.id)?.strike_rate ?? 0 },
    { stat: "Impact", a: average(playerAReviews.map((item) => item.match_impact_rating)) * 10, b: average(playerBReviews.map((item) => item.match_impact_rating)) * 10 },
    { stat: "Confidence", a: average(playerAReviews.map((item) => item.self_confidence_rating)) * 10, b: average(playerBReviews.map((item) => item.self_confidence_rating)) * 10 },
    { stat: "Coach", a: average(playerAReviews.map((item) => item.coach_rating)) * 10, b: average(playerBReviews.map((item) => item.coach_rating)) * 10 },
    { stat: "Fitness", a: playerA.fitness_rating, b: playerB.fitness_rating },
  ] : [];

  const completedMatches = (matchesQuery.data ?? []).filter((match) => match.status === "completed");
  const reviewFeed = useMemo(() => {
    return completedMatches.slice(0, 6).map((match) => {
      const rows = (matchStatsQuery.data ?? []).filter((item) => item.match_id === match.id);
      const topImpact = [...rows].sort((a, b) => b.match_impact_rating - a.match_impact_rating)[0];
      const biggestMistake = aggregateTags(rows.flatMap((item) => item.mistake_tags))[0];
      const strongestPositive = aggregateTags(rows.flatMap((item) => item.positive_tags))[0];
      return {
        id: match.id,
        opponent: match.opponent_name,
        result: match.result_summary ?? "Completed",
        summary: [
          topImpact ? `Top impact: ${playerLookup.get(topImpact.player_id)?.full_name ?? "Player"} (${topImpact.match_impact_rating}/10)` : null,
          strongestPositive ? `Recurring positive: ${strongestPositive.label}` : null,
          biggestMistake ? `Main correction area: ${biggestMistake.label}` : null,
        ].filter(Boolean).join(" · "),
      };
    });
  }, [completedMatches, matchStatsQuery.data, playerLookup]);

  const recentImpactTrend = useMemo(() => {
    return completedMatches.slice(0, 6).map((match, index) => {
      const rows = (matchStatsQuery.data ?? []).filter((item) => item.match_id === match.id);
      return {
        label: `M${index + 1}`,
        impact: average(rows.map((item) => item.match_impact_rating)) * 10,
        confidence: average(rows.map((item) => item.self_confidence_rating)) * 10,
      };
    }).reverse();
  }, [completedMatches, matchStatsQuery.data]);

  const predictedScore = Math.round((seasonStatsQuery.data?.reduce((sum, item) => sum + item.runs, 0) ?? 0) / Math.max(1, playersQuery.data?.length ?? 1));
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
    { key: "reviews" as const, label: "Review Intelligence", icon: ClipboardCheck },
    { key: "compare" as const, label: "Player Compare", icon: BarChart3 },
    { key: "simulation" as const, label: "Match Projection", icon: Zap },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-cricket-red" /> Performance Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Selection, review, and trend analysis built from real post-match feedback.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Review Coverage", value: `${reviewCoverage}%` },
          { label: "Avg Confidence", value: (average((matchStatsQuery.data ?? []).map((item) => item.self_confidence_rating))).toFixed(1) },
          { label: "Avg Impact", value: (average((matchStatsQuery.data ?? []).map((item) => item.match_impact_rating))).toFixed(1) },
          { label: "Coach Score", value: (average((matchStatsQuery.data ?? []).map((item) => item.coach_rating))).toFixed(1) },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{item.label}</div>
            <div className="text-xl font-bold mt-1 font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)} className={`flex items-center gap-1.5 px-4 h-9 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border ${tab === tabItem.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"}`}>
            <tabItem.icon className="w-3.5 h-3.5" /> {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "xi" && (
        <div className="space-y-5">
          <div className="tactical-card">
            <div className="section-title flex items-center gap-1"><Brain className="w-3 h-3" /> Recommended Playing XI</div>
            <p className="text-xs text-muted-foreground mb-3">Selection score blends season production, match impact, coach review, and player confidence.</p>
            <div className="space-y-1.5">
              {battingOrder.map((item) => (
                <div key={`${item.pos}-${item.id}`} className="flex items-center gap-3 p-2 bg-background border border-border hover:border-cricket-red transition-colors">
                  <div className="w-7 h-7 bg-cricket-red text-primary-foreground flex items-center justify-center text-xs font-bold">{item.pos}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{item.reason}</div>
                  </div>
                  <span className="cricket-badge badge-dark">{item.role}</span>
                </div>
              ))}
              {battingOrder.length === 0 && <div className="text-sm text-muted-foreground">Add player reviews to generate a stronger playing XI.</div>}
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
                <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="w-4 h-4 text-cricket-green" /> Positive themes</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {commonPositives.slice(0, 8).map((item) => <span key={item.label} className="cricket-badge badge-green">{item.label} · {item.count}</span>)}
                  {commonPositives.length === 0 && <div className="text-xs text-muted-foreground">No positive review themes captured yet.</div>}
                </div>
              </div>
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold"><Target className="w-4 h-4 text-cricket-red" /> Recurring correction areas</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {commonMistakes.slice(0, 8).map((item) => <span key={item.label} className="cricket-badge badge-dark">{item.label} · {item.count}</span>)}
                  {commonMistakes.length === 0 && <div className="text-xs text-muted-foreground">No mistake patterns found yet.</div>}
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
                <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="w-4 h-4 text-cricket-green" /> AI reading</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {commonMistakes[0]
                    ? `The strongest recurring issue is "${commonMistakes[0].label}". That makes it the first training priority for the next cycle.`
                    : "Once players submit reviews, this panel will summarize the strongest recurring correction area."}
                </div>
              </div>
              <div className="tactical-card">
                <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="w-4 h-4 text-cricket-red" /> Response plan</div>
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
                  <div className="mt-2 text-xs text-muted-foreground">{item.summary || "Waiting for detailed player reviews to generate a stronger summary."}</div>
                </div>
              ))}
              {reviewFeed.length === 0 && <div className="stat-card text-sm text-muted-foreground">No completed match reviews yet.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "compare" && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Player A</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={compareA} onChange={e => setCompareA(Number(e.target.value))}>
                {comparePlayers.map((player, index) => <option key={player.id} value={index}>{player.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Player B</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={compareB} onChange={e => setCompareB(Number(e.target.value))}>
                {comparePlayers.map((player, index) => <option key={player.id} value={index}>{player.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="stat-card">
            <div className="section-title">Performance Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarCompareData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar dataKey="a" stroke="var(--cricket-red)" fill="var(--cricket-red)" fillOpacity={0.2} />
                <Radar dataKey="b" stroke="var(--cricket-green)" fill="var(--cricket-green)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Metric</th><th>{playerA?.full_name ?? "Player A"}</th><th>{playerB?.full_name ?? "Player B"}</th></tr>
            </thead>
            <tbody>
              {[
                { stat: "Runs", a: seasonLookup.get(playerA?.id ?? "")?.runs ?? 0, b: seasonLookup.get(playerB?.id ?? "")?.runs ?? 0 },
                { stat: "Strike Rate", a: seasonLookup.get(playerA?.id ?? "")?.strike_rate ?? 0, b: seasonLookup.get(playerB?.id ?? "")?.strike_rate ?? 0 },
                { stat: "Impact / 10", a: average(playerAReviews.map((item) => item.match_impact_rating)).toFixed(1), b: average(playerBReviews.map((item) => item.match_impact_rating)).toFixed(1) },
                { stat: "Confidence / 10", a: average(playerAReviews.map((item) => item.self_confidence_rating)).toFixed(1), b: average(playerBReviews.map((item) => item.self_confidence_rating)).toFixed(1) },
                { stat: "Coach score / 10", a: average(playerAReviews.map((item) => item.coach_rating)).toFixed(1), b: average(playerBReviews.map((item) => item.coach_rating)).toFixed(1) },
              ].map((row) => (
                <tr key={row.stat}>
                  <td className="font-semibold">{row.stat}</td>
                  <td className="font-mono">{row.a}</td>
                  <td className="font-mono">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "simulation" && (
        <div className="space-y-5">
          <div className="tactical-card">
            <div className="section-title flex items-center gap-1"><Zap className="w-3 h-3" /> Match Projection</div>
            <p className="text-xs text-muted-foreground mb-4">Projection reacts to confidence, coach review, and recent impact data from completed matches.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card text-center border-cricket-green" style={{ borderColor: "var(--cricket-green)" }}>
                <div className="text-3xl font-bold font-mono text-cricket-green">{Math.round(winProbability)}%</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Projected win chance</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-3xl font-bold font-mono">{predictedScore}</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Projected core score</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-3xl font-bold font-mono">{average((matchStatsQuery.data ?? []).map((item) => item.coach_rating)).toFixed(1)}</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Coach stability score</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="section-title">Projected factors</div>
              {[
                { factor: "Confidence carry-over", impact: average((matchStatsQuery.data ?? []).map((item) => item.self_confidence_rating)) * 10 },
                { factor: "Coach trust", impact: average((matchStatsQuery.data ?? []).map((item) => item.coach_rating)) * 10 },
                { factor: "Impact consistency", impact: average((matchStatsQuery.data ?? []).map((item) => item.match_impact_rating)) * 10 },
                { factor: "Review coverage", impact: reviewCoverage },
              ].map((item) => (
                <div key={item.factor} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 text-xs">{item.factor}</div>
                  <div className="w-24 h-1.5 bg-accent"><div className="h-full bg-cricket-red" style={{ width: `${item.impact}%` }} /></div>
                  <div className="text-xs font-mono w-10 text-right">{Math.round(item.impact)}%</div>
                </div>
              ))}
            </div>

            <div className="stat-card">
              <div className="section-title">Scenario notes</div>
              {[
                `If "${commonPositives[0]?.label ?? "your strongest pattern"}" repeats, finishing quality should improve.`,
                `If "${commonMistakes[0]?.label ?? "the top recurring error"}" is corrected, projected stability lifts immediately.`,
                `Higher review coverage improves the next selection cycle because the model sees more context per player.`,
                `Coach ratings and player confidence are currently the two strongest non-score predictors in this analysis flow.`,
              ].map((item) => (
                <div key={item} className="py-1.5 border-b border-border last:border-0 text-xs text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
