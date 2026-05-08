import { useState } from "react";
import { Button } from "@/components/ui/button";
import { battingStyles, bowlingTypes, playerRoles } from "@/lib/mock-data";
import { Camera, Save, X } from "lucide-react";

export function AddPlayerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", age: "", battingStyle: "", bowlingType: "", role: "",
    jersey: "", strengths: "", weaknesses: "", position: "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold">Add Player</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-accent flex items-center justify-center border border-dashed border-border cursor-pointer hover:border-cricket-red transition-colors">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-semibold">Player Photo</div>
              <div className="text-[0.6rem] text-muted-foreground">Click to upload</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Full Name</label>
              <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Age</label>
              <input type="number" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Role</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="">Select...</option>
                {playerRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Jersey #</label>
              <input type="number" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.jersey} onChange={e => setForm({...form, jersey: e.target.value})} />
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
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Strengths</label>
            <textarea className="mt-1 w-full h-14 px-3 py-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} placeholder="e.g. Power hitting, Cover drive..." />
          </div>
          <div>
            <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Weaknesses</label>
            <textarea className="mt-1 w-full h-14 px-3 py-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={form.weaknesses} onChange={e => setForm({...form, weaknesses: e.target.value})} placeholder="e.g. Short ball, Spin bowling..." />
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          <Button variant="cricket" className="flex-1" onClick={onClose}><Save className="w-3.5 h-3.5" /> Save Player</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
