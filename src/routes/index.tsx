import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Shield,
  AlertTriangle,
  Brain,
  Trophy,
  Activity,
  MessageSquare,
  Star,
  UserCircle,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchCoachFeedback,
  fetchMatchSquads,
  fetchMatches,
  fetchNotifications,
  fetchPlayers,
  fetchPlayerMatchStats,
  fetchPlayerSeasonStats,
  fetchProfile,
  fetchRecommendations,
  fetchSession,
} from "@/lib/supabase-api";

export const Route = createFileRoute("/")({
  component: LandingRoute,
  head: () => ({
    meta: [
      { title: "CricketIQ — AI Operating System For Cricket Academies" },
      { name: "description", content: "Manage players, matches, feedback, reports, and academy operations from one cricket intelligence platform." },
    ],
  }),
});

function LandingRoute() {
  return <LandingPage />;
}

export function DashboardPage() {
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
  const notificationsQuery = useQuery({
    queryKey: ["notifications", sessionQuery.data?.user.id, profileQuery.data?.academy_id],
    queryFn: () => fetchNotifications(sessionQuery.data!.user.id, profileQuery.data?.academy_id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", profileQuery.data?.academy_id],
    queryFn: () => fetchRecommendations(profileQuery.data!.academy_id!),
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
  const squadQuery = useQuery({
    queryKey: ["match-squads", profileQuery.data?.academy_id],
    queryFn: async () => fetchMatchSquads((matchesQuery.data ?? []).map((match) => match.id)),
    enabled: !!profileQuery.data?.academy_id && (matchesQuery.data?.length ?? 0) > 0,
  });
  const linkedPlayer = useMemo(() => {
    const players = playersQuery.data ?? [];
    return players.find((item) => item.profile_id === sessionQuery.data?.user.id) ?? players[0] ?? null;
  }, [playersQuery.data, sessionQuery.data?.user.id]);
  const linkedPlayerSeason = useMemo(
    () => seasonStatsQuery.data?.find((item) => item.player_id === linkedPlayer?.id) ?? null,
    [linkedPlayer?.id, seasonStatsQuery.data],
  );
  const feedbackQuery = useQuery({
    queryKey: ["coach-feedback", linkedPlayer?.id],
    queryFn: () => fetchCoachFeedback(linkedPlayer!.id),
    enabled: profileQuery.data?.role === "player" && !!linkedPlayer?.id,
  });

  const dashboardStats = useMemo(() => {
    const matches = matchesQuery.data ?? [];
    const players = playersQuery.data ?? [];
    const completed = matches.filter((match) => match.status === "completed");
    const wins = completed.filter((match) => match.result_summary?.toLowerCase().startsWith("won")).length;
    const runs = seasonStatsQuery.data?.reduce((sum, item) => sum + item.runs, 0) ?? 0;
    const wickets = seasonStatsQuery.data?.reduce((sum, item) => sum + item.wickets, 0) ?? 0;
    const avgSr = players.length
      ? (players.reduce((sum, item) => sum + item.aggression_rating, 0) / players.length).toFixed(1)
      : "0.0";
    return [
      { label: "Matches", value: String(matches.length), change: `${completed.length}`, trend: "up" as const },
      { label: "Total Runs", value: runs.toLocaleString(), change: `+${runs}`, trend: "up" as const },
      { label: "Avg Strike Rate", value: avgSr, change: "Live", trend: "up" as const },
      { label: "Wickets", value: String(wickets), change: `+${wickets}`, trend: "up" as const },
      { label: "Win Rate", value: `${matches.length ? Math.round((wins / Math.max(1, completed.length)) * 100) : 0}%`, change: `${wins} wins`, trend: "up" as const },
    ];
  }, [matchesQuery.data, playersQuery.data, seasonStatsQuery.data]);

  const aiRecommendations = recommendationsQuery.data ?? [];
  const workloadData = useMemo(() => {
    const buckets = (matchStatsQuery.data ?? []).slice(0, 6).map((item, index) => ({
      week: `W${index + 1}`,
      batting: item.runs,
      bowling: item.overs_bowled * 10,
      fielding: item.catches + item.run_outs + item.dot_balls / 10,
    }));
    return buckets.length > 0 ? buckets : [
      { week: "W1", batting: 0, bowling: 0, fielding: 0 },
      { week: "W2", batting: 0, bowling: 0, fielding: 0 },
      { week: "W3", batting: 0, bowling: 0, fielding: 0 },
      { week: "W4", batting: 0, bowling: 0, fielding: 0 },
      { week: "W5", batting: 0, bowling: 0, fielding: 0 },
      { week: "W6", batting: 0, bowling: 0, fielding: 0 },
    ];
  }, [matchStatsQuery.data]);

  const strikeRateData = useMemo(() => {
    const stats = seasonStatsQuery.data ?? [];
    return stats.slice(0, 8).map((item, index) => ({
      match: `M${index + 1}`,
      sr: item.strike_rate,
      avg: item.batting_average,
    }));
  }, [seasonStatsQuery.data]);

  const recentMatches = (matchesQuery.data ?? []).slice(0, 3);
  const upcomingMatches = (matchesQuery.data ?? []).filter((match) => match.status === "scheduled").slice(0, 3);
  const playerMatchIds = useMemo(() => {
    if (!linkedPlayer?.id) return new Set<string>();
    return new Set(
      (squadQuery.data ?? [])
        .filter((item) => item.player_id === linkedPlayer.id && item.is_selected)
        .map((item) => item.match_id),
    );
  }, [linkedPlayer?.id, squadQuery.data]);
  const playerVisibleMatches = useMemo(() => {
    return (matchesQuery.data ?? []).filter((match) => playerMatchIds.has(match.id));
  }, [matchesQuery.data, playerMatchIds]);
  const playerUpcomingMatches = useMemo(() => {
    return playerVisibleMatches.filter((match) => match.status === "scheduled").slice(0, 4);
  }, [playerVisibleMatches]);
  const playerCompletedMatchesNeedingReview = useMemo(() => {
    const statsByMatchId = new Map(
      (matchStatsQuery.data ?? [])
        .filter((item) => item.player_id === linkedPlayer?.id)
        .map((item) => [item.match_id, item]),
    );
    return playerVisibleMatches
      .filter((match) => match.status === "completed")
      .map((match) => ({
        match,
        stats: statsByMatchId.get(match.id),
      }))
      .slice(0, 4);
  }, [linkedPlayer?.id, matchStatsQuery.data, playerVisibleMatches]);
  const leaderboard = useMemo(() => {
    return (seasonStatsQuery.data ?? [])
      .slice()
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5)
      .map((item, index) => {
        const player = playersQuery.data?.find((entry) => entry.id === item.player_id);
        return {
          rank: index + 1,
          name: player?.full_name ?? "Player",
          stat: `${item.runs} runs`,
          badge: index === 0 ? "Top Scorer" : index === 1 ? "Top Wicket-taker" : "Leaderboard",
        };
      });
  }, [playersQuery.data, seasonStatsQuery.data]);
  const notifications = notificationsQuery.data ?? [];
  const topPlayers = playersQuery.data?.slice(0, 4) ?? [];
  const isPlayer = profileQuery.data?.role === "player";

  if (isPlayer) {
    const playerStats = [
      { label: "Matches", value: String(linkedPlayerSeason?.matches ?? 0), change: "Season", trend: "up" as const },
      { label: "Runs", value: String(linkedPlayerSeason?.runs ?? 0), change: "Season", trend: "up" as const },
      { label: "Average", value: String(linkedPlayerSeason?.batting_average ?? 0), change: "Current", trend: "up" as const },
      { label: "Strike Rate", value: String(linkedPlayerSeason?.strike_rate ?? 0), change: "Current", trend: "up" as const },
    ];

    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Player Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Your performance snapshot and upcoming schedule</p>
          </div>
          <div className="cricket-badge badge-green flex items-center gap-1">
            <UserCircle className="w-3 h-3" />
            PLAYER VIEW
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {playerStats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              <div className="text-xl font-bold mt-1 font-mono">{stat.value}</div>
              <div className="text-[0.65rem] font-semibold mt-1 flex items-center gap-0.5 text-cricket-green">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="stat-card">
              <div className="section-title flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Your Profile Snapshot
              </div>
              {linkedPlayer ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold">{linkedPlayer.full_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      #{linkedPlayer.jersey_number} · {linkedPlayer.player_role} · Age {linkedPlayer.age}
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Strengths:</span> {linkedPlayer.strength_summary ?? "Not added yet."}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Focus area:</span> {linkedPlayer.weakness_summary ?? "Not added yet."}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Fitness", value: linkedPlayer.fitness_rating },
                      { label: "Consistency", value: linkedPlayer.consistency_rating },
                      { label: "Aggression", value: linkedPlayer.aggression_rating },
                    ].map((item) => (
                      <div key={item.label} className="rounded-sm border border-border bg-background p-3 text-center">
                        <div className="text-[0.55rem] uppercase text-muted-foreground">{item.label}</div>
                        <div className="mt-1 text-lg font-bold font-mono">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No player profile is linked to this account yet.</div>
              )}
            </div>

            <div>
              <div className="section-title">Your Upcoming Matches</div>
              <div className="space-y-2">
                {playerUpcomingMatches.map((match) => (
                  <Link key={match.id} to="/matches/$matchId" params={{ matchId: match.id }} className="stat-card block hover:border-cricket-red">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">vs {match.opponent_name}</div>
                      <span className="cricket-badge badge-red">T{match.overs}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(match.scheduled_at).toLocaleDateString()} · {new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-xs text-muted-foreground">{match.ground ?? match.venue ?? "Venue TBD"}</div>
                  </Link>
                ))}
                {playerUpcomingMatches.length === 0 && <div className="stat-card text-sm text-muted-foreground">No upcoming matches assigned to you yet.</div>}
              </div>
            </div>

            <div>
              <div className="section-title">Completed Matches To Review</div>
              <div className="space-y-2">
                {playerCompletedMatchesNeedingReview.map(({ match, stats }) => (
                  <Link key={match.id} to="/matches/$matchId" params={{ matchId: match.id }} className="stat-card block hover:border-cricket-red">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">vs {match.opponent_name}</div>
                      <span className={`cricket-badge ${stats?.submitted_by_player_at ? "badge-green" : "badge-dark"}`}>
                        {stats?.submitted_by_player_at ? "Reviewed" : "Action needed"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(match.scheduled_at).toLocaleDateString()} · {match.result_summary ?? "Completed"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {stats?.submitted_by_player_at ? "You can reopen and refine your analysis." : "Open this match and submit your full self review."}
                    </div>
                  </Link>
                ))}
                {playerCompletedMatchesNeedingReview.length === 0 && <div className="stat-card text-sm text-muted-foreground">No completed matches are waiting for your review.</div>}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="section-title flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Coach Feedback
              </div>
              <div className="space-y-1.5">
                {(feedbackQuery.data ?? []).slice(0, 4).map((item) => (
                  <div key={item.id} className="stat-card py-2.5">
                    <div className="text-xs font-semibold">{item.subject ?? "Coach note"}</div>
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5">{item.message}</div>
                  </div>
                ))}
                {(feedbackQuery.data ?? []).length === 0 && (
                  <div className="stat-card text-sm text-muted-foreground">No coach feedback yet.</div>
                )}
              </div>
            </div>

            <div>
              <div className="section-title flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Notifications
              </div>
              <div className="space-y-1.5">
                {notifications.map((item) => (
                  <div key={item.id} className="stat-card py-2.5">
                    <div className="text-xs">{item.title}</div>
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5">{item.message}</div>
                  </div>
                ))}
                {notifications.length === 0 && <div className="stat-card text-sm text-muted-foreground">No notifications yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time team intelligence</p>
        </div>
        <div className="cricket-badge badge-red flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-cricket-red animate-pulse" />
          LIVE SYNC
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            <div className="text-xl font-bold mt-1 font-mono">{stat.value}</div>
            <div className={`text-[0.65rem] font-semibold mt-1 flex items-center gap-0.5 ${stat.trend === "up" ? "text-cricket-green" : "text-cricket-red"}`}>
              {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="section-title flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> AI Tactical Recommendations
            </div>
            <div className="space-y-2">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="tactical-card flex items-start gap-3">
                  <div className="mt-0.5 text-cricket-red">
                    {rec.recommendation_type === "tactical" ? <Target className="w-4 h-4" /> :
                      rec.recommendation_type === "player" ? <AlertTriangle className="w-4 h-4" /> :
                      rec.recommendation_type === "lineup" ? <Zap className="w-4 h-4" /> :
                      <Shield className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{rec.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{rec.description}</div>
                  </div>
                  <span className={`cricket-badge ${rec.priority === "high" ? "badge-red" : rec.priority === "medium" ? "badge-dark" : "badge-green"}`}>
                    {rec.priority}
                  </span>
                </div>
              ))}
              {aiRecommendations.length === 0 && <div className="text-sm text-muted-foreground">No recommendations yet.</div>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="section-title">Team Workload</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                  <Bar dataKey="batting" fill="var(--cricket-red)" />
                  <Bar dataKey="bowling" fill="var(--cricket-green)" />
                  <Bar dataKey="fielding" fill="var(--foreground)" opacity={0.2} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card">
              <div className="section-title">Strike Rate Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={strikeRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="match" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                  <Line type="monotone" dataKey="sr" stroke="var(--cricket-red)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg" stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="section-title">Recent Matches</div>
            <div className="space-y-2">
              {recentMatches.map((match) => (
                <div key={match.id} className="stat-card flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">vs {match.opponent_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(match.scheduled_at).toLocaleDateString()} · {match.overs} overs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono">{match.team_runs ?? "-"} vs {match.opponent_runs ?? "-"}</div>
                    <div className={`text-xs font-semibold ${match.result_summary?.toLowerCase().startsWith("won") ? "text-cricket-green" : "text-cricket-red"}`}>
                      {match.result_summary ?? "Pending"}
                    </div>
                  </div>
                </div>
              ))}
              {recentMatches.length === 0 && <div className="stat-card text-sm text-muted-foreground">No matches yet.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="section-title">Upcoming Matches</div>
            <div className="space-y-2">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="stat-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">vs {match.opponent_name}</div>
                    <span className="cricket-badge badge-red">T{match.overs}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(match.scheduled_at).toLocaleDateString()} · {new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="text-xs text-muted-foreground">{match.ground ?? match.venue ?? "Venue TBD"}</div>
                </div>
              ))}
              {upcomingMatches.length === 0 && <div className="stat-card text-sm text-muted-foreground">No upcoming matches.</div>}
            </div>
          </div>

          <div>
            <div className="section-title flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Team Leaderboard
            </div>
            <div className="space-y-1.5">
              {leaderboard.map((item) => (
                <div key={item.rank} className="stat-card flex items-center gap-3 py-2.5">
                  <div className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-accent">
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{item.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{item.stat}</div>
                  </div>
                  <span className="cricket-badge badge-green text-[0.55rem]">{item.badge}</span>
                </div>
              ))}
              {leaderboard.length === 0 && <div className="stat-card text-sm text-muted-foreground">No leaderboard data yet.</div>}
            </div>
          </div>

          <div>
            <div className="section-title flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Notifications
            </div>
            <div className="space-y-1.5">
              {notifications.map((item) => (
                <div key={item.id} className="stat-card py-2.5">
                  <div className="text-xs">{item.title}</div>
                  <div className="text-[0.6rem] text-muted-foreground mt-0.5">{item.message}</div>
                </div>
              ))}
              {notifications.length === 0 && <div className="stat-card text-sm text-muted-foreground">No notifications yet.</div>}
            </div>
          </div>

          <div>
            <div className="section-title">Top Performers</div>
            <div className="space-y-1.5">
              {topPlayers.map((player) => (
                <div key={player.id} className="stat-card flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 bg-accent flex items-center justify-center text-xs font-bold">
                    #{player.jersey_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{player.full_name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{player.player_role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold">Agg {player.aggression_rating}</div>
                    <div className="text-[0.6rem] text-muted-foreground">Fit {player.fitness_rating}</div>
                  </div>
                </div>
              ))}
              {topPlayers.length === 0 && <div className="stat-card text-sm text-muted-foreground">No players yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const featureCards = [
  {
    icon: Users,
    eyebrow: "Player Intelligence",
    title: "Build a live player operating system",
    description:
      "Track player roles, strengths, weaknesses, fitness, consistency, and development notes in one shared academy workspace.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Match Control",
    title: "Run fixtures, squads, and performance reviews",
    description:
      "Schedule matches, assign squads, log batting and bowling outputs, and keep every performance tied back to the right player.",
  },
  {
    icon: Bot,
    eyebrow: "AI Recommendations",
    title: "Turn raw stats into coaching actions",
    description:
      "Surface tactical suggestions, lineup ideas, workload signals, and coaching prompts without digging through spreadsheets.",
  },
  {
    icon: Shield,
    eyebrow: "Role-Based Access",
    title: "Give each staff member the right view",
    description:
      "Owners, coaches, analysts, and players can all use the same system without seeing the wrong controls or workflows.",
  },
];

const benefits = [
  "Academy dashboard with matches, season output, notifications, and trend tracking",
  "Player-specific review flow with self-feedback, coach feedback, confidence, focus, and improvement goals",
  "Team and squad management for match selection, roles, and availability",
  "Reporting and analytics views for coaches, analysts, and academy leadership",
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(149,197,74,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbf6_0%,_#ffffff_45%,_#f3f5f8_100%)] text-foreground">
      <section className="relative border-b border-border/70">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cricket-green to-transparent" />
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cricket-green">CricketIQ</div>
              <p className="mt-1 text-sm text-muted-foreground">Cricket intelligence for academies, coaches, and players</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-cricket-dark px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-cricket-dark/90"
              >
                Try now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border border-cricket-green/25 bg-white/70 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cricket-green shadow-sm backdrop-blur">
                <Zap className="h-3.5 w-3.5" />
                One place for operations, analytics, and coaching
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
                CricketIQ unifies coaching, player growth, and match analysis.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                CricketIQ helps academies manage player development, team operations, match reviews, and AI-backed decision making from a single product that feels built for real coaching work.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-cricket-red px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-cricket-red/90"
                >
                  Try now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center border border-border bg-white/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground transition hover:bg-white"
                >
                  Sign in
                </Link>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 border border-border/70 bg-white/65 p-4 shadow-sm backdrop-blur">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cricket-green" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-10 hidden h-28 w-28 rounded-full bg-cricket-red/10 blur-3xl lg:block" />
              <div className="absolute -right-10 bottom-8 hidden h-32 w-32 rounded-full bg-cricket-green/15 blur-3xl lg:block" />
              <div className="relative border border-cricket-dark/10 bg-[#0d1720] p-5 text-white shadow-2xl shadow-cricket-dark/15">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/60">Live Command Center</p>
                    <h2 className="mt-2 text-2xl font-bold">Academy overview</h2>
                  </div>
                  <div className="cricket-badge badge-green bg-cricket-green/15 text-cricket-green-light">AI Active</div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Active Players", value: "48", delta: "+6 this month" },
                    { label: "Upcoming Matches", value: "07", delta: "3 this week" },
                    { label: "Coach Reviews", value: "19", delta: "Pending today" },
                    { label: "Win Trend", value: "74%", delta: "Last 12 fixtures" },
                  ].map((item) => (
                    <div key={item.label} className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/55">{item.label}</p>
                      <p className="mt-3 text-3xl font-bold">{item.value}</p>
                      <p className="mt-1 text-sm text-white/65">{item.delta}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/55">Today’s AI Recommendation</p>
                      <p className="mt-2 text-lg font-semibold">Promote two all-rounders to the next T20 squad</p>
                    </div>
                    <Target className="h-5 w-5 text-cricket-green-light" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    Recent form, training output, and match impact suggest better middle-over stability if the lineup shifts earlier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cricket-red">Everything in the app</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">A complete platform for modern cricket operations</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            CricketIQ brings together academy setup, player tracking, match reviews, analytics, reporting, and coaching decisions in one connected workspace.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="group border border-border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cricket-green/40 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center bg-cricket-green/10 text-cricket-green">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">{feature.eyebrow}</p>
                <h3 className="mt-2 text-2xl">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-[#f5f7f2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cricket-green">How teams use it</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Built around real academy workflows</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The app already includes dedicated areas for academy setup, player records, match tracking, analytics, reports, requests, and player review loops.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Onboarding and academy setup",
                text: "Create the academy profile, define structure, and get each user into the correct role quickly.",
              },
              {
                title: "Player and team management",
                text: "Maintain rosters, assign squads, store performance context, and keep development history visible to staff.",
              },
              {
                title: "Match analysis and feedback",
                text: "Capture runs, wickets, fielding impact, self-review, coach notes, and action points after every game.",
              },
              {
                title: "Analytics and reporting",
                text: "Review trends, export reports, compare progress, and use AI recommendations to support better decisions.",
              },
            ].map((item, index) => (
              <div key={item.title} className="flex gap-4 border border-border bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-cricket-dark text-sm font-bold text-white">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Trophy, stat: "360+", label: "match reviews captured" },
            { icon: MessageSquare, stat: "92%", label: "feedback completion rate" },
            { icon: Activity, stat: "24/7", label: "academy visibility across teams" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="border border-border bg-white p-6 shadow-sm">
                <Icon className="h-5 w-5 text-cricket-red" />
                <p className="mt-4 text-4xl font-bold">{item.stat}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 border border-cricket-dark bg-cricket-dark px-6 py-8 text-white sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cricket-green-light">Ready to explore?</p>
            <h2 className="mt-2 text-3xl">Bring every player, match, and coaching decision into one system.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Start with one platform that helps your academy stay organized, visible, and data-driven from daily training to match day.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-cricket-red px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-cricket-red/90"
          >
            Try now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
