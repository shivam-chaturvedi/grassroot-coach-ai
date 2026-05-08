import { createFileRoute } from "@tanstack/react-router";
import { players } from "@/lib/mock-data";
import { Search, Filter, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddPlayerModal } from "@/components/AddPlayerModal";

export const Route = createFileRoute("/players")({
  component: PlayersPage,
  head: () => ({ meta: [{ title: "Players — CricketIQ" }] }),
});

function PlayersPage() {
  const [search, setSearch] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Players</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{players.length} players in squad</p>
        </div>
        <Button variant="cricket" size="sm" onClick={() => setShowAddPlayer(true)}>+ Add Player</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." />
        </div>
        {["All", "Batsman", "Bowler", "All-rounder", "Wicket-keeper"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`h-9 px-3 text-xs font-semibold uppercase tracking-wider border transition-colors ${roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"}`}>{r}</button>
        ))}
      </div>

      {/* Player Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="stat-card block cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-accent flex items-center justify-center text-sm font-bold shrink-0">#{p.jersey}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.role} · {p.battingStyle}</div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Runs</div>
                    <div className="text-xs font-bold font-mono">{p.runs}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Avg</div>
                    <div className="text-xs font-bold font-mono">{p.avg}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">SR</div>
                    <div className="text-xs font-bold font-mono">{p.sr}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Wkts</div>
                    <div className="text-xs font-bold font-mono">{p.wickets}</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Fitness/Consistency bars */}
            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-[0.55rem] text-muted-foreground uppercase mb-0.5">
                  <span>Fitness</span><span>{p.fitness}%</span>
                </div>
                <div className="h-1 bg-accent"><div className="h-full bg-cricket-green" style={{ width: `${p.fitness}%` }} /></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[0.55rem] text-muted-foreground uppercase mb-0.5">
                  <span>Consistency</span><span>{p.consistency}%</span>
                </div>
                <div className="h-1 bg-accent"><div className="h-full bg-cricket-red" style={{ width: `${p.consistency}%` }} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
