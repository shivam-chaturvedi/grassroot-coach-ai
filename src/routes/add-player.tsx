import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { battingStyles, bowlingTypes, playerRoles } from "@/lib/mock-data";
import { Camera, Save } from "lucide-react";

export const Route = createFileRoute("/add-player")({
  component: AddPlayerPage,
  head: () => ({ meta: [{ title: "Add Player — CricketIQ" }] }),
});

function AddPlayerPage() {
  const [form, setForm] = useState({
    name: "", age: "", battingStyle: "", bowlingType: "", role: "",
    jersey: "", strengths: "", weaknesses: "", position: "",
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Add Player</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Register a new player to the squad</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-accent flex items-center justify-center border border-dashed border-border cursor-pointer hover:border-cricket-red transition-colors">
          <Camera className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold">Player Photo</div>
          <div className="text-xs text-muted-foreground">Click to upload</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Full Name</label>
          <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Age</label>
          <input type="number" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Batting Style</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.battingStyle} onChange={e => setForm({...form, battingStyle: e.target.value})}>
            <option value="">Select...</option>
            {battingStyles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Bowling Type</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.bowlingType} onChange={e => setForm({...form, bowlingType: e.target.value})}>
            <option value="">Select...</option>
            {bowlingTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Role</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="">Select...</option>
            {playerRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Jersey Number</label>
          <input type="number" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.jersey} onChange={e => setForm({...form, jersey: e.target.value})} />
        </div>
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Preferred Batting Position</label>
          <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.position} onChange={e => setForm({...form, position: e.target.value})}>
            <option value="">Select...</option>
            {["Opener", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].map(p => <option key={p} value={p}>{p === "Opener" ? "Opener" : `#${p}`}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Strengths</label>
        <textarea className="mt-1 w-full h-16 px-3 py-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} placeholder="e.g. Power hitting, Cover drive..." />
      </div>
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Weaknesses</label>
        <textarea className="mt-1 w-full h-16 px-3 py-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={form.weaknesses} onChange={e => setForm({...form, weaknesses: e.target.value})} placeholder="e.g. Short ball, Spin bowling..." />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="cricket" className="flex-1"><Save className="w-3.5 h-3.5" /> Save Player</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}
