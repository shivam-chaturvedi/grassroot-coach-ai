import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Search, UserMinus } from "lucide-react";
import { AddPlayerModal } from "@/components/AddPlayerModal";
import { fetchPlayers, fetchProfile, fetchSession, formatEnumLabel, removeAcademyPlayer, type PlayerRow } from "@/lib/supabase-api";
import { canManageAcademyUi } from "@/lib/role-access";

export const Route = createFileRoute("/players")({
  component: PlayersPage,
  head: () => ({ meta: [{ title: "Players — CricketIQ" }] }),
});

function PlayersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | null>(null);
  const [kickingPlayer, setKickingPlayer] = useState<PlayerRow | null>(null);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id,
  });
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });

  const filtered = useMemo(() => {
    const players = playersQuery.data ?? [];
    return players.filter((player) => {
      const matchSearch = player.full_name.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || player.player_role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [playersQuery.data, roleFilter, search]);

  const roleButtons = ["all", "batsman", "bowler", "all_rounder", "wicket_keeper"];
  const canManagePlayers = canManageAcademyUi(profileQuery.data?.role);
  const removeMutation = useMutation({
    mutationFn: (playerId: string) => removeAcademyPlayer(playerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["players"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setKickingPlayer(null);
    },
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Players</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{playersQuery.data?.length ?? 0} players in squad</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players..."
          />
        </div>
        {roleButtons.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`h-9 px-3 text-xs font-semibold uppercase tracking-wider border transition-colors ${
              roleFilter === role ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"
            }`}
          >
            {role === "all" ? "All" : formatEnumLabel(role)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((player) => (
          <div key={player.id} className="stat-card block">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-accent flex items-center justify-center text-sm font-bold shrink-0">
                #{player.jersey_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{player.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatEnumLabel(player.player_role)} · {formatEnumLabel(player.batting_style)}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Age</div>
                    <div className="text-xs font-bold font-mono">{player.age}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Fit</div>
                    <div className="text-xs font-bold font-mono">{player.fitness_rating}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Cons</div>
                    <div className="text-xs font-bold font-mono">{player.consistency_rating}</div>
                  </div>
                  <div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Agg</div>
                    <div className="text-xs font-bold font-mono">{player.aggression_rating}</div>
                  </div>
                </div>
              </div>
              {canManagePlayers && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(player)}
                    className="border border-input p-2 hover:bg-accent"
                    title="Edit player"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setKickingPlayer(player)}
                    className="border border-input p-2 text-cricket-red hover:bg-accent"
                    title="Remove player"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-[0.55rem] text-muted-foreground uppercase mb-0.5">
                  <span>Fitness</span><span>{player.fitness_rating}%</span>
                </div>
                <div className="h-1 bg-accent">
                  <div className="h-full bg-cricket-green" style={{ width: `${player.fitness_rating}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[0.55rem] text-muted-foreground uppercase mb-0.5">
                  <span>Consistency</span><span>{player.consistency_rating}%</span>
                </div>
                <div className="h-1 bg-accent">
                  <div className="h-full bg-cricket-red" style={{ width: `${player.consistency_rating}%` }} />
                </div>
              </div>
            </div>
            {canManagePlayers && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <div className="uppercase tracking-wider">Position</div>
                  <div className="mt-1 text-foreground">{player.position ?? "Not set"}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wider">Notes</div>
                  <div className="mt-1 text-foreground">{player.notes ?? "No notes yet"}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="stat-card col-span-full text-sm text-muted-foreground">
            {canManagePlayers
              ? "No approved players are showing yet. Approved academy join requests will appear here after the latest database migration is applied."
              : "No players found yet."}
          </div>
        )}
      </div>

      <AddPlayerModal open={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} />

      {kickingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setKickingPlayer(null)}>
          <div className="w-full max-w-md border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold">Remove player</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                This will remove the player from the academy roster and revoke academy access.
              </p>
            </div>
            <div className="px-5 py-4 text-sm">
              Are you sure you want to remove <span className="font-semibold">{kickingPlayer.full_name}</span>?
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                className="flex-1 border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
                onClick={() => setKickingPlayer(null)}
                disabled={removeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 bg-cricket-red px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                onClick={() => removeMutation.mutate(kickingPlayer.id)}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? "Removing..." : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
