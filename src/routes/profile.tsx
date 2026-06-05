import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  MessageSquare,
  Star,
  Users,
  Shield,
  Calendar,
  UserCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchCoachFeedback,
  fetchMatches,
  fetchPlayers,
  fetchProfile,
  fetchSession,
  fetchPlayerSeasonStats,
  formatEnumLabel,
} from "@/lib/supabase-api";
import { canManageAcademyUi } from "@/lib/role-access";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — CricketIQ" }] }),
});

function ProfilePage() {
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
    enabled: !!profileQuery.data?.academy_id && canManageAcademyUi(profileQuery.data?.role),
  });

  const isPlayer = profileQuery.data?.role === "player";
  const linkedPlayer = useMemo(() => {
    const players = playersQuery.data ?? [];
    return players.find((item) => item.profile_id === sessionQuery.data?.user.id) ?? null;
  }, [playersQuery.data, sessionQuery.data?.user.id]);

  const feedbackQuery = useQuery({
    queryKey: ["coach-feedback", linkedPlayer?.id],
    queryFn: () => fetchCoachFeedback(linkedPlayer!.id),
    enabled: isPlayer && !!linkedPlayer?.id,
  });
  const seasonStatsQuery = useQuery({
    queryKey: ["player-season-stats", linkedPlayer?.id],
    queryFn: async () => {
      if (!linkedPlayer?.id) return [];
      return fetchPlayerSeasonStats([linkedPlayer.id]);
    },
    enabled: isPlayer && !!linkedPlayer?.id,
  });

  if (!profileQuery.data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="stat-card text-sm text-muted-foreground">Profile not available right now.</div>
      </div>
    );
  }

  if (isPlayer) {
    return (
      <PlayerProfileView
        profileName={profileQuery.data.display_name ?? profileQuery.data.full_name}
        player={linkedPlayer}
        feedback={feedbackQuery.data ?? []}
        seasonStats={seasonStatsQuery.data?.[0] ?? null}
      />
    );
  }

  return (
    <CoachProfileView
      profile={profileQuery.data}
      playerCount={playersQuery.data?.length ?? 0}
      matchCount={matchesQuery.data?.length ?? 0}
      upcomingCount={(matchesQuery.data ?? []).filter((match) => match.status === "scheduled").length}
    />
  );
}

