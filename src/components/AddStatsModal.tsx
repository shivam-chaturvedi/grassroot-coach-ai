import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { createMatchStats, fetchMatches, fetchPlayers, fetchProfile, fetchSession } from "@/lib/supabase-api";

export function AddStatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const matchesQuery = useQuery({
    queryKey: ["matches", profileQuery.data?.academy_id],
    queryFn: () => fetchMatches(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const [selectedMatch, setSelectedMatch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [stats, setStats] = useState({
    runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0,
    overs: 0, runsConceded: 0, maidens: 0, catches: 0, runOuts: 0, dotBalls: 0, notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMatch || !selectedPlayer) {
        throw new Error("Choose a match and a player first.");
      }
      return createMatchStats({
        matchId: selectedMatch,
        playerId: selectedPlayer,
        didBat: stats.ballsFaced > 0 || stats.runs > 0,
        didBowl: stats.overs > 0,
        runs: stats.runs,
        ballsFaced: stats.ballsFaced,
        fours: stats.fours,
        sixes: stats.sixes,
        onesTaken: 0,
        twosTaken: 0,
        wickets: stats.wickets,
        oversBowled: stats.overs,
        runsConceded: stats.runsConceded,
        maidens: stats.maidens,
        catches: stats.catches,
        runOuts: stats.runOuts,
        dotBalls: stats.dotBalls,
        stumpings: 0,
        droppedCatches: 0,
        missedChances: 0,
        selfConfidenceRating: 7,
        selfEnergyRating: 7,
        selfFocusRating: 7,
        pressureHandlingRating: 7,
        matchImpactRating: 7,
        coachRating: 7,
        notes: stats.notes,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
  });

  if (!open) return null;

  const sr = stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1) : "0.0";
  const economy = stats.overs > 0 ? (stats.runsConceded / stats.overs).toFixed(2) : "0.00";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold">Add Stats</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Match</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                <option value="">Choose...</option>
                {(matchesQuery.data ?? []).map(m => <option key={m.id} value={m.id}>{m.opponent_name} — {new Date(m.scheduled_at).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Player</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
                <option value="">Choose...</option>
                {(playersQuery.data ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="stat-card text-center py-2">
              <div className="text-[0.55rem] font-semibold text-muted-foreground uppercase">SR</div>
              <div className="text-sm font-bold font-mono">{sr}</div>
            </div>
            <div className="stat-card text-center py-2">
              <div className="text-[0.55rem] font-semibold text-muted-foreground uppercase">Economy</div>
              <div className="text-sm font-bold font-mono">{economy}</div>
            </div>
            <div className="stat-card text-center py-2">
              <div className="text-[0.55rem] font-semibold text-muted-foreground uppercase">Boundaries</div>
              <div className="text-sm font-bold font-mono">{stats.fours + stats.sixes}</div>
            </div>
          </div>

          <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Batting</div>
          <div className="grid grid-cols-4 gap-2">
            {[{k:"runs",l:"Runs"},{k:"ballsFaced",l:"Balls"},{k:"fours",l:"4s"},{k:"sixes",l:"6s"}].map(({k,l}) => (
              <div key={k}>
                <label className="text-[0.55rem] text-muted-foreground">{l}</label>
                <input type="number" min={0} className="w-full h-8 px-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats[k as keyof typeof stats]} onChange={e => setStats({...stats, [k]: Number(e.target.value)})} />
              </div>
            ))}
          </div>

          <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Bowling</div>
          <div className="grid grid-cols-4 gap-2">
            {[{k:"wickets",l:"Wkts"},{k:"overs",l:"Overs"},{k:"runsConceded",l:"Runs"},{k:"maidens",l:"Maidens"}].map(({k,l}) => (
              <div key={k}>
                <label className="text-[0.55rem] text-muted-foreground">{l}</label>
                <input type="number" min={0} className="w-full h-8 px-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats[k as keyof typeof stats]} onChange={e => setStats({...stats, [k]: Number(e.target.value)})} />
              </div>
            ))}
          </div>

          <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Fielding</div>
          <div className="grid grid-cols-3 gap-2">
            {[{k:"catches",l:"Catches"},{k:"runOuts",l:"Run Outs"},{k:"dotBalls",l:"Dots"}].map(({k,l}) => (
              <div key={k}>
                <label className="text-[0.55rem] text-muted-foreground">{l}</label>
                <input type="number" min={0} className="w-full h-8 px-2 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none font-mono" value={stats[k as keyof typeof stats]} onChange={e => setStats({...stats, [k]: Number(e.target.value)})} />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[0.55rem] text-muted-foreground">Notes</label>
            <textarea className="w-full h-14 px-2 py-1 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none resize-none" value={stats.notes} onChange={e => setStats({...stats, notes: e.target.value})} placeholder="Coach notes..." />
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          <Button variant="cricket" className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Save className="w-3.5 h-3.5" /> {createMutation.isPending ? "Saving..." : "Save Stats"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
