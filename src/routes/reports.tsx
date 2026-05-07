import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — CricketIQ" }] }),
});

function ReportsPage() {
  const seasonData = [
    { metric: "Total Matches", value: "34" },
    { metric: "Win Rate", value: "64.7%" },
    { metric: "Avg Team Score", value: "173.2" },
    { metric: "Top Scorer", value: "Arjun Patel (1,240)" },
    { metric: "Top Bowler", value: "Suresh Menon (68 wkts)" },
    { metric: "Best Fielder", value: "Kiran Naidu (45 catches)" },
  ];

  const monthlyRuns = [
    { month: "Jan", runs: 820 }, { month: "Feb", runs: 950 }, { month: "Mar", runs: 1100 },
    { month: "Apr", runs: 1380 }, { month: "May", runs: 1640 },
  ];

  const reports = [
    { name: "Season Summary 2025-26", date: "May 5, 2026", type: "PDF" },
    { name: "Player Performance Report", date: "May 3, 2026", type: "CSV" },
    { name: "AI Analysis Report — vs Mumbai", date: "May 1, 2026", type: "PDF" },
    { name: "Training Attendance Log", date: "Apr 28, 2026", type: "CSV" },
    { name: "Financial Report Q1", date: "Apr 15, 2026", type: "PDF" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Season summaries and exportable reports</p>
      </div>

      {/* Season Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {seasonData.map(s => (
          <div key={s.metric} className="stat-card">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{s.metric}</div>
            <div className="text-sm font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="stat-card">
        <div className="section-title">Monthly Team Runs</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyRuns}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
            <Bar dataKey="runs" fill="var(--cricket-red)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Report Downloads */}
      <div>
        <div className="section-title">Available Reports</div>
        <div className="space-y-1.5">
          {reports.map(r => (
            <div key={r.name} className="stat-card flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.date}</div>
              </div>
              <span className="cricket-badge badge-dark">{r.type}</span>
              <Button variant="outline" size="xs"><Download className="w-3 h-3" /> Export</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
