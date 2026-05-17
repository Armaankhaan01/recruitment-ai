"use client";

import Link from "next/link";
import { Button } from "../ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full px-gutter py-4 max-w-container-max mx-auto bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm flex justify-between items-center px-4">
      <div className="flex items-center gap-3">
        <img
          alt="RecruitAI Logo"
          className="h-8 w-8 object-contain"
          src="/logo.png"
        />
        <span className="text-xl md:text-2xl font-black tracking-tighter text-primary dark:text-primary-fixed uppercase">
          RECRUITAI
        </span>
      </div>
      <Link href="/auth/login">
        <Button className="bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e6a] font-bold text-xs tracking-wider uppercase px-6 py-2.5 rounded-full shadow-md transition-all duration-200 cursor-pointer">
          Sign In
        </Button>
      </Link>
    </header>
  );
}
