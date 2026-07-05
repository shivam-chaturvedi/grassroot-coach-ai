import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Swords, Users, BarChart3, UserCircle } from "lucide-react";
import type { ProfileRow } from "@/lib/supabase-api";
import { canAccessStaffArea } from "@/lib/role-access";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, staffOnly: false },
  { title: "Matches", url: "/matches", icon: Swords, staffOnly: false },
  { title: "Team", url: "/team", icon: Users, staffOnly: true },
  { title: "Analytics", url: "/analytics", icon: BarChart3, staffOnly: true },
  { title: "Profile", url: "/profile", icon: UserCircle, staffOnly: false },
];

export function BottomNav({ profile }: { profile: ProfileRow | null }) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const visibleItems = items.filter((item) => !item.staffOnly || canAccessStaffArea(profile?.role));

  return (
    <div className="mobile-nav lg:hidden">
      {visibleItems.map((item) => {
        const isActive = currentPath === item.url || (item.url !== "/" && currentPath.startsWith(item.url));
        return (
          <Link
            key={item.url}
            to={item.url}
            className={`mobile-nav-item ${isActive ? "mobile-nav-item-active" : ""}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