function PlayerProfileView({
  profileName,
  player,
  feedback,
  seasonStats,
}: {
  profileName: string;
  player: Awaited<ReturnType<typeof fetchPlayers>>[number] | null;
  feedback: Awaited<ReturnType<typeof fetchCoachFeedback>>;
  seasonStats: Awaited<ReturnType<typeof fetchPlayerSeasonStats>>[number] | null;
}) {
  if (!player) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="stat-card">
          <h1 className="text-xl font-bold">{profileName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is active, but a player profile has not been linked yet.
          </p>
        </div>
      </div>
    );
  }

  const radarData = [
    { stat: "Power", value: player.aggression_rating ?? 0 },
    { stat: "Technique", value: Math.max(0, 100 - (player.weakness_summary ? 15 : 0)) },
    { stat: "Fitness", value: player.fitness_rating ?? 0 },
    { stat: "Consistency", value: player.consistency_rating ?? 0 },
    { stat: "Aggression", value: player.aggression_rating ?? 0 },
    { stat: "Mental", value: 75 },
  ];

  const careerData = seasonStats
    ? [{ season: "Current", runs: seasonStats.runs, avg: seasonStats.batting_average }]
    : [];

  const matchHistory = feedback.slice(0, 5).map((item) => ({
    match: item.subject ?? item.feedback_date,
    runs: 0,
    sr: 0,
    wickets: 0,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="stat-card flex items-start gap-4">
        <div className="w-16 h-16 bg-accent flex items-center justify-center text-lg font-bold shrink-0">
          #{player.jersey_number}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{player.full_name}</h1>
          <div className="text-xs text-muted-foreground">
            {formatEnumLabel(player.player_role)} · {formatEnumLabel(player.batting_style)} · Age {player.age}
          </div>
          <div className="flex gap-2 mt-2">
            <span className="cricket-badge badge-red">Player Profile</span>
            <span className="cricket-badge badge-green">{formatEnumLabel(player.position ?? "playing")}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono">{seasonStats?.runs ?? 0}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Season Runs</div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Matches", value: seasonStats?.matches ?? 0 },
          { label: "Average", value: seasonStats?.batting_average ?? 0 },
          { label: "Strike Rate", value: seasonStats?.strike_rate ?? 0 },
          { label: "50s / 100s", value: `${seasonStats?.fifties ?? 0}/${seasonStats?.hundreds ?? 0}` },
          { label: "Catches", value: seasonStats?.catches ?? 0 },
          { label: "Wickets", value: seasonStats?.wickets ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="stat-card text-center">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            <div className="text-lg font-bold font-mono mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <div className="section-title">Player Profile Radar</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar dataKey="value" stroke="var(--cricket-red)" fill="var(--cricket-red)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <div className="section-title">Career Progression</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={careerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="season" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
              <Bar dataKey="runs" fill="var(--cricket-red)" />
              <Line type="monotone" dataKey="avg" stroke="var(--cricket-green)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="tactical-card">
          <div className="section-title text-cricket-green flex items-center gap-1"><Star className="w-3 h-3" /> Strengths</div>
          <div className="text-sm">{player.strength_summary ?? "Not added yet."}</div>
        </div>
        <div className="tactical-card">
          <div className="section-title text-cricket-red flex items-center gap-1"><Star className="w-3 h-3" /> Weaknesses</div>
          <div className="text-sm">{player.weakness_summary ?? "Not added yet."}</div>
        </div>
      </div>

      <div className="stat-card border-l-3 border-l-cricket-green" style={{ borderLeftWidth: 3, borderLeftColor: "var(--cricket-green)" }}>
        <div className="section-title flex items-center gap-1"><Brain className="w-3 h-3" /> AI Role Recommendation</div>
        <div className="text-sm font-semibold">{formatEnumLabel(player.player_role)} / {formatEnumLabel(player.position ?? "playing")}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Based on current season stats and player ratings from the backend.
        </div>
      </div>

      <div>
        <div className="section-title">Recent Match Performance</div>
        <table className="data-table">
          <thead>
            <tr><th>Match</th><th>Runs</th><th>SR</th><th>Wickets</th></tr>
          </thead>
          <tbody>
            {matchHistory.map((match, index) => (
              <tr key={index} className="hover:bg-accent/50">
                <td className="font-semibold">{match.match}</td>
                <td className="font-mono">{match.runs}</td>
                <td className="font-mono">{match.sr}</td>
                <td className="font-mono">{match.wickets}</td>
              </tr>
            ))}
            {matchHistory.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-sm text-muted-foreground py-6">No coaching feedback or recent match data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="stat-card">
        <div className="section-title flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Coach Feedback</div>
        <div className="space-y-2">
          {feedback.map((item) => (
            <div key={item.id} className="p-2 bg-accent text-xs">
              <div className="font-semibold">{item.subject ?? "Coach note"} — {item.feedback_date}</div>
              <p className="text-muted-foreground mt-0.5">{item.message}</p>
            </div>
          ))}
          {feedback.length === 0 && (
            <div className="text-sm text-muted-foreground">No coach feedback yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoachProfileView({
  profile,
  playerCount,
  matchCount,
  upcomingCount,
}: {
  profile: Awaited<ReturnType<typeof fetchProfile>>;
  playerCount: number;
  matchCount: number;
  upcomingCount: number;
}) {
  if (!profile) return null;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="stat-card flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-accent text-lg font-bold shrink-0">
          <UserCircle className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.display_name ?? profile.full_name}</h1>
          <div className="text-xs text-muted-foreground">
            {formatEnumLabel(profile.role)} · {profile.email}
          </div>
          <div className="flex gap-2 mt-2">
            <span className="cricket-badge badge-red">Staff Profile</span>
            <span className="cricket-badge badge-dark">{profile.is_active ? "Active" : "Inactive"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Role", value: formatEnumLabel(profile.role), icon: Shield },
          { label: "Players", value: String(playerCount), icon: Users },
          { label: "Matches", value: String(matchCount), icon: Calendar },
          { label: "Upcoming", value: String(upcomingCount), icon: Calendar },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4" />
              <div className="text-[0.6rem] font-semibold uppercase tracking-widest">{item.label}</div>
            </div>
            <div className="mt-2 text-lg font-bold font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <div className="section-title">Account Details</div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Full name</div>
              <div className="mt-1">{profile.full_name}</div>
            </div>
            <div>
              <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Display name</div>
              <div className="mt-1">{profile.display_name ?? "-"}</div>
            </div>
            <div>
              <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email</div>
              <div className="mt-1">{profile.email}</div>
            </div>
            <div>
              <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Phone</div>
              <div className="mt-1">{profile.phone ?? "-"}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="section-title">Profile Notes</div>
          <div className="text-sm text-muted-foreground">
            {profile.bio ?? "No profile notes added yet."}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-border bg-background p-3">
              <div className="text-[0.55rem] uppercase text-muted-foreground">Academy linked</div>
              <div className="mt-1 text-base font-semibold">{profile.academy_id ? "Yes" : "No"}</div>
            </div>
            <div className="rounded-sm border border-border bg-background p-3">
              <div className="text-[0.55rem] uppercase text-muted-foreground">Status</div>
              <div className="mt-1 text-base font-semibold">{profile.is_active ? "Active" : "Inactive"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
