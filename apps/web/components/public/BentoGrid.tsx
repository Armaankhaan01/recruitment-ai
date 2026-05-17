"use client";

import { BrainCircuit, CalendarRange } from "lucide-react";

export default function BentoGrid() {
  return (
    <section className="w-full px-gutter py-20 bg-background max-w-container-max mx-auto border-t border-border/40">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          The RecruitAI Advantage
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base">
          Experience a frictionless hiring process powered by next-generation artificial intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Feature 1 */}
        <div className="bg-card p-8 rounded-2xl border border-border/40 relative overflow-hidden flex flex-col justify-end min-h-[300px] hover:border-primary/30 transition-all duration-300 group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none group-hover:from-primary/10 transition-all duration-300"></div>
          <div className="relative z-10">
            <div className="bg-muted w-14 h-14 rounded-full flex items-center justify-center mb-6 border border-border/50 shadow-inner group-hover:scale-105 transition-transform">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              AI Candidate Ranking
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our models analyze thousands of data points to surface the absolute best fit for your unique requirements, moving beyond simple keyword matching.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="bg-card p-8 rounded-2xl border border-border/40 relative overflow-hidden flex flex-col justify-end min-h-[300px] hover:border-secondary/30 transition-all duration-300 group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-bl from-secondary/5 to-transparent pointer-events-none group-hover:from-secondary/10 transition-all duration-300"></div>
          <div className="relative z-10">
            <div className="bg-muted w-14 h-14 rounded-full flex items-center justify-center mb-6 border border-border/50 shadow-inner group-hover:scale-105 transition-transform">
              <CalendarRange className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
              Automated Scheduling
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Eliminate back-and-forth emails. Our smart assistant negotiates interview times directly with candidates, syncing seamlessly with your team's calendar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
