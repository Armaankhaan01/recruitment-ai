"use client";

export default function Footer() {
  return (
    <footer className="w-full px-gutter py-8 flex flex-col md:flex-row justify-between items-center border-t border-border/40 mt-auto max-w-container-max mx-auto bg-card shadow-sm">
      <div className="mb-6 md:mb-0 flex flex-col items-center md:items-start space-y-2">
        <div className="flex items-center gap-2">
          <img
            alt="RecruitAI Logo"
            className="h-6 w-6 object-contain opacity-80 grayscale"
            src="/logo.png"
          />
          <span className="text-base font-black tracking-tighter text-primary uppercase">
            RECRUITAI
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} RecruitAI. Precision Engineered Talent Acquisition.
        </p>
      </div>
      <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-wider">
        <a href="#featured-opportunities" className="text-muted-foreground hover:text-primary transition-colors">
          Browse Jobs
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          AI Features
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Enterprise
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Privacy Policy
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Terms of Service
        </a>
      </nav>
    </footer>
  );
}
