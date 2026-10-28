"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  Plus,
  Send,
  Search,
  MapPin,
  ExternalLink,
  Code2,
  CheckCircle2,
  Eye,
  Heart,
  Layers,
  X,
  Zap,
  Users,
  Building2,
  Filter,
} from "lucide-react";
import Navbar from "@/component/Navbar/Navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ProjectSummary {
  _id: string;
  title: string;
  thumbnail: string;
  technologies: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
}

interface CandidateBuilder {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  headline: string;
  location: string;
  openToWork: boolean;
  verifiedSkills?: string[];
  matchedSkills?: string[];
  matchPercentage?: number;
  topProject?: ProjectSummary;
  projectsCount?: number;
  projects?: ProjectSummary[];
  totalLikes: number;
  totalViews: number;
}

interface JobPost {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryRange: string;
  description: string;
  requiredStack: string[];
  createdAt: string;
}

export default function RecruiterDashboardPage() {
  const [activeTab, setActiveTab] = useState<"radar" | "jobs">("radar");

  // Talent Radar State
  const [builders, setBuilders] = useState<CandidateBuilder[]>([]);
  const [techSearch, setTechSearch] = useState("");
  const [openToWorkOnly, setOpenToWorkOnly] = useState(false);
  const [loadingTalent, setLoadingTalent] = useState(true);

  // Jobs & Proof-of-Work Auto-Matcher State
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [matchedCandidates, setMatchedCandidates] = useState<CandidateBuilder[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Post Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "Kolkata / Remote",
    type: "Full-Time",
    salaryRange: "₹8L – ₹16L PA",
    requiredStack: "React, Next.js, TypeScript, Node.js, MongoDB",
    description: "",
  });

  // 1-Click Contextual Pitch Drawer State
  const [pitchTarget, setPitchTarget] = useState<CandidateBuilder | null>(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Talent Radar
  const fetchTalentRadar = useCallback(async () => {
    setLoadingTalent(true);
    try {
      const params = new URLSearchParams();
      if (techSearch.trim()) params.set("tech", techSearch.trim());
      if (openToWorkOnly) params.set("openToWork", "true");

      const res = await fetch(`${API_BASE}/api/recruiter/talent?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBuilders(data.builders || []);
      }
    } catch (err) {
      console.error("Failed to load talent radar:", err);
    } finally {
      setLoadingTalent(false);
    }
  }, [techSearch, openToWorkOnly]);

  // Fetch Jobs
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs?mine=true`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const jobList = data.jobs || [];
        setJobs(jobList);
        if (jobList.length > 0 && !selectedJob) {
          handleSelectJobForMatching(jobList[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchTalentRadar();
  }, [fetchTalentRadar]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Fetch Auto-Matched Candidates for a Job
  const handleSelectJobForMatching = async (job: JobPost) => {
    setSelectedJob(job);
    setLoadingMatches(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/jobs/${job._id}/matches`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to fetch job matches:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Publish New Job Post
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingJob(true);

    const stackArray = jobForm.requiredStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...jobForm,
          requiredStack: stackArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post job");
      }

      const createdJob = data.job;
      setJobs((prev) => [createdJob, ...prev]);
      setShowJobModal(false);
      setActiveTab("jobs");
      handleSelectJobForMatching(createdJob);
      setToastMessage("Job posted! Running Proof-of-Work Auto-Matcher...");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || "Error creating job post");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Open 1-Click Contextual Pitch Drawer
  const openPitchDrawer = (candidate: CandidateBuilder, jobContext?: JobPost | null) => {
    setPitchTarget(candidate);
    const firstName = candidate.name.split(" ")[0];
    const projectTitle = candidate.topProject?.title || "your recent build";
    const skillsList = (candidate.matchedSkills || candidate.verifiedSkills || [])
      .slice(0, 3)
      .join(", ");

    if (jobContext) {
      setPitchMessage(
        `Hi ${firstName}! Our Proof-of-Work engine matched your project "${projectTitle}" (${skillsList}) with our open ${jobContext.title} role at ${jobContext.company} (${jobContext.salaryRange}). Would love to chat about bringing you on board!`
      );
    } else {
      setPitchMessage(
        `Hi ${firstName}! I was reviewing your live build "${projectTitle}" on BuildSpace and was really impressed by your work with ${skillsList}. Are you currently open to discussing new engineering roles?`
      );
    }
  };

  // Send Contextual Message via /api/messages
  const handleSendPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchTarget || !pitchMessage.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId: pitchTarget.userId,
          projectId: pitchTarget.topProject?._id,
          message: pitchMessage.trim(),
        }),
      });

      if (res.ok) {
        setToastMessage(`Direct pitch sent to ${pitchTarget.name}! View replies in Messages.`);
        setPitchTarget(null);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* =====================================================================
            HEADER: PROOF-OF-WORK RECRUITER WORKSPACE
        ===================================================================== */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-[#0B101B] to-slate-900 p-6 sm:flex-row sm:items-center shadow-2xl">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Zap className="h-3.5 w-3.5" />
              <span>Proof-of-Work Hiring Engine (No Resumes Required)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Recruiter Talent Command Center
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Unlike traditional job boards, BuildSpace ranks candidates automatically based on the real-world code and video reels they have shipped on the platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/messages"
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <Send className="h-4 w-4 text-cyan-400" />
              <span>Candidate Inbox</span>
            </Link>
            <button
              onClick={() => setShowJobModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:opacity-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Post New Job Role</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            NAVIGATION TABS
        ===================================================================== */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "radar"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "border border-white/10 bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Verified Talent Radar ({builders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "jobs"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "border border-white/10 bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>My Job Posts & Auto-Matcher ({jobs.length})</span>
          </button>
        </div>

        {/* =====================================================================
            TAB 1: VERIFIED TALENT RADAR
        ===================================================================== */}
        {activeTab === "radar" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="Filter by verified shipped tech (e.g. React, Node.js, MongoDB)..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-10 pr-4 text-xs text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["React", "Next.js", "TypeScript", "Node.js", "MongoDB"].map((tech) => (
                  <button
                    key={tech}
                    onClick={() => setTechSearch((prev) => (prev === tech ? "" : tech))}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      techSearch.toLowerCase() === tech.toLowerCase()
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tech}
                  </button>
                ))}

                <label className="ml-2 flex items-center gap-2 cursor-pointer text-xs text-emerald-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={openToWorkOnly}
                    onChange={(e) => setOpenToWorkOnly(e.target.checked)}
                    className="rounded border-white/20 bg-slate-950 text-emerald-500"
                  />
                  <span>Open to Work Only</span>
                </label>
              </div>
            </div>

            {/* Builders Grid */}
            {loadingTalent ? (
              <div className="py-16 text-center text-sm text-slate-400">
                Scanning live project reels for verified builders...
              </div>
            ) : builders.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center space-y-3">
                <Layers className="mx-auto h-10 w-10 text-slate-600" />
                <p className="text-sm text-slate-300">No builders matched that filter yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {builders.map((builder) => (
                  <div
                    key={builder.userId}
                    className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl hover:border-violet-500/40 transition"
                  >
                    <div className="space-y-4">
                      {/* Creator Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={builder.avatar}
                            alt={builder.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-violet-500/50"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white">{builder.name}</h3>
                            <p className="text-xs text-slate-400">@{builder.username}</p>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="h-3 w-3 text-cyan-400" />
                              <span>{builder.location}</span>
                            </div>
                          </div>
                        </div>

                        {builder.openToWork && (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            Open to Work
                          </span>
                        )}
                      </div>

                      {/* Verified Shipped Skills */}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                          Verified via Shipped Builds ({builder.projects?.length || 1} reels)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(builder.verifiedSkills || []).slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Top Project Reel Preview Card */}
                      {builder.topProject && (
                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-3 space-y-2">
                          <div className="text-[10px] font-semibold uppercase text-violet-400">
                            Featured Proof-of-Work
                          </div>
                          <div className="text-xs font-bold text-white truncate">
                            {builder.topProject.title}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-cyan-400" />
                              {builder.totalViews} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-400" />
                              {builder.totalLikes} likes
                            </span>
                            {builder.topProject.githubUrl && (
                              <a
                                href={builder.topProject.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-violet-300 hover:underline flex items-center gap-1"
                              >
                                <Code2 className="h-3 w-3" /> Code
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => openPitchDrawer(builder, null)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:opacity-95 transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Message & Pitch Role</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: MY JOB POSTS & PROOF-OF-WORK AUTO-MATCHER
        ===================================================================== */}
        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Recruiter's Job Posts */}
            <div className="lg:col-span-4 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Your Active Job Roles
              </h2>

              {jobs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center space-y-3">
                  <Briefcase className="mx-auto h-8 w-8 text-slate-600" />
                  <p className="text-xs text-slate-400">
                    You haven't posted any job roles yet.
                  </p>
                  <button
                    onClick={() => setShowJobModal(true)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    Post First Job
                  </button>
                </div>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job._id}
                    onClick={() => handleSelectJobForMatching(job)}
                    className={`w-full text-left rounded-2xl border p-4 transition space-y-2 ${
                      selectedJob?._id === job._id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-white/10 bg-slate-900/60 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{job.title}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                        {job.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {job.company} • {job.location} • {job.salaryRange}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.requiredStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Right Column: Live Auto-Matched Candidates */}
            <div className="lg:col-span-8 space-y-4">
              {selectedJob ? (
                <>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-emerald-300">
                        ⚡ Auto-Matched by Shipped Project Stack
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Top Builders for {selectedJob.title}
                      </h3>
                    </div>
                    <span className="rounded-xl bg-black/40 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      {matchedCandidates.length} Verified Matches
                    </span>
                  </div>

                  {loadingMatches ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Calculating Proof-of-Work stack overlap...
                    </div>
                  ) : matchedCandidates.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                      No creators have published projects with {selectedJob.requiredStack.join(", ")} yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchedCandidates.map((cand) => (
                        <div
                          key={cand.userId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/50"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{cand.name}</span>
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                                  {cand.matchPercentage}% Stack Match
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">
                                Shipped Project:{" "}
                                <span className="text-white font-semibold">
                                  {cand.topProject?.title}
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(cand.matchedSkills || []).map((skill) => (
                                  <span
                                    key={skill}
                                    className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => openPitchDrawer(cand, selectedJob)}
                            className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>1-Click Pitch Role</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
                  Select or create a job post on the left to see automatic Proof-of-Work candidate matches.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL: CREATE JOB POST (RECRUITER ONLY)
      ===================================================================== */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Publish Job & Run Proof-of-Work Matcher
                </h3>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g. Full-Stack React Engineer"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="e.g. Acme Cloud"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role Type
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Salary / Stipend
                  </label>
                  <input
                    type="text"
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-300 mb-1">
                  Required Tech Stack (Used to Auto-Match Creator Projects)
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.requiredStack}
                  onChange={(e) => setJobForm({ ...jobForm, requiredStack: e.target.value })}
                  placeholder="React, Next.js, TypeScript, Node.js, MongoDB"
                  className="w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Role Description & What They Will Build
                </label>
                <textarea
                  rows={3}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the engineering team and responsibilities..."
                  className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingJob}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isSubmittingJob ? "Publishing & Matching..." : "Publish Job & Find Matching Builders"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER: 1-CLICK CONTEXTUAL PITCH MESSAGE
      ===================================================================== */}
      {pitchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-white/15 bg-slate-900 p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={pitchTarget.avatar}
                    alt={pitchTarget.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Pitch {pitchTarget.name}
                    </h3>
                    <p className="text-xs text-emerald-400">
                      ● Direct Proof-of-Work Outreach
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPitchTarget(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {pitchTarget.topProject && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    Verified Build Attached
                  </div>
                  <div className="text-sm font-bold text-white">
                    {pitchTarget.topProject.title}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendPitch} className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Recruiter Outreach Message
              </label>
              <textarea
                rows={6}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg"
              >
                <Send className="h-4 w-4" />
                <span>Send Instant Pitch to Creator Inbox</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}