import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatEnumLabel } from "@/lib/supabase-api";
import {
  fetchAcademyJoinRequests,
  fetchPlayers,
  fetchProfile,
  fetchSession,
  reviewAcademyJoinRequest,
} from "@/lib/supabase-api";
import { canManageAcademyUi } from "@/lib/role-access";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Requests — CricketIQ" }] }),
});

function RequestsPage() {
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<Record<string, string>>({});
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
  const requestsQuery = useQuery({
    queryKey: ["academy-join-requests", profileQuery.data?.academy_id],
    queryFn: () => fetchAcademyJoinRequests(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id && canManageAcademyUi(profileQuery.data?.role),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      decision,
    }: {
      requestId: string;
      decision: "approved" | "rejected";
    }) =>
      reviewAcademyJoinRequest(
        requestId,
        decision,
        responses[requestId]?.trim() || null,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["academy-join-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["players"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  if (profileQuery.data && !canManageAcademyUi(profileQuery.data.role)) {
    return <Navigate to="/profile" />;
  }

  const pending = (requestsQuery.data ?? []).filter((item) => item.status === "pending");
  const approved = (requestsQuery.data ?? []).filter((item) => item.status === "approved");
  const rejected = (requestsQuery.data ?? []).filter((item) => item.status === "rejected");

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Join Requests</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Review player requests before adding them to your academy.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length },
          { label: "Approved", value: approved.length },
          { label: "Rejected", value: rejected.length },
        ].map((item) => (
          <div key={item.label} className="stat-card text-center">
            <div className="text-[0.6rem] uppercase text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-xl font-bold font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {pending.map((request) => {
          const linkedPlayer = (playersQuery.data ?? []).find((player) => player.profile_id === request.requester_user_id);
          return (
            <div key={request.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    {linkedPlayer?.full_name || `Player ${request.requester_user_id.slice(0, 8)}`}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Request received on {new Date(request.created_at).toLocaleDateString()}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Requested playing role: {formatEnumLabel(request.requested_player_role)}
                  </div>
                </div>
                <span className="cricket-badge badge-dark">Pending</span>
              </div>

              <div className="mt-4">
                <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Response note
                </label>
                <textarea
                  className="mt-1 h-20 w-full border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional note for approval or rejection"
                  value={responses[request.id] ?? ""}
                  onChange={(event) => setResponses((prev) => ({ ...prev, [request.id]: event.target.value }))}
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="cricket"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ requestId: request.id, decision: "approved" })}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ requestId: request.id, decision: "rejected" })}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <div className="stat-card text-sm text-muted-foreground">No pending requests right now.</div>
        )}
      </div>
    </div>
  );
}
