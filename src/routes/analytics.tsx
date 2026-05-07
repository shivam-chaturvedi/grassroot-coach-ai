import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { players } from "@/lib/mock-data";
import { Brain, Zap, Target, Shield, TrendingUp, Shuffle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "AI Analytics — CricketIQ" }] }),
});

function AnalyticsPage() {
  const [tab, setTab] = useState<"xi" | "tactics" | "compare" | "simulation">("xi");

  const aiXI = players.slice(0, 8).map((p, i) => ({
    ...p,
    aiScore: Math.round(70 + Math.random() * 25),
    suggestedOrder: i + 1,
  }));

  const battingOrder = [
    { pos: 1, name: "Arjun Patel", role: "Opener", reason: "SR 138.5, Powerplay specialist" },
    { pos: 2, name: "Deepak Reddy", role: "Opener", reason: "Avg 39.3, Consistent starter" },
    { pos: 3, name: "Rahul Dravid Jr.", role: "Anchor", reason: "Technique score 92, Calm under pressure" },
    { pos: 4, name: "Deepak Reddy", role: "Power", reason: "SR 128.9 in middle overs" },
    { pos: 5, name: "Vikram Singh", role: "Finisher", reason: "All-rounder flexibility" },
    { pos: 6, name: "Kiran Naidu", role: "WK-Bat", reason: "SR 132.1, Finisher ability" },
    { pos: 7, name: "Anil Kapoor", role: "All-rounder", reason: "38 wickets + batting" },
  ];

  const pressureData = [
    { phase: "Powerplay", performance: 88, average: 72 },
    { phase: "Middle", performance: 65, average: 68 },
    { phase: "Death", performance: 82, average: 60 },
    { phase: "Chase", performance: 78, average: 65 },
    { phase: "Defend", performance: 72, average: 70 },
  ];

  const tabs = [
    { key: "xi" as const, label: "AI Playing XI", icon: Brain },
    { key: "tactics" as const, label: "Tactical Board", icon: Target },
    { key: "compare" as const, label: "Player Compare", icon: BarChart3 },
    { key: "simulation" as const, label: "Match Simulation", icon: Zap },
  ];

  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-cricket-red" /> AI Analytics Engine
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Tactical intelligence and performance analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 h-9 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border ${tab === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "xi" && (
        <div className="space-y-5">
          <div className="tactical-card">
            <div className="section-title flex items-center gap-1"><Brain className="w-3 h-3" /> AI Recommended Playing XI</div>
            <p className="text-xs text-muted-foreground mb-3">Based on opponent analysis, recent form, fitness levels, and match conditions</p>
            <div className="space-y-1.5">
              {battingOrder.map(b => (
                <div key={b.pos} className="flex items-center gap-3 p-2 bg-background border border-border hover:border-cricket-red transition-colors">
                  <div className="w-7 h-7 bg-cricket-red text-primary-foreground flex items-center justify-center text-xs font-bold">{b.pos}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{b.name}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{b.reason}</div>
                  </div>
                  <span className="cricket-badge badge-dark">{b.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Scores */}
          <div>
            <div className="section-title">Player AI Scores</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {aiXI.map(p => (
                <div key={p.id} className="stat-card">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">{p.name}</div>
                    <div className={`text-sm font-bold font-mono ${p.aiScore > 85 ? "text-cricket-green" : p.aiScore > 70 ? "text-foreground" : "text-cricket-red"}`}>{p.aiScore}</div>
                  </div>
                  <div className="mt-1.5 h-1 bg-accent">
                    <div className={`h-full ${p.aiScore > 85 ? "bg-cricket-green" : p.aiScore > 70 ? "bg-foreground" : "bg-cricket-red"}`} style={{ width: `${p.aiScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "tactics" && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tactical Suggestions */}
            <div className="space-y-2">
              <div className="section-title">Tactical Suggestions</div>
              {[
                { icon: Target, title: "Powerplay Attack", desc: "Target off-side boundaries in first 6 overs. Opposition weak on off-stump line.", priority: "high" },
                { icon: Shield, title: "Middle Overs Control", desc: "Rotate strike through overs 7-15. Minimize dot balls. Target 6-7 RPO.", priority: "medium" },
                { icon: Zap, title: "Death Overs Blitz", desc: "Use Arjun Patel and Vikram Singh. Target 12+ RPO in last 4 overs.", priority: "high" },
                { icon: Shuffle, title: "Bowling Rotation", desc: "Start with Suresh Menon and Priya Sharma. Use spin in overs 8-14.", priority: "medium" },
              ].map((s, i) => (
                <div key={i} className="tactical-card flex items-start gap-3">
                  <s.icon className="w-4 h-4 mt-0.5 text-cricket-red" />
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <span className={`cricket-badge ${s.priority === "high" ? "badge-red" : "badge-dark"} shrink-0`}>{s.priority}</span>
                </div>
              ))}
            </div>

            {/* Pressure Performance */}
            <div className="stat-card">
              <div className="section-title">Pressure Performance Index</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pressureData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="phase" type="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 11 }} />
                  <Bar dataKey="performance" fill="var(--cricket-red)" />
                  <Bar dataKey="average" fill="var(--border)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Aggression & Consistency */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Aggression Index", value: "78.4", change: "+3.2" },
              { label: "Finisher Rating", value: "82.1", change: "+5.1" },
              { label: "Powerplay Impact", value: "88.6", change: "+1.8" },
              { label: "Death Over Econ.", value: "7.2", change: "-0.5" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</div>
                <div className="text-xl font-bold font-mono mt-1">{s.value}</div>
                <div className="text-[0.6rem] text-cricket-green font-semibold">{s.change}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "compare" && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Player A</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={compareA} onChange={e => setCompareA(Number(e.target.value))}>
                {players.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Player B</label>
              <select className="mt-1 w-full h-9 px-3 text-sm bg-background border border-input focus:border-cricket-red focus:outline-none" value={compareB} onChange={e => setCompareB(Number(e.target.value))}>
                {players.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="stat-card">
            <div className="section-title">Head-to-Head Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={[
                { stat: "Runs", a: players[compareA].runs / 15, b: players[compareB].runs / 15 },
                { stat: "Average", a: players[compareA].avg, b: players[compareB].avg },
                { stat: "SR", a: players[compareA].sr, b: players[compareB].sr },
                { stat: "Fitness", a: players[compareA].fitness, b: players[compareB].fitness },
                { stat: "Consistency", a: players[compareA].consistency, b: players[compareB].consistency },
                { stat: "Aggression", a: players[compareA].aggression, b: players[compareB].aggression },
              ]}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar dataKey="a" stroke="var(--cricket-red)" fill="var(--cricket-red)" fillOpacity={0.2} />
                <Radar dataKey="b" stroke="var(--cricket-green)" fill="var(--cricket-green)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-cricket-red" />{players[compareA].name}</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-cricket-green" />{players[compareB].name}</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Stat</th><th>{players[compareA].name}</th><th>{players[compareB].name}</th></tr>
            </thead>
            <tbody>
              {[
                { stat: "Matches", a: players[compareA].matches, b: players[compareB].matches },
                { stat: "Runs", a: players[compareA].runs, b: players[compareB].runs },
                { stat: "Average", a: players[compareA].avg, b: players[compareB].avg },
                { stat: "Strike Rate", a: players[compareA].sr, b: players[compareB].sr },
                { stat: "Wickets", a: players[compareA].wickets, b: players[compareB].wickets },
              ].map(r => (
                <tr key={r.stat}>
                  <td className="font-semibold">{r.stat}</td>
                  <td className={`font-mono ${r.a > r.b ? "text-cricket-green font-bold" : ""}`}>{r.a}</td>
                  <td className={`font-mono ${r.b > r.a ? "text-cricket-green font-bold" : ""}`}>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "simulation" && (
        <div className="space-y-5">
          <div className="tactical-card">
            <div className="section-title flex items-center gap-1"><Zap className="w-3 h-3" /> Match Simulation Engine</div>
            <p className="text-xs text-muted-foreground mb-4">AI-powered prediction based on team form, conditions, and opponent analysis</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card text-center border-cricket-green" style={{ borderColor: "var(--cricket-green)" }}>
                <div className="text-3xl font-bold font-mono text-cricket-green">68%</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Win Probability</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-3xl font-bold font-mono">172</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Predicted Score</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-3xl font-bold font-mono">7.4</div>
                <div className="text-[0.6rem] font-semibold text-muted-foreground uppercase mt-1">Predicted RR</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="section-title">Key Match Factors</div>
              {[
                { factor: "Home advantage", impact: 85 },
                { factor: "Recent form", impact: 78 },
                { factor: "Head-to-head record", impact: 62 },
                { factor: "Pitch conditions", impact: 71 },
                { factor: "Player fitness", impact: 88 },
              ].map(f => (
                <div key={f.factor} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 text-xs">{f.factor}</div>
                  <div className="w-24 h-1.5 bg-accent"><div className="h-full bg-cricket-red" style={{ width: `${f.impact}%` }} /></div>
                  <div className="text-xs font-mono w-8 text-right">{f.impact}%</div>
                </div>
              ))}
            </div>
            <div className="stat-card">
              <div className="section-title">Scenario Analysis</div>
              {[
                { scenario: "If batting first", win: "72%" },
                { scenario: "If bowling first", win: "58%" },
                { scenario: "If Arjun Patel scores 50+", win: "82%" },
                { scenario: "If rain interruption", win: "55%" },
                { scenario: "If 3+ wickets in PP", win: "78%" },
              ].map(s => (
                <div key={s.scenario} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="text-xs">{s.scenario}</div>
                  <div className="text-xs font-bold font-mono">{s.win}</div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="cricket" className="w-full">Run New Simulation</Button>
        </div>
      )}
    </div>
  );
}
