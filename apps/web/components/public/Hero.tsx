"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

export default function Hero() {
  const handleScrollToJobs = () => {
    const el = document.getElementById("featured-opportunities");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full px-gutter py-20 flex flex-col items-center justify-center text-center max-w-container-max mx-auto bg-gradient-to-b from-card to-background border-b border-border/40 px-gutter">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary mb-6 shadow-sm animate-pulse">
        <Sparkles className="h-3.5 w-3.5 fill-current" />
        <span className="font-medium tracking-wider uppercase">Supercharged by OpenAI GPT-4o</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight max-w-4xl tracking-tight">
        Find Your Future with{" "}
        <span className="bg-clip-text text-transparent bg-[linear-gradient(to_right,#6366f1,#a855f7)]">
          AI
        </span>
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-light">
        Precision-engineered talent acquisition. Let our three-stage semantic AI pipeline match your unique skills to the perfect role instantly.
      </p>

      <Button
        onClick={handleScrollToJobs}
        className="bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] text-sm md:text-base font-black tracking-wider uppercase px-8 py-6 rounded-full flex items-center gap-2 shadow-lg shadow-[#adc6ff]/20 hover:shadow-xl transition-all duration-200 cursor-pointer group"
      >
        Browse Jobs
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </section>
  );
}
