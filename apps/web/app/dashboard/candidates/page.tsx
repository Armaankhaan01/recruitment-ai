"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, Mail, Award, MapPin, Trash2, ArrowRight, AlertTriangle } from "lucide-react";
import { listCandidates, deleteCandidate } from "@/lib/api/candidates";
import { toast } from "sonner";
import SkillBadgeList from "@/components/recruitment/SkillBadgeList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  extractedSkills: any;
  totalExperienceYears?: string | number;
  seniorityInferred?: string;
  createdAt: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeniority, setSelectedSeniority] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Delete Dialog state
  const [candidateToDelete, setCandidateToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchCandidatesData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 50,
      };
      
      if (selectedSeniority !== "all") {
        params.seniority = selectedSeniority;
      }
      
      if (skillFilter.trim()) {
        params.skill = skillFilter.trim();
      }

      const res = await listCandidates(params);
      setCandidates(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load candidates:", err);
      toast.error("Failed to retrieve candidate pool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesData();
  }, [selectedSeniority, skillFilter, page]);

  const confirmDelete = async () => {
    if (!candidateToDelete) return;
    const { id } = candidateToDelete;
    
    setIsDeleting(id);
    try {
      await deleteCandidate(id);
      toast.success("Candidate record successfully anonymized and deleted.");
      setCandidateToDelete(null);
      fetchCandidatesData();
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      toast.error("Failed to erase candidate. You must have Recruiter privileges.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Client-side fuzzy text filtering for name, email and skills
  const filteredCandidates = candidates.filter((candidate) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    
    const nameMatch = candidate.fullName.toLowerCase().includes(term);
    const emailMatch = candidate.email.toLowerCase().includes(term);
    const locationMatch = candidate.location?.toLowerCase().includes(term) ?? false;
    
    // Skills search
    let skillsMatch = false;
    if (Array.isArray(candidate.extractedSkills)) {
      skillsMatch = candidate.extractedSkills.some(
        (s: any) => s.name?.toLowerCase().includes(term)
      );
    }

    return nameMatch || emailMatch || locationMatch || skillsMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Talent Pool Database</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage and search all parsed candidate profiles and their historic applications.</p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Fuzzy Text search */}
            <div className="relative md:col-span-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <Input 
                placeholder="Fuzzy search by name, email, skills, location..." 
                className="pl-10 h-10 border-border/60 bg-background placeholder:text-muted-foreground/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Inferred Seniority Filter */}
            <div>
              <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
                <SelectTrigger className="h-10 border-border/60 bg-background">
                  <SelectValue placeholder="All Seniorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seniorities</SelectItem>
                  <SelectItem value="JUNIOR">Junior (&lt; 2 yrs)</SelectItem>
                  <SelectItem value="MID">Mid Level (2-5 yrs)</SelectItem>
                  <SelectItem value="SENIOR">Senior (5-8 yrs)</SelectItem>
                  <SelectItem value="LEAD">Lead (8-12 yrs)</SelectItem>
                  <SelectItem value="PRINCIPAL">Principal (&gt; 12 yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skills filter directly through database GIN Index query */}
            <div>
              <Input 
                placeholder="Database skill filter (GIN)..." 
                className="h-10 border-border/60 bg-background placeholder:text-muted-foreground/50"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Data Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse font-medium">Syncing candidate profiles...</p>
            </div>
          ) : filteredCandidates.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/20 border-b border-border/40">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Candidate</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Seniority</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Experience</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-xs uppercase tracking-wider">Skills Profile</TableHead>
                    <TableHead className="py-4 px-6 text-center font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/20">
                  {filteredCandidates.map((candidate) => {
                    // Seniority inferred color schema
                    let seniorityBadgeColor = "bg-muted text-muted-foreground border-border/30";
                    if (candidate.seniorityInferred === "SENIOR") {
                      seniorityBadgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/20";
                    } else if (candidate.seniorityInferred === "LEAD" || candidate.seniorityInferred === "PRINCIPAL") {
                      seniorityBadgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                    } else if (candidate.seniorityInferred === "MID") {
                      seniorityBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    } else if (candidate.seniorityInferred === "JUNIOR") {
                      seniorityBadgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    }

                    return (
                      <TableRow 
                        key={candidate.id} 
                        className="hover:bg-muted/20 transition-colors group cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/candidates/${candidate.id}`}
                      >
                        {/* Name and Contact details */}
                        <TableCell className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-foreground group-hover:text-[#adc6ff] transition-colors">
                              {candidate.fullName}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 opacity-60" />
                                {candidate.email}
                              </span>
                              {candidate.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 opacity-60" />
                                  {candidate.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Seniority badge */}
                        <TableCell className="py-4 px-6">
                          {candidate.seniorityInferred ? (
                            <Badge className={`px-2 py-0.5 border font-bold text-[10px] ${seniorityBadgeColor}`}>
                              {candidate.seniorityInferred}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">Inferred None</span>
                          )}
                        </TableCell>
                        
                        {/* Experience years */}
                        <TableCell className="py-4 px-6 font-semibold text-sm text-muted-foreground">
                          {candidate.totalExperienceYears !== null ? (
                            `${parseFloat(String(candidate.totalExperienceYears)).toFixed(1)} yrs`
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">Not set</span>
                          )}
                        </TableCell>

                        {/* Top parsed skills */}
                        <TableCell className="py-4 px-6 max-w-[320px]">
                          <SkillBadgeList skills={candidate.extractedSkills || []} />
                        </TableCell>

                        {/* Action buttons */}
                        <TableCell className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/dashboard/candidates/${candidate.id}`}>
                              <button className="h-8 w-8 rounded-lg border border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer" title="View details">
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </Link>
                            <button 
                              disabled={isDeleting === candidate.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setCandidateToDelete({ id: candidate.id, name: candidate.fullName });
                              }}
                              className="h-8 w-8 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive/80 hover:text-destructive flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50" 
                              title="Erase candidate (GDPR)"
                            >
                              {isDeleting === candidate.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-6 space-y-3">
              <User className="h-10 w-10 opacity-30 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No candidate records found</h4>
                <p className="text-xs max-w-xs leading-relaxed">No profiles matched your filtering requirements. Try adjusting search queries or skills criteria.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Deletion Confirmation Dialog Modal */}
      <Dialog open={candidateToDelete !== null} onOpenChange={(open) => !open && setCandidateToDelete(null)}>
        <DialogContent className="max-w-md border-border/40 bg-card/95 backdrop-blur-md shadow-2xl p-6">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-1">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Confirm Permanent Erasure
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete and anonymize the candidate dossier for <span className="font-bold text-foreground text-destructive">{candidateToDelete?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/40 border border-border/20 p-3 rounded-lg text-[11px] text-muted-foreground font-semibold leading-relaxed">
            CRITICAL WARNING: This action triggers GDPR Right to Erasure protocols, anonymizing all related personal metadata and identifiers. This procedure is absolute and cannot be undone.
          </div>

          <DialogFooter className="flex sm:justify-end gap-2.5 pt-4">
            <Button
              variant="outline"
              onClick={() => setCandidateToDelete(null)}
              disabled={isDeleting !== null}
              className="px-4 py-2 border-border/60 hover:bg-muted font-bold text-xs uppercase tracking-wider h-10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting !== null}
              className="px-5 py-2 font-bold text-xs uppercase tracking-wider h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting !== null ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Erasing Dossier...
                </>
              ) : (
                "Confirm Erasure"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
