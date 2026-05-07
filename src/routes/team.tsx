import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { players } from "@/lib/mock-data";
import { GripVertical, Star, Shield, ChevronUp, ChevronDown, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team Management — CricketIQ" }] }),
});

function TeamPage() {
  const [squad, setSquad] = useState(players.map((p, i) => ({
    ...p,
    available: true,
    captain: i === 0,
    viceCaptain: i === 3,
    battingPos: i + 1,
  })));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...squad];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSquad(next.map((p, i) => ({ ...p, battingPos: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx >= squad.length - 1) return;
    const next = [...squad];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSquad(next.map((p, i) => ({ ...p, battingPos: i + 1 })));
  };

  const toggleAvailability = (id: number) => {
    setSquad(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));
  };

  const setCaptain = (id: number) => {
    setSquad(prev => prev.map(p => ({ ...p, captain: p.id === id })));
  };

  const setViceCaptain = (id: number) => {
    setSquad(prev => prev.map(p => ({ ...p, viceCaptain: p.id === id })));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Team Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage squad, batting order, and availability</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono">{squad.length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Total</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono text-cricket-green">{squad.filter(p => p.available).length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Available</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono text-cricket-red">{squad.filter(p => !p.available).length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Unavailable</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono">{squad.filter(p => p.role === "All-rounder").length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">All-rounders</div>
        </div>
      </div>

      {/* Batting Order */}
      <div>
        <div className="section-title">Batting Order (Drag to Reorder)</div>
        <div className="space-y-1.5">
          {squad.map((p, idx) => (
            <div key={p.id} className={`stat-card flex items-center gap-3 ${!p.available ? "opacity-40" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} className="hover:text-cricket-red transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => moveDown(idx)} className="hover:text-cricket-red transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-7 h-7 bg-accent flex items-center justify-center text-xs font-bold">{p.battingPos}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {p.name}
                  {p.captain && <span className="cricket-badge badge-red text-[0.5rem]">C</span>}
                  {p.viceCaptain && <span className="cricket-badge badge-dark text-[0.5rem]">VC</span>}
                </div>
                <div className="text-[0.6rem] text-muted-foreground">{p.role} · #{p.jersey}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCaptain(p.id)} className={`p-1.5 border transition-colors ${p.captain ? "bg-cricket-red text-primary-foreground border-cricket-red" : "border-input hover:border-cricket-red"}`} title="Captain">
                  <Star className="w-3 h-3" />
                </button>
                <button onClick={() => setViceCaptain(p.id)} className={`p-1.5 border transition-colors ${p.viceCaptain ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"}`} title="Vice Captain">
                  <Shield className="w-3 h-3" />
                </button>
                <button onClick={() => toggleAvailability(p.id)} className={`p-1.5 border transition-colors ${p.available ? "bg-cricket-green text-primary-foreground border-cricket-green" : "border-input text-cricket-red"}`} title="Availability">
                  {p.available ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="cricket" className="flex-1">Save Team</Button>
        <Button variant="outline">Reset Order</Button>
      </div>
    </div>
  );
}
