"use client";

import { ReactNode, useState } from "react";
import Sidebar from "@/components/recruitment/Sidebar";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background text-foreground relative">
      {/* Mobile Top Navigation Sticky Bar */}
      <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-card/90 backdrop-blur-md border-b border-border/40 px-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
          aria-label="Toggle Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-black tracking-tighter text-primary uppercase select-none">
          RecruitAI
        </span>
        {/* Simple initials circle */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 select-none">
          RA
        </div>
      </header>

      {/* Static Sidebar - Desktop Only */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Slide-out Sidebar Menu Overlay - Mobile Only */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Frosted Backdrop Overlay */}
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          {/* Animated Slide-out Sidebar Card Panel */}
          <div className="relative flex w-full max-w-xs flex-col bg-card p-6 shadow-2xl animate-in slide-in-from-left duration-300 border-r border-border/40">
            {/* Close Circle Button */}
            <div className="absolute right-4 top-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
                aria-label="Close Mobile Menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Render Sidebar within panel, and bind onClose hooks to close drawer on navigation */}
            <div className="mt-8 flex-1">
              <Sidebar mobile onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Page scroll content container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-full h-full">
        {children}
      </main>
    </div>
  );
}
