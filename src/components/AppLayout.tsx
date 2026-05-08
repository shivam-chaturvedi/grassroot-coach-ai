import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Menu, Bell, X } from "lucide-react";
import { currentUser, notifications } from "@/lib/mock-data";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                {currentUser.academy}
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
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                          <div className="text-xs">{n.text}</div>
                          <div className="text-[0.6rem] text-muted-foreground mt-1">{n.time}</div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-border">
                      <button className="text-[0.65rem] text-cricket-red font-semibold uppercase tracking-widest hover:underline">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-7 h-7 bg-primary flex items-center justify-center text-[0.6rem] font-bold text-primary-foreground lg:hidden">
              {currentUser.avatar}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children || <Outlet />}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
