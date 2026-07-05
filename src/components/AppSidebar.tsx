import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Swords,
  Users,
  Brain,
  FileText,
  School,
  Activity,
  X,
  UserCircle,
  Inbox,
} from "lucide-react";
import type { AcademyRow, ProfileRow } from "@/lib/supabase-api";
import { formatEnumLabel } from "@/lib/supabase-api";
import { canAccessStaffArea, canManageAcademyUi } from "@/lib/role-access";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, staffOnly: false },
  { title: "Matches", url: "/matches", icon: Swords, staffOnly: false },
  { title: "Players", url: "/players", icon: Users, staffOnly: false },
  { title: "Profile", url: "/profile", icon: UserCircle, staffOnly: false },
  { title: "AI Analytics", url: "/analytics", icon: Brain, staffOnly: true },
  { title: "Team", url: "/team", icon: Activity, staffOnly: true },
  { title: "Reports", url: "/reports", icon: FileText, staffOnly: true },
  { title: "Requests", url: "/requests", icon: Inbox, staffOnly: true, managerOnly: true },
  { title: "Academy", url: "/academy", icon: School, staffOnly: true },
];

function getInitials(name?: string | null) {
  if (!name) return "C";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar({
  open,
  onClose,
  profile,
  academy,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileRow | null;
  academy: AcademyRow | null;
}) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const visibleNavItems = navItems.filter((item) => {
    if (item.managerOnly) return canManageAcademyUi(profile?.role);
    return !item.staffOnly || canAccessStaffArea(profile?.role);
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 bg-sidebar text-sidebar-foreground z-50 transition-transform duration-200 ease-out flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:shrink-0`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cricket-red flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">CQ</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">CricketIQ</div>
              <div className="text-[0.6rem] text-sidebar-foreground/50 uppercase tracking-widest">AI Analytics</div>
            </div>
          </div>
          <button className="lg:hidden p-1 hover:bg-sidebar-accent" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 mb-3">
            <div className="section-title text-sidebar-foreground/40">Navigation</div>
          </div>
          {visibleNavItems.map((item) => {
            const isActive = currentPath === item.url || (item.url !== "/" && currentPath.startsWith(item.url));
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={onClose}
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cricket-red flex items-center justify-center text-xs font-bold text-primary-foreground">
              {getInitials(profile?.display_name ?? profile?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">
                {profile?.display_name ?? profile?.full_name ?? "Signed in user"}
              </div>
              <div className="text-[0.6rem] text-sidebar-foreground/50 uppercase tracking-wider">
                {formatEnumLabel(profile?.role ?? "player")}
              </div>
              {academy && (
                <div className="text-[0.6rem] text-sidebar-foreground/50 truncate">
                  {academy.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
