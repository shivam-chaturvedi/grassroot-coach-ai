import { createFileRoute } from "@tanstack/react-router";
import { academyData } from "@/lib/mock-data";
import { School, Users, Trophy, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/academy")({
  component: AcademyPage,
  head: () => ({ meta: [{ title: "Academy Admin — CricketIQ" }] }),
});

function AcademyPage() {
  const growthData = [
    { month: "Jan", players: 58 }, { month: "Feb", players: 61 }, { month: "Mar", players: 65 },
    { month: "Apr", players: 68 }, { month: "May", players: 72 },
  ];

  const teams = [
    { name: "U-19 A", players: 18, coach: "Rajesh Kumar", record: "22W/10L" },
    { name: "U-16 A", players: 16, coach: "Priya Nair", record: "18W/8L" },
    { name: "U-19 B", players: 20, coach: "Amit Sharma", record: "14W/12L" },
    { name: "Senior XI", players: 18, coach: "Rajesh Kumar", record: "10W/5L" },
  ];

  const schedule = [
    { day: "Mon", time: "6:00 AM", session: "Batting Nets", team: "U-19 A" },
    { day: "Tue", time: "6:00 AM", session: "Bowling Practice", team: "U-16 A" },
    { day: "Wed", time: "5:30 AM", session: "Match Simulation", team: "All Teams" },
    { day: "Thu", time: "6:00 AM", session: "Fielding Drills", team: "U-19 A" },
    { day: "Fri", time: "6:00 AM", session: "Fitness & Recovery", team: "All Teams" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <School className="w-5 h-5" /> {academyData.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Academy administration and management</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total Players", value: academyData.totalPlayers },
          { icon: School, label: "Teams", value: academyData.teams },
          { icon: Trophy, label: "District Rank", value: `#${academyData.rankings.district}` },
          { icon: DollarSign, label: "Monthly Revenue", value: academyData.revenue.monthly },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className="w-9 h-9 bg-accent flex items-center justify-center"><s.icon className="w-4 h-4" /></div>
            <div>
              <div className="text-[0.6rem] text-muted-foreground uppercase">{s.label}</div>
              <div className="text-sm font-bold font-mono">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Growth Chart */}
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

        {/* Teams */}
        <div>
          <div className="section-title">Teams</div>
          <div className="space-y-2">
            {teams.map(t => (
              <div key={t.name} className="stat-card flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.coach} · {t.players} players</div>
                </div>
                <span className="cricket-badge badge-green">{t.record}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training Schedule */}
      <div>
        <div className="section-title flex items-center gap-1"><Calendar className="w-3 h-3" /> Training Schedule</div>
        <table className="data-table">
          <thead>
            <tr><th>Day</th><th>Time</th><th>Session</th><th>Team</th></tr>
          </thead>
          <tbody>
            {schedule.map(s => (
              <tr key={s.day} className="hover:bg-accent/50">
                <td className="font-semibold">{s.day}</td>
                <td className="font-mono">{s.time}</td>
                <td>{s.session}</td>
                <td><span className="cricket-badge badge-dark">{s.team}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
