import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Star, Shield, ChevronUp, ChevronDown, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPlayers, fetchProfile, fetchSession, fetchTeamRoster, fetchTeams, type PlayerRow } from "@/lib/supabase-api";
import { formatEnumLabel } from "@/lib/supabase-api";
import { upsertTeamRoster } from "@/lib/supabase-api";

type SquadMember = PlayerRow & {
  available: boolean;
  captain: boolean;
  viceCaptain: boolean;
  battingPos: number;
};

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team Management — CricketIQ" }] }),
});

function TeamPage() {
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
  const currentTeam = teamsQuery.data?.[0] ?? null;
  const playersQuery = useQuery({
    queryKey: ["players", profileQuery.data?.academy_id],
    queryFn: () => fetchPlayers(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id,
  });
  const rosterQuery = useQuery({
    queryKey: ["team-roster", currentTeam?.id],
    queryFn: () => fetchTeamRoster(currentTeam!.id),
    enabled: !!currentTeam?.id,
  });

  const initialSquad = useMemo(() => {
    const roster = rosterQuery.data ?? [];
    if (roster.length > 0) {
      return roster
        .map((entry) => {
          const player = playersQuery.data?.find((item) => item.id === entry.player_id);
          if (!player) return null;
          return {
            ...player,
            available: entry.is_available,
            captain: entry.is_captain,
            viceCaptain: entry.is_vice_captain,
            battingPos: entry.batting_position ?? 1,
          };
        })
        .filter(Boolean) as SquadMember[];
    }

    return (playersQuery.data ?? []).map((player, index) => ({
      ...player,
      available: true,
      captain: index === 0,
      viceCaptain: index === 1,
      battingPos: index + 1,
    }));
  }, [playersQuery.data, rosterQuery.data]);

  const [squad, setSquad] = useState<SquadMember[]>([]);

  useEffect(() => {
    setSquad(initialSquad);
  }, [initialSquad]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentTeam) {
        throw new Error("No team exists for this academy yet.");
      }
      return upsertTeamRoster({
        teamId: currentTeam.id,
        seasonId: currentTeam.season_id,
        roster: squad.map((player) => ({
          playerId: player.id,
          battingPosition: player.battingPos,
          isAvailable: player.available,
          isCaptain: player.captain,
          isViceCaptain: player.viceCaptain,
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-roster", currentTeam?.id] });
    },
  });

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...squad];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSquad(next.map((player, index) => ({ ...player, battingPos: index + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx >= squad.length - 1) return;
    const next = [...squad];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSquad(next.map((player, index) => ({ ...player, battingPos: index + 1 })));
  };

  const toggleAvailability = (id: string) => {
    setSquad((prev) => prev.map((player) => (player.id === id ? { ...player, available: !player.available } : player)));
  };

  const setCaptain = (id: string) => {
    setSquad((prev) => prev.map((player) => ({ ...player, captain: player.id === id })));
  };

  const setViceCaptain = (id: string) => {
    setSquad((prev) => prev.map((player) => ({ ...player, viceCaptain: player.id === id })));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Team Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage squad, batting order, and availability</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono">{squad.length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Total</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono text-cricket-green">{squad.filter((player) => player.available).length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Available</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono text-cricket-red">{squad.filter((player) => !player.available).length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">Unavailable</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-lg font-bold font-mono">{squad.filter((player) => player.player_role === "all_rounder").length}</div>
          <div className="text-[0.6rem] text-muted-foreground uppercase">All-rounders</div>
        </div>
      </div>

      <div>
        <div className="section-title">Batting Order</div>
        <div className="space-y-1.5">
          {squad.map((player, idx) => (
            <div key={player.id} className={`stat-card flex items-center gap-3 ${!player.available ? "opacity-40" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} className="hover:text-cricket-red transition-colors" type="button"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => moveDown(idx)} className="hover:text-cricket-red transition-colors" type="button"><ChevronDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-7 h-7 bg-accent flex items-center justify-center text-xs font-bold">{player.battingPos}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {player.full_name}
                  {player.captain && <span className="cricket-badge badge-red text-[0.5rem]">C</span>}
                  {player.viceCaptain && <span className="cricket-badge badge-dark text-[0.5rem]">VC</span>}
                </div>
                <div className="text-[0.6rem] text-muted-foreground">{formatEnumLabel(player.player_role)} · #{player.jersey_number}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCaptain(player.id)} className={`p-1.5 border transition-colors ${player.captain ? "bg-cricket-red text-primary-foreground border-cricket-red" : "border-input hover:border-cricket-red"}`} title="Captain" type="button">
                  <Star className="w-3 h-3" />
                </button>
                <button onClick={() => setViceCaptain(player.id)} className={`p-1.5 border transition-colors ${player.viceCaptain ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary"}`} title="Vice Captain" type="button">
                  <Shield className="w-3 h-3" />
                </button>
                <button onClick={() => toggleAvailability(player.id)} className={`p-1.5 border transition-colors ${player.available ? "bg-cricket-green text-primary-foreground border-cricket-green" : "border-input text-cricket-red"}`} title="Availability" type="button">
                  {player.available ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
          {squad.length === 0 && (
            <div className="stat-card text-sm text-muted-foreground">Create a team and add players first.</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="cricket" className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Team"}
        </Button>
        <Button variant="outline" onClick={() => setSquad(initialSquad)}>Reset Order</Button>
      </div>
    </div>
  );
}
