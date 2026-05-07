import { createFileRoute } from "@tanstack/react-router";
import { scoutPlayers } from "@/lib/mock-data";
import { Search, Filter, Star, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scout")({
  component: ScoutPage,
  head: () => ({ meta: [{ title: "Scout Discovery — CricketIQ" }] }),
});

function ScoutPage() {
  const [search, setSearch] = useState("");
  const [minSR, setMinSR] = useState(0);
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = scoutPlayers.filter(p => {
    return p.name.toLowerCase().includes(search.toLowerCase()) && p.sr >= minSR && (roleFilter === "All" || p.role === roleFilter);
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Eye className="w-5 h-5 text-cricket-red" /> Scout Discovery
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Discover hidden talent across districts</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search talent..." />
        </div>
        <div>
          <select className="h-9 px-3 text-xs bg-background border border-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option>All</option><option>Batsman</option><option>Bowler</option><option>All-rounder</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Min SR:</span>
          <input type="range" min={0} max={160} value={minSR} onChange={e => setMinSR(Number(e.target.value))} className="w-24" />
          <span className="text-xs font-mono w-8">{minSR}</span>
        </div>
      </div>

      {/* Player Cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">Age {p.age} · {p.district} · {p.academy}</div>
              </div>
              <span className="cricket-badge badge-dark">{p.role}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div>
                <div className="text-[0.55rem] text-muted-foreground uppercase">SR</div>
                <div className="text-sm font-bold font-mono">{p.sr}</div>
              </div>
              <div>
                <div className="text-[0.55rem] text-muted-foreground uppercase">Consistency</div>
                <div className="text-sm font-bold font-mono">{p.consistency}</div>
              </div>
              <div>
                <div className="text-[0.55rem] text-muted-foreground uppercase">Aggression</div>
                <div className="text-sm font-bold font-mono">{p.aggression}</div>
              </div>
              <div>
                <div className="text-[0.55rem] text-muted-foreground uppercase">Fitness</div>
                <div className="text-sm font-bold font-mono">{p.fitness}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="cricket" size="xs" className="flex-1"><Star className="w-3 h-3" /> Shortlist</Button>
              <Button variant="outline" size="xs" className="flex-1">View Profile</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div>
        <div className="section-title">Quick Comparison</div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Age</th><th>Role</th><th>SR</th><th>Consistency</th><th>Aggression</th><th>Fitness</th><th>District</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-accent/50">
                  <td className="font-semibold">{p.name}</td>
                  <td>{p.age}</td>
                  <td><span className="cricket-badge badge-dark">{p.role}</span></td>
                  <td className="font-mono">{p.sr}</td>
                  <td className="font-mono">{p.consistency}</td>
                  <td className="font-mono">{p.aggression}</td>
                  <td className="font-mono">{p.fitness}</td>
                  <td>{p.district}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
