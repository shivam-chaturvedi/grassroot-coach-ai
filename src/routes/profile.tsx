import { createFileRoute } from "@tanstack/react-router";
import { players } from "@/lib/mock-data";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from "recharts";
import { Brain, Trophy, Heart, TrendingUp, Star, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Player Profile — CricketIQ" }] }),
});

function ProfilePage() {
  const player = players[0]; // Arjun Patel

  const radarData = [
    { stat: "Power", value: 91 },
    { stat: "Technique", value: 78 },
    { stat: "Fitness", value: 88 },
    { stat: "Consistency", value: 82 },
    { stat: "Aggression", value: 91 },
    { stat: "Mental", value: 75 },
  ];

  const careerData = [
    { season: "S1", runs: 280, avg: 32 },
    { season: "S2", runs: 350, avg: 36 },
    { season: "S3", runs: 420, avg: 40 },
    { season: "S4", runs: 190, avg: 44 },
  ];

  const matchHistory = [
    { match: "vs Pune", runs: 78, sr: 148, wickets: 0 },
    { match: "vs Hyderabad", runs: 45, sr: 125, wickets: 1 },
    { match: "vs Bangalore", runs: 92, sr: 156, wickets: 0 },
    { match: "vs Delhi", runs: 34, sr: 112, wickets: 0 },
    { match: "vs Kolkata", runs: 67, sr: 138, wickets: 1 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="stat-card flex items-start gap-4">
        <div className="w-16 h-16 bg-accent flex items-center justify-center text-lg font-bold shrink-0">#{player.jersey}</div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{player.name}</h1>
          <div className="text-xs text-muted-foreground">{player.role} · {player.battingStyle} · Age {player.age}</div>
          <div className="flex gap-2 mt-2">
            <span className="cricket-badge badge-red">Top Scorer</span>
            <span className="cricket-badge badge-green">Power Hitter</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono">{player.runs}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Career Runs</div>
        </div>
      </div>

      {/* Career Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Matches", value: player.matches },
          { label: "Average", value: player.avg },
          { label: "Strike Rate", value: player.sr },
          { label: "50s / 100s", value: `${player.fifties}/${player.hundreds}` },
          { label: "Catches", value: player.catches },
          { label: "Wickets", value: player.wickets },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</div>
            <div className="text-lg font-bold font-mono mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Radar Chart */}
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

        {/* Career Progression */}
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

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="tactical-card">
          <div className="section-title text-cricket-green flex items-center gap-1"><Star className="w-3 h-3" /> Strengths</div>
          <div className="text-sm">{player.strengths}</div>
        </div>
        <div className="tactical-card">
          <div className="section-title text-cricket-red flex items-center gap-1"><Star className="w-3 h-3" /> Weaknesses</div>
          <div className="text-sm">{player.weaknesses}</div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="stat-card border-l-3 border-l-cricket-green" style={{ borderLeftWidth: 3, borderLeftColor: "var(--cricket-green)" }}>
        <div className="section-title flex items-center gap-1"><Brain className="w-3 h-3" /> AI Role Recommendation</div>
        <div className="text-sm font-semibold">Aggressive Opener / Powerplay Specialist</div>
        <div className="text-xs text-muted-foreground mt-1">Based on SR of {player.sr} and aggression index of {player.aggression}, AI recommends utilizing as a powerplay enforcer. Optimal against pace attacks.</div>
      </div>

      {/* Match History Table */}
      <div>
        <div className="section-title">Recent Match Performance</div>
        <table className="data-table">
          <thead>
            <tr><th>Match</th><th>Runs</th><th>SR</th><th>Wickets</th></tr>
          </thead>
          <tbody>
            {matchHistory.map((m, i) => (
              <tr key={i} className="hover:bg-accent/50">
                <td className="font-semibold">{m.match}</td>
                <td className="font-mono">{m.runs}</td>
                <td className="font-mono">{m.sr}</td>
                <td className="font-mono">{m.wickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Coach Feedback */}
      <div className="stat-card">
        <div className="section-title flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Coach Feedback</div>
        <div className="space-y-2">
          <div className="p-2 bg-accent text-xs">
            <div className="font-semibold">Coach Rajesh — May 3, 2026</div>
            <p className="text-muted-foreground mt-0.5">Outstanding innings today. Needs to work on playing spin in middle overs. Excellent power hitting in powerplay.</p>
          </div>
          <div className="p-2 bg-accent text-xs">
            <div className="font-semibold">Coach Rajesh — Apr 28, 2026</div>
            <p className="text-muted-foreground mt-0.5">Struggled against short pitch bowling. Recommend nets session focused on pull shots and back-foot defense.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
