import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Swords, Users, BarChart3, UserCircle } from "lucide-react";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Matches", url: "/matches", icon: Swords },
  { title: "Team", url: "/team", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

export function BottomNav() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mobile-nav lg:hidden">
      {items.map((item) => {
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
