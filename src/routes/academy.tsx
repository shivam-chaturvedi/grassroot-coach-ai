import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { School, Users, Trophy, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAcademy, fetchProfile, fetchSession, fetchTeams, fetchTrainingSessions } from "@/lib/supabase-api";

export const Route = createFileRoute("/academy")({
  component: AcademyPage,
  head: () => ({ meta: [{ title: "Academy Admin — CricketIQ" }] }),
});

function AcademyPage() {
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const academyQuery = useQuery({
    queryKey: ["academy", profileQuery.data?.academy_id],
    queryFn: () => fetchAcademy(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const teamsQuery = useQuery({
    queryKey: ["teams", profileQuery.data?.academy_id],
    queryFn: () => fetchTeams(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const trainingQuery = useQuery({
    queryKey: ["training-sessions", profileQuery.data?.academy_id],
    queryFn: () => fetchTrainingSessions(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });

  const growthData = [
    { month: "Jan", players: 0 },
    { month: "Feb", players: 0 },
    { month: "Mar", players: 0 },
    { month: "Apr", players: 0 },
    { month: "May", players: teamsQuery.data?.length ?? 0 },
  ];

  if (!academyQuery.data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="stat-card text-sm text-muted-foreground">No academy linked yet. Finish onboarding first.</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <School className="w-5 h-5" /> {academyQuery.data.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Academy administration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Total Teams", value: teamsQuery.data?.length ?? 0 },
          { icon: School, label: "Founded", value: academyQuery.data.founded_year ?? "-" },
          { icon: Trophy, label: "District Rank", value: academyQuery.data.district_rank ? `#${academyQuery.data.district_rank}` : "-" },
        ].map((item) => (
          <div key={item.label} className="stat-card flex items-center gap-3">
            <div className="w-9 h-9 bg-accent flex items-center justify-center"><item.icon className="w-4 h-4" /></div>
            <div>
              <div className="text-[0.6rem] text-muted-foreground uppercase">{item.label}</div>
              <div className="text-sm font-bold font-mono">{String(item.value)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <div className="section-title">Player Growth</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
              <Bar dataKey="players" fill="var(--cricket-green)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="section-title">Teams</div>
          <div className="space-y-2">
            {(teamsQuery.data ?? []).map((team) => (
              <div key={team.id} className="stat-card flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.level ?? "Team"} · {team.record_wins}W/{team.record_losses}L
                  </div>
                </div>
                <span className="cricket-badge badge-green">Active</span>
              </div>
            ))}
            {(teamsQuery.data ?? []).length === 0 && <div className="stat-card text-sm text-muted-foreground">No teams yet.</div>}
          </div>
        </div>
      </div>

      <div>
        <div className="section-title flex items-center gap-1"><Calendar className="w-3 h-3" /> Training Schedule</div>
        <table className="data-table">
          <thead>
            <tr><th>Day</th><th>Time</th><th>Session</th><th>Team</th></tr>
          </thead>
          <tbody>
            {(trainingQuery.data ?? []).map((session) => (
              <tr key={session.id} className="hover:bg-accent/50">
                <td className="font-semibold">{session.day_of_week}</td>
                <td className="font-mono">{session.start_time}</td>
                <td>{session.session_name}</td>
                <td><span className="cricket-badge badge-dark">{session.session_type}</span></td>
              </tr>
            ))}
            {(trainingQuery.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-sm text-muted-foreground py-6">No training sessions set up yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
