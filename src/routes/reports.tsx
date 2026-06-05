import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchProfile, fetchReports, fetchSession } from "@/lib/supabase-api";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — CricketIQ" }] }),
});

function ReportsPage() {
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const reportsQuery = useQuery({
    queryKey: ["reports", profileQuery.data?.academy_id],
    queryFn: () => fetchReports(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });

  const seasonData = [
    { metric: "Total Reports", value: String(reportsQuery.data?.length ?? 0) },
    { metric: "Latest Type", value: reportsQuery.data?.[0]?.report_type ?? "-" },
    { metric: "Latest Name", value: reportsQuery.data?.[0]?.report_name ?? "-" },
    { metric: "Exports Ready", value: reportsQuery.data?.filter((item) => !!item.file_url).length ?? 0 },
  ];

  const monthlyRuns = reportsQuery.data?.slice(0, 5).map((report, index) => ({
    month: new Date(report.generated_at).toLocaleDateString(undefined, { month: "short" }),
    runs: (index + 1) * 100,
  })) ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Season summaries and exportable reports</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {seasonData.map((item) => (
          <div key={item.metric} className="stat-card">
            <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{item.metric}</div>
            <div className="text-sm font-bold mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-card">
        <div className="section-title">Monthly Report Activity</div>
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

      <div>
        <div className="section-title">Available Reports</div>
        <div className="space-y-1.5">
          {(reportsQuery.data ?? []).map((report) => (
            <div key={report.id} className="stat-card flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{report.report_name}</div>
                <div className="text-xs text-muted-foreground">{new Date(report.generated_at).toLocaleDateString()}</div>
              </div>
              <span className="cricket-badge badge-dark">{report.report_type}</span>
              <Button variant="outline" size="xs" disabled={!report.file_url}>
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>
          ))}
          {(reportsQuery.data ?? []).length === 0 && <div className="stat-card text-sm text-muted-foreground">No reports generated yet.</div>}
        </div>
      </div>
    </div>
  );
}
