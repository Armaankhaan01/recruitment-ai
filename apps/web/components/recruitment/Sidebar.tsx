"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  BarChart3,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/applications", label: "Applications", icon: ClipboardList },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/metrics", label: "Metrics", icon: BarChart3 },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth/login";
  };

  return (
    <aside className={cn(
      "w-full flex flex-col h-full",
      mobile ? "" : "w-64 border-r bg-card h-screen p-4 sticky top-0"
    )}>
      {!mobile && (
        <div className="px-3 py-4 mb-6">
          <h1 className="text-xl font-black tracking-tighter text-primary uppercase">RecruitAI</h1>
        </div>
      )}

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 pt-4 mt-4">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
