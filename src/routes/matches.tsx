import { createFileRoute } from "@tanstack/react-router";
import { upcomingMatches, recentMatches } from "@/lib/mock-data";
import { Calendar, MapPin, Clock, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreateMatchModal } from "@/components/CreateMatchModal";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
  head: () => ({
    meta: [{ title: "Matches — CricketIQ" }],
  }),
});

function MatchesPage() {
  const [showCreateMatch, setShowCreateMatch] = useState(false);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Matches</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track all matches</p>
        </div>
        <Button variant="cricket" size="sm" onClick={() => setShowCreateMatch(true)}>
          <Plus className="w-3.5 h-3.5" /> New Match
        </Button>
      </div>

      <div className="section-title">Upcoming</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcomingMatches.map((m) => (
          <div key={m.id} className="stat-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">vs {m.opponent}</span>
              <span className="cricket-badge badge-red">T{m.overs}</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{m.date}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{m.time}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{m.venue}</div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="xs" className="flex-1">Details</Button>
              <Button variant="tactical" size="xs" className="flex-1">Playing XI</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Match History</div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Date</th>
              <th>Format</th>
              <th>Score</th>
              <th>Opp Score</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {recentMatches.map((m) => (
              <tr key={m.id} className="hover:bg-accent/50 cursor-pointer transition-colors">
                <td className="font-semibold">{m.opponent}</td>
                <td className="text-muted-foreground">{m.date}</td>
                <td><span className="cricket-badge badge-dark">T{m.overs}</span></td>
                <td className="font-mono">{m.score}</td>
                <td className="font-mono">{m.oppScore}</td>
                <td className={`font-semibold ${m.result.startsWith("Won") ? "text-cricket-green" : "text-cricket-red"}`}>{m.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
