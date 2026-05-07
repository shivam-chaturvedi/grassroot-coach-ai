import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Menu, Bell } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
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
                {currentUser.academy}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-accent transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-cricket-red" />
            </button>
            <div className="w-7 h-7 bg-primary flex items-center justify-center text-[0.6rem] font-bold text-primary-foreground lg:hidden">
              {currentUser.avatar}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children || <Outlet />}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
