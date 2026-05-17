"use client";

import Header from "@/components/public/Header";
import Hero from "@/components/public/Hero";
import FeaturedJobs from "@/components/public/FeaturedJobs";
import BentoGrid from "@/components/public/BentoGrid";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center w-full">
        <Hero />
        <FeaturedJobs />
        <BentoGrid />
      </main>
      <Footer />
    </div>
  );
}
