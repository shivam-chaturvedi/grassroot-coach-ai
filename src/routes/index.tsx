import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Zap, Target, Shield, AlertTriangle,
  Brain, ChevronRight, Trophy, Activity,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  dashboardStats, upcomingMatches, recentMatches, aiRecommendations,
  workloadData, strikeRateData, leaderboard, notifications, players,
} from "@/lib/mock-data";

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
  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Recommendations */}
          <div>
            <div className="section-title flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> AI Tactical Recommendations
            </div>
            <div className="space-y-2">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="tactical-card flex items-start gap-3">
                  <div className={`mt-0.5 ${rec.priority === "high" ? "text-cricket-red" : rec.priority === "medium" ? "text-amber-500" : "text-muted-foreground"}`}>
                    {rec.type === "tactical" ? <Target className="w-4 h-4" /> :
                     rec.type === "player" ? <AlertTriangle className="w-4 h-4" /> :
                     rec.type === "lineup" ? <Zap className="w-4 h-4" /> :
                     <Shield className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{rec.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{rec.desc}</div>
                  </div>
                  <span className={`cricket-badge ${rec.priority === "high" ? "badge-red" : rec.priority === "medium" ? "badge-dark" : "badge-green"}`}>
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Workload Chart */}
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

            {/* Strike Rate Trend */}
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

          {/* Recent Matches */}
          <div>
            <div className="section-title">Recent Matches</div>
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="stat-card flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">vs {m.opponent}</div>
                    <div className="text-xs text-muted-foreground">{m.date} · {m.overs} overs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono">{m.score} vs {m.oppScore}</div>
                    <div className={`text-xs font-semibold ${m.result.startsWith("Won") ? "text-cricket-green" : "text-cricket-red"}`}>
                      {m.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Upcoming Matches */}
          <div>
            <div className="section-title">Upcoming Matches</div>
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="stat-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">vs {m.opponent}</div>
                    <span className="cricket-badge badge-red">T{m.overs}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{m.date} · {m.time}</div>
                  <div className="text-xs text-muted-foreground">{m.venue}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className="section-title flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Team Leaderboard
            </div>
            <div className="space-y-1.5">
              {leaderboard.map((p) => (
                <div key={p.rank} className="stat-card flex items-center gap-3 py-2.5">
                  <div className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-accent">
                    {p.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{p.stat}</div>
                  </div>
                  <span className="cricket-badge badge-green text-[0.55rem]">{p.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="section-title flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Notifications
            </div>
            <div className="space-y-1.5">
              {notifications.map((n) => (
                <div key={n.id} className="stat-card py-2.5">
                  <div className="text-xs">{n.text}</div>
                  <div className="text-[0.6rem] text-muted-foreground mt-0.5">{n.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Player Stats */}
          <div>
            <div className="section-title">Top Performers</div>
            <div className="space-y-1.5">
              {players.slice(0, 4).map((p) => (
                <div key={p.id} className="stat-card flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 bg-accent flex items-center justify-center text-xs font-bold">
                    #{p.jersey}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{p.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold">{p.runs}r</div>
                    <div className="text-[0.6rem] text-muted-foreground">SR {p.sr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
