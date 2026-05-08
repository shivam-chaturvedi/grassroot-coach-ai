import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { matchTypes, players } from "@/lib/mock-data";
import { Users, UserPlus, ClipboardList } from "lucide-react";
import { AddPlayerModal } from "@/components/AddPlayerModal";
import { AddStatsModal } from "@/components/AddStatsModal";

export const Route = createFileRoute("/create-match")({
  component: CreateMatchPage,
  head: () => ({ meta: [{ title: "Create Match — CricketIQ" }] }),
});

function CreateMatchPage() {
  const [form, setForm] = useState({
    name: "", opponent: "", date: "", time: "", overs: "20",
    matchType: "T20", ground: "", tossResult: "", tossWinner: "",
  });
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddStats, setShowAddStats] = useState(false);

  const togglePlayer = (id: number) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 11 ? [...prev, id] : prev
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Match</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Set up a new match</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddPlayer(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Add Player
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddStats(true)}>
            <ClipboardList className="w-3.5 h-3.5" /> Add Stats
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Match Name</label>
            <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Quarter Final" />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Opponent</label>
            <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})} placeholder="Team name" />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Date</label>
            <input type="date" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Time</label>
            <input type="time" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Overs</label>
            <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.overs} onChange={e => setForm({...form, overs: e.target.value})}>
              {["10", "20", "50"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Match Type</label>
            <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.matchType} onChange={e => setForm({...form, matchType: e.target.value})}>
              {matchTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Ground / Location (Optional)</label>
            <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.ground} onChange={e => setForm({...form, ground: e.target.value})} placeholder="e.g. Chepauk Stadium" />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Toss Winner</label>
            <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.tossWinner} onChange={e => setForm({...form, tossWinner: e.target.value})}>
              <option value="">Select</option>
              <option value="us">Our Team</option>
              <option value="them">Opponent</option>
            </select>
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Toss Decision</label>
            <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none transition-colors" value={form.tossResult} onChange={e => setForm({...form, tossResult: e.target.value})}>
              <option value="">Select</option>
              <option value="bat">Bat First</option>
              <option value="bowl">Bowl First</option>
            </select>
          </div>
        </div>

        <div>
          <div className="section-title flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Select Playing XI ({selectedPlayers.length}/11)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className={`stat-card text-left transition-all ${selectedPlayers.includes(p.id) ? "border-cricket-red bg-cricket-red/5" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 flex items-center justify-center text-[0.6rem] font-bold ${selectedPlayers.includes(p.id) ? "bg-cricket-red text-primary-foreground" : "bg-accent"}`}>
                    #{p.jersey}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{p.name}</div>
                    <div className="text-[0.55rem] text-muted-foreground">{p.role}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="cricket" className="flex-1">Create Match</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </div>

      <AddPlayerModal open={showAddPlayer} onClose={() => setShowAddPlayer(false)} />
      <AddStatsModal open={showAddStats} onClose={() => setShowAddStats(false)} />
    </div>
  );
}
