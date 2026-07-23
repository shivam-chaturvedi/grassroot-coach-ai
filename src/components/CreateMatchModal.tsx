import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";
import {
  createMatch,
  fetchPlayers,
  fetchProfile,
  fetchSession,
  fetchTeams,
  type MatchFormat,
} from "@/lib/supabase-api";
import { labelFromEnum, matchTypes } from "@/lib/lookups";

export function CreateMatchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const teamsQuery = useQuery({
    queryKey: ["teams", profileQuery.data?.academy_id],
    queryFn: () => fetchTeams(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const [form, setForm] = useState({
    name: "", opponent: "", date: "", time: "", overs: "20",
    matchType: "t20", ground: "", tossResult: "", tossWinner: "",
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlayers.length !== 11) {
        throw new Error("Please select exactly 11 players before creating the match.");
      }
      if (!profileQuery.data?.academy_id) {
        throw new Error("No academy found for this account.");
      }
      const scheduledAt =
        form.date && form.time
          ? new Date(
              Number(form.date.slice(0, 4)),
              Number(form.date.slice(5, 7)) - 1,
              Number(form.date.slice(8, 10)),
              Number(form.time.slice(0, 2)),
              Number(form.time.slice(3, 5)),
            ).toISOString()
          : new Date().toISOString();
      return createMatch(profileQuery.data.academy_id, {
        matchName: form.name || null,
        opponentName: form.opponent,
        scheduledAt,
        matchFormat: (matchTypes.find((type) => type === form.matchType.toLowerCase()) ??
          "t20") as MatchFormat,
        overs: Number(form.overs),
        venue: form.ground || null,
        ground: form.ground || null,
        tossWinnerSide: form.tossWinner === "us" ? "our_team" : form.tossWinner === "them" ? "opponent" : null,
        tossDecision: form.tossResult === "bat" ? "bat_first" : form.tossResult === "bowl" ? "bowl_first" : null,
        teamId: teamsQuery.data?.[0]?.id ?? null,
        seasonId: teamsQuery.data?.[0]?.season_id ?? null,
        selectedPlayerIds: selectedPlayers,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
  });

  if (!open) return null;

  const togglePlayer = (id: string) => {
    setSelectionError(false);
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 11 ? [...prev, id] : prev
    );
  };

  const handleCreateMatch = () => {
    if (selectedPlayers.length !== 11) {
      setSelectionError(true);
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold">Create Match</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Match Name</label>
              <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Quarter Final" />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Opponent</label>
              <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})} placeholder="Team name" />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Date</label>
              <input type="date" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Time</label>
              <input type="time" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Overs</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.overs} onChange={e => setForm({...form, overs: e.target.value})}>
                {["10", "20", "50"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Match Type</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.matchType} onChange={e => setForm({...form, matchType: e.target.value})}>
                {matchTypes.map(t => <option key={t} value={t}>{labelFromEnum(t)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Ground (Optional)</label>
              <input className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.ground} onChange={e => setForm({...form, ground: e.target.value})} placeholder="e.g. Chepauk Stadium" />
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Toss Winner</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.tossWinner} onChange={e => setForm({...form, tossWinner: e.target.value})}>
                <option value="">Select</option>
                <option value="us">Our Team</option>
                <option value="them">Opponent</option>
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Toss Decision</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={form.tossResult} onChange={e => setForm({...form, tossResult: e.target.value})}>
                <option value="">Select</option>
                <option value="bat">Bat First</option>
                <option value="bowl">Bowl First</option>
              </select>
            </div>
          </div>

          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3" /> Select Playing XI ({selectedPlayers.length}/11)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(playersQuery.data ?? []).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayer(p.id)}
                  className={`p-2 border text-left transition-all ${selectedPlayers.includes(p.id) ? "border-cricket-red bg-cricket-red/5" : "border-input hover:bg-accent"}`}
                  title={p.full_name}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={`h-6 w-6 shrink-0 flex items-center justify-center text-[0.6rem] font-bold ${selectedPlayers.includes(p.id) ? "bg-cricket-red text-primary-foreground" : "bg-accent"}`}>
                      #{p.jersey_number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{p.full_name}</div>
                      <div className="truncate text-[0.55rem] text-muted-foreground">{labelFromEnum(p.player_role)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-border">
          <Button variant="cricket" className="flex-1" onClick={handleCreateMatch} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Match"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
      {selectionError && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectionError(false)}>
          <div className="w-full max-w-sm border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-bold">Playing XI incomplete</h3>
            </div>
            <div className="px-5 py-4 text-sm text-muted-foreground">
              Please select exactly 11 players before creating the match. You have selected {selectedPlayers.length}/11.
            </div>
            <div className="border-t border-border px-5 py-4">
              <Button variant="cricket" className="w-full" onClick={() => setSelectionError(false)}>
                Select players
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
