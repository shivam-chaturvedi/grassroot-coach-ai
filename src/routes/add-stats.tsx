import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { players, recentMatches } from "@/lib/mock-data";
import { Save, Trash2, Edit2 } from "lucide-react";

export const Route = createFileRoute("/add-stats")({
  component: AddStatsPage,
  head: () => ({ meta: [{ title: "Add Stats — CricketIQ" }] }),
});

function AddStatsPage() {
  const [selectedMatch, setSelectedMatch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [stats, setStats] = useState({
    runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0,
    overs: 0, runsConceded: 0, maidens: 0, catches: 0, runOuts: 0,
    dotBalls: 0, notes: "",
  });
  const [showDelete, setShowDelete] = useState(false);

  const sr = stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1) : "0.0";
  const economy = stats.overs > 0 ? (stats.runsConceded / stats.overs).toFixed(2) : "0.00";
  const boundaries = stats.fours + stats.sixes;

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Add Stats</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Record player performance data</p>
      </div>

      {/* Selectors */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Select Match</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
            <option value="">Choose match...</option>
            {recentMatches.map(m => <option key={m.id} value={m.id}>{m.opponent} — {m.date}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Select Player</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
            <option value="">Choose player...</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
          </select>
        </div>
      </div>

      {/* Calculated Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <div className="stat-card text-center">
          <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">Strike Rate</div>
          <div className="text-lg font-bold font-mono mt-1">{sr}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">Economy</div>
          <div className="text-lg font-bold font-mono mt-1">{economy}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">Boundaries</div>
          <div className="text-lg font-bold font-mono mt-1">{boundaries}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">Dots</div>
          <div className="text-lg font-bold font-mono mt-1">{stats.dotBalls}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">Run Outs</div>
          <div className="text-lg font-bold font-mono mt-1">{stats.runOuts}</div>
        </div>
      </div>

      {/* Stat Entry */}
      <div className="section-title">Batting Stats</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "runs", label: "Runs" },
          { key: "ballsFaced", label: "Balls Faced" },
          { key: "fours", label: "4s" },
          { key: "sixes", label: "6s" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
            <input type="number" min={0} className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats[key as keyof typeof stats]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} />
          </div>
        ))}
      </div>

      <div className="section-title">Bowling Stats</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "wickets", label: "Wickets" },
          { key: "overs", label: "Overs" },
          { key: "runsConceded", label: "Runs Conceded" },
          { key: "maidens", label: "Maidens" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
            <input type="number" min={0} className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats[key as keyof typeof stats]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} />
          </div>
        ))}
      </div>

      <div className="section-title">Fielding & Notes</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Catches</label>
          <input type="number" min={0} className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats.catches} onChange={e => setStats({...stats, catches: Number(e.target.value)})} />
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Run Outs</label>
          <input type="number" min={0} className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats.runOuts} onChange={e => setStats({...stats, runOuts: Number(e.target.value)})} />
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Dot Balls</label>
          <input type="number" min={0} className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats.dotBalls} onChange={e => setStats({...stats, dotBalls: Number(e.target.value)})} />
        </div>
      </div>
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Coach Notes</label>
        <textarea className="mt-1 w-full h-20 px-3 py-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={stats.notes} onChange={e => setStats({...stats, notes: e.target.value})} placeholder="Performance notes..." />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="cricket" className="flex-1"><Save className="w-3.5 h-3.5" /> Save Stats</Button>
        <Button variant="outline"><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-card border border-border p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm">Delete Stats Entry?</h3>
            <p className="text-xs text-muted-foreground mt-2">This action cannot be undone. The player stats for this match will be permanently deleted.</p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => setShowDelete(false)}>Delete</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDelete(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
