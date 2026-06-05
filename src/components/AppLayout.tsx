import { useEffect, useState } from "react";
import { Navigate, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Menu, Bell, X, LogOut } from "lucide-react";
import {
  fetchAcademy,
  fetchNotifications,
  fetchProfile,
  fetchSession,
  signOut,
} from "@/lib/supabase-api";
import { getRoleHomePath, isRestrictedPlayerRoute } from "@/lib/role-access";
import { supabase } from "@/lib/supabase";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 60_000,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", sessionQuery.data?.user.id],
    queryFn: () => fetchProfile(sessionQuery.data!.user.id),
    enabled: !!sessionQuery.data?.user.id && !isAuthRoute,
    staleTime: 60_000,
  });

  const academyQuery = useQuery({
    queryKey: ["academy", profileQuery.data?.academy_id],
    queryFn: () => fetchAcademy(profileQuery.data!.academy_id!),
    enabled: !!profileQuery.data?.academy_id && !isAuthRoute,
    staleTime: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", sessionQuery.data?.user.id, profileQuery.data?.academy_id],
    queryFn: () => fetchNotifications(sessionQuery.data!.user.id, profileQuery.data?.academy_id),
    enabled: !!sessionQuery.data?.user.id && !isAuthRoute,
    staleTime: 15_000,
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      setShowLogoutConfirm(false);
      await queryClient.clear();
      await router.navigate({ to: "/login" });
    },
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      queryClient.setQueryData(["session"], session);

      if (!session) {
        queryClient.removeQueries({ queryKey: ["profile"] });
        queryClient.removeQueries({ queryKey: ["academy"] });
        queryClient.removeQueries({ queryKey: ["notifications"] });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["profile", session.user.id] });
      queryClient.invalidateQueries({ queryKey: ["academy"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  if (isAuthRoute) {
    return <Outlet />;
  }

  if (sessionQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading CricketIQ…</div>
      </div>
    );
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" />;
  }

  if (sessionQuery.data && profileQuery.data && !profileQuery.data.academy_id && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" />;
  }

  if (profileQuery.data && isRestrictedPlayerRoute(pathname) && profileQuery.data.role === "player") {
    return <Navigate to={getRoleHomePath(profileQuery.data.role)} />;
  }

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profile={profileQuery.data ?? null}
        academy={academyQuery.data ?? null}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 hover:bg-accent transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {academyQuery.data?.name ?? "CricketIQ"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="p-1.5 hover:bg-accent transition-colors relative"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-cricket-red" />
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border z-50 shadow-lg max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="text-sm font-bold">Notifications</span>
                      <button onClick={() => setNotifOpen(false)} className="p-0.5 hover:bg-accent">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {(notificationsQuery.data ?? []).map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                          <div className="text-xs">{n.title}</div>
                          <div className="text-[0.6rem] text-muted-foreground mt-1">{n.message}</div>
                        </div>
                      ))}
                      {(notificationsQuery.data ?? []).length === 0 && (
                        <div className="px-4 py-4 text-xs text-muted-foreground">No notifications yet.</div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-border">
                      <button
                        className="text-[0.65rem] text-cricket-red font-semibold uppercase tracking-widest hover:underline"
                        type="button"
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="hidden lg:inline-flex items-center gap-1 border border-input px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-accent"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
            <div className="w-7 h-7 bg-primary flex items-center justify-center text-[0.6rem] font-bold text-primary-foreground lg:hidden">
              {(profileQuery.data?.display_name ?? profileQuery.data?.full_name ?? "C")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children || <Outlet />}
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="w-full max-w-md border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center bg-cricket-red text-primary-foreground">
                  <LogOut className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Confirm logout</h2>
                  <p className="text-xs text-muted-foreground">You will need to sign in again to continue.</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground">
                Are you sure you want to log out from this account?
              </p>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                className="flex-1 border border-input px-4 py-2 text-sm font-semibold hover:bg-accent"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 bg-cricket-red px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav profile={profileQuery.data ?? null} />
    </div>
  );
}
