import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Lock, Palette, User, Users, Database, HelpCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — CricketIQ" }] }),
});

function SettingsPage() {
  const [notifications, setNotifications] = useState({ match: true, ai: true, milestone: true, chat: false });

  const sections = [
    { icon: Bell, label: "Notifications", desc: "Manage alert preferences" },
    { icon: Lock, label: "Privacy", desc: "Visibility and data sharing" },
    { icon: Palette, label: "Theme", desc: "Appearance settings" },
    { icon: User, label: "Account", desc: "Profile and credentials" },
    { icon: Users, label: "Team Settings", desc: "Team preferences" },
    { icon: Database, label: "Data Export", desc: "Export your data" },
    { icon: HelpCircle, label: "Support", desc: "Help and feedback" },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Settings List */}
      <div className="space-y-1.5">
        {sections.map(s => (
          <button key={s.label} className="stat-card w-full flex items-center gap-3 text-left">
            <div className="w-9 h-9 bg-accent flex items-center justify-center">
              <s.icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Notifications Toggle */}
      <div>
        <div className="section-title">Notification Preferences</div>
        <div className="space-y-2">
          {[
            { key: "match" as const, label: "Match Reminders" },
            { key: "ai" as const, label: "AI Recommendations" },
            { key: "milestone" as const, label: "Player Milestones" },
            { key: "chat" as const, label: "Chat Messages" },
          ].map(n => (
            <div key={n.key} className="stat-card flex items-center justify-between py-2.5">
              <span className="text-sm">{n.label}</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={`w-10 h-5 flex items-center transition-colors ${notifications[n.key] ? "bg-cricket-green" : "bg-accent"}`}
              >
                <div className={`w-4 h-4 bg-card shadow transition-transform ${notifications[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button variant="destructive" className="w-full">Log Out</Button>
      </div>
    </div>
  );
}
