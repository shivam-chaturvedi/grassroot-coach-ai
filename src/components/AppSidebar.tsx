import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Users,
  Brain,
  FileText,
  School,
  Settings,
  PlusCircle,
  ClipboardList,
  UserPlus,
  Search,
  Activity,
  X,
} from "lucide-react";
import { currentUser } from "@/lib/mock-data";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Matches", url: "/matches", icon: Swords },
  { title: "Create Match", url: "/create-match", icon: PlusCircle },
  { title: "Add Stats", url: "/add-stats", icon: ClipboardList },
  { title: "Players", url: "/players", icon: Users },
  { title: "Add Player", url: "/add-player", icon: UserPlus },
  { title: "AI Analytics", url: "/analytics", icon: Brain },
  { title: "Team", url: "/team", icon: Activity },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Scout", url: "/scout", icon: Search },
  { title: "Academy", url: "/academy", icon: School },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-sidebar text-sidebar-foreground z-50 transition-transform duration-200 ease-out flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header */}
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

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 mb-3">
            <div className="section-title text-sidebar-foreground/40">Navigation</div>
          </div>
          {navItems.map((item) => {
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

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cricket-red flex items-center justify-center text-xs font-bold text-primary-foreground">
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{currentUser.name}</div>
              <div className="text-[0.6rem] text-sidebar-foreground/50 uppercase tracking-wider">{currentUser.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
