import type { ReactNode } from "react";
import { Brain, Shield, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  form: ReactNode;
  footer: ReactNode;
  panelLabel: string;
  panelTitle: string;
  panelDescription: string;
};

const highlights = [
  {
    icon: Brain,
    title: "AI-backed coaching",
    text: "Convert match data and player reviews into sharper coaching decisions.",
  },
  {
    icon: Users,
    title: "Academy-wide visibility",
    text: "Keep coaches, players, analysts, and owners aligned in one workspace.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  form,
  footer,
  panelLabel,
  panelTitle,
  panelDescription,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(149,197,74,0.18),_transparent_26%),linear-gradient(180deg,_#f6f8f4_0%,_#ffffff_42%,_#eef2f5_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden border border-border/70 bg-white shadow-2xl shadow-cricket-dark/10 lg:h-[calc(100vh-2rem)]">
        <section className="flex w-full items-center bg-white lg:w-[58%]">
          <div className="w-full px-6 py-8 sm:px-10 lg:px-12 xl:px-14">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.32em] text-cricket-green">
              CricketIQ
            </Link>
            <div className="mt-6 max-w-lg">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground xl:text-[2.8rem]">{title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
            </div>

            <div className="mt-6 max-w-lg border border-border bg-[#fbfbf9] p-5 shadow-sm sm:p-6">
              {form}
              <div className="mt-5 text-sm text-muted-foreground">{footer}</div>
            </div>
          </div>
        </section>

        <aside className="relative hidden overflow-hidden bg-cricket-dark text-white lg:flex lg:w-[42%]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(149,197,74,0.22),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(196,55,57,0.18),_transparent_28%)]" />
          <div className="relative flex w-full flex-col justify-between p-8 xl:p-10">
            <div>
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-cricket-green-light">
                <Shield className="h-3.5 w-3.5" />
                {panelLabel}
              </div>
              <h2 className="mt-5 max-w-lg font-display text-4xl leading-none text-white xl:text-[3.1rem]">
                {panelTitle}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/72 xl:text-base">
                {panelDescription}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white/8 text-cricket-green-light">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-white/68">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
