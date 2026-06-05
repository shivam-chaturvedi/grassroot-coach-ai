import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
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
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — CricketIQ" },
      { name: "description", content: "AI-powered cricket analytics dashboard" },
    ],
  }),
});

function Dashboard() {
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
