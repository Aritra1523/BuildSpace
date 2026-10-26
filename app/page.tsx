"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Code2,
  Rocket,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ExternalLink,
  Github,
  Eye,
  Send,
  CheckCircle2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Briefcase,
  Search,
  Globe,
  ShieldCheck,
  Terminal,
  Users,
  Zap,
  Filter,
  UserCheck,
} from "lucide-react";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================
interface ReelCreator {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  headline: string;
  location: string;
  openToWork: boolean;
}

interface ReelProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  thumbnail: string;
  githubUrl: string;
  liveDemoUrl: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  views: {
    total: number;
    unique: number;
    creatorViews: number;
    recruiterViews: number;
  };
  creator: ReelCreator;
}

// ============================================================================
// FALLBACK DEMO PROJECTS (Matches Backend Seed Data)
// ============================================================================
const DEMO_REELS: ReelProject[] = [
  {
    _id: "6717b2a9f1d2c34e56789021",
    title: "Veloce — Distributed Flash-Sale E-Commerce Engine",
    description:
      "High-concurrency e-commerce platform built with React, Node.js, Redis Lua atomic stock locks, and MongoDB. Handles 25,000+ checkout req/sec with zero overselling.",
    category: "Full-Stack",
    technologies: ["React", "Next.js", "Node.js", "TypeScript", "MongoDB", "Redis"],
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    githubUrl: "https://github.com/Aritra1523/veloce-commerce",
    liveDemoUrl: "https://veloce-demo.buildspace.dev",
    likesCount: 342,
    commentsCount: 29,
    savesCount: 94,
    views: { total: 4210, unique: 3180, creatorViews: 2600, recruiterViews: 580 },
    creator: {
      userId: "6717b2a9f1d2c34e56789010",
      name: "Aritra Das",
      username: "aritra1523",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250",
      headline: "Full-Stack Engineer • React, Next.js, Node.js & MongoDB",
      location: "Kolkata, India",
      openToWork: true,
    },
  },
  {
    _id: "6717b2a9f1d2c34e56789022",
    title: "QuickBite — Real-Time Multi-Role Food Delivery Platform",
    description:
      "Full-stack ordering platform featuring customer live cart, restaurant kitchen dashboard, admin analytics, and instant Socket.IO order status notifications.",
    category: "Full-Stack",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Socket.IO",
    ],
    thumbnail:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    githubUrl: "https://github.com/Aritra1523/quickbite-platform",
    liveDemoUrl: "https://quickbite.buildspace.dev",
    likesCount: 419,
    commentsCount: 47,
    savesCount: 138,
    views: { total: 5390, unique: 4100, creatorViews: 3290, recruiterViews: 810 },
    creator: {
      userId: "6717b2a9f1d2c34e56789010",
      name: "Aritra Das",
      username: "aritra1523",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250",
      headline: "Full-Stack Engineer • React, Next.js, Node.js & MongoDB",
      location: "Kolkata, India",
      openToWork: true,
    },
  },
  {
    _id: "6717b2a9f1d2c34e56789023",
    title: "HyperCanvas — Multiplayer WebGPU Shader & Vector Studio",
    description:
      "60FPS browser-based vector & WGSL shader editor compiled from Rust to WebAssembly with CRDT multiplayer cursor synchronization.",
    category: "Graphics & WebGPU",
    technologies: ["Rust", "WebAssembly", "WebGPU", "React", "TypeScript"],
    thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    githubUrl: "https://github.com/mayalin-gpu/hypercanvas",
    liveDemoUrl: "https://hypercanvas.buildspace.dev",
    likesCount: 518,
    commentsCount: 63,
    savesCount: 204,
    views: { total: 6820, unique: 5120, creatorViews: 4210, recruiterViews: 910 },
    creator: {
      userId: "6717b2a9f1d2c34e56789011",
      name: "Maya Lin",
      username: "mayalin_gpu",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250",
      headline: "Creative Technologist • WebGPU, Rust & Shaders",
      location: "San Francisco, USA",
      openToWork: true,
    },
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BuildSpaceLandingPage() {
  const [reels, setReels] = useState<ReelProject[]>(DEMO_REELS);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [showMessageDrawer, setShowMessageDrawer] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>("");
  const [messageSent, setMessageSent] = useState<boolean>(false);
  const [activeAudienceTab, setActiveAudienceTab] = useState<
    "creators" | "recruiters" | "everyone"
  >("creators");

  const activeProject = reels[activeIndex] || DEMO_REELS[0];

  // Try loading live projects from the Express backend if running
  useEffect(() => {
    fetch(`${API_BASE}/api/feed/for-you?limit=5`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.projects && data.projects.length > 0) {
          setReels(data.projects);
        }
      })
      .catch(() => {
        // Fallback to DEMO_REELS silently if backend is offline
      });
  }, []);

  // Pre-fill contextual recruiter message whenever active project changes
  useEffect(() => {
    const firstName = activeProject.creator?.name?.split(" ")[0] || "there";
    const topTech = activeProject.technologies.slice(0, 2).join(" and ");
    setMessageText(
      `Hi ${firstName}, I discovered your ${
        activeProject.title.split("—")[0].trim()
      } project on BuildSpace. I liked your ${topTech} implementation. We have a Full-Stack Developer opportunity. Would you be interested?`
    );
    setMessageSent(false);
  }, [activeIndex, activeProject]);

  const handleNextReel = () => {
    setActiveIndex((prev) => (prev + 1) % reels.length);
  };

  const handlePrevReel = () => {
    setActiveIndex((prev) => (prev - 1 + reels.length) % reels.length);
  };

  const toggleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendContextualMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>

      {/* =====================================================================
          1. STICKY GLASSMORPHIC NAVBAR
      ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-lg shadow-violet-600/25 group-hover:scale-105 transition">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Build<span className="text-violet-400">Space</span>
              </span>
              <span className="ml-2 hidden rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300 sm:inline-block">
                Project-First Network
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <Link
              href="/explore"
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 text-violet-400" />
              Project Feed
            </Link>
            <a href="#how-it-works" className="hover:text-white transition">
              How It Works
            </a>
            <a href="#for-whom" className="hover:text-white transition">
              For Creators & Recruiters
            </a>
            <a href="#pipeline" className="hover:text-white transition">
              Hiring Pipeline
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 transition"
            >
              <span>Start Building</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. HERO SECTION (Headline + Subtitle + CTAs + Interactive Reels Feed)
      ===================================================================== */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Product Vision & Core Flow */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Reels-Style Project Discovery & Proof-of-Work Hiring</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-[64px] leading-[1.08]">
                Build. Share.{" "}
                <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  Discover. Collaborate.
                </span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-300 sm:text-xl leading-relaxed">
                Discover what people build and let your projects open the door to
                new opportunities. Skip static resumes—scroll through live software,
                inspect real code, and message builders directly from their work.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-violet-600/30 hover:scale-[1.02] transition"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Explore Projects</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur-md hover:bg-white/10 transition"
              >
                <Rocket className="h-5 w-5 text-cyan-400" />
                <span>Start Building</span>
              </Link>
            </div>

            {/* Core Idea Flow Pill Strip */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                The BuildSpace Core Loop
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                {[
                  "Build",
                  "Upload",
                  "Discover",
                  "Explore",
                  "Connect",
                  "Message",
                  "Collaborate / Hire",
                ].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <span className="rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-1.5 text-slate-200">
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-violet-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Live Platform Proof Metrics */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 sm:max-w-lg">
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-slate-400">
                  Project-First Discovery
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">1-Click</div>
                <div className="text-xs text-slate-400">
                  Contextual Recruiter Chat
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">6-Stage</div>
                <div className="text-xs text-slate-400">
                  Built-In Hiring Pipeline
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Vertical Project Feed Simulator */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[410px]">
              {/* Top Floating Badge */}
              <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-xs backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold text-slate-200">
                    Live Vertical Feed Preview
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevReel}
                    className="rounded-lg border border-white/10 bg-white/5 p-1 hover:bg-white/10 transition"
                    title="Previous Project Reel"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeIndex + 1}/{reels.length}
                  </span>
                  <button
                    onClick={handleNextReel}
                    className="rounded-lg border border-white/10 bg-white/5 p-1 hover:bg-white/10 transition"
                    title="Swipe Up to Next Project Reel"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Reels Phone / Card Frame */}
              <div className="relative h-[600px] w-full overflow-hidden rounded-[28px] border border-white/15 bg-slate-950 shadow-2xl shadow-violet-950/50">
                {/* Project Media Background */}
                <img
                  src={activeProject.thumbnail}
                  alt={activeProject.title}
                  className="h-full w-full object-cover object-center transition-all duration-500 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/70 to-black/30" />

                {/* Top Bar Inside Reel */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-[11px] font-semibold text-violet-200 backdrop-blur-md">
                    {activeProject.category}
                  </span>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] text-slate-300 backdrop-blur-md">
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    {/* <span>{activeProject.views.total.toLocaleString()} views</span> */}
                    <span className="text-emerald-400 font-semibold">
                      ({activeProject.views.recruiterViews} recruiters)
                    </span>
                  </div>
                </div>

                {/* Right Vertical Action Rail (Reels Style) */}
                <div className="absolute right-3.5 bottom-36 flex flex-col items-center gap-4 z-20">
                  <button
                    onClick={() => toggleLike(activeProject._id)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition ${
                        likedIds[activeProject._id]
                          ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                          : "border-white/15 bg-black/50 text-white hover:bg-white/15"
                      }`}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          likedIds[activeProject._id] ? "fill-rose-400" : ""
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-200">
                      {activeProject.likesCount +
                        (likedIds[activeProject._id] ? 1 : 0)}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowMessageDrawer(true)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md hover:bg-white/15 transition">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-200">
                      {activeProject.commentsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleSave(activeProject._id)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition ${
                        savedIds[activeProject._id]
                          ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                          : "border-white/15 bg-black/50 text-white hover:bg-white/15"
                      }`}
                    >
                      <Bookmark
                        className={`h-5 w-5 ${
                          savedIds[activeProject._id] ? "fill-amber-300" : ""
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-200">
                      {activeProject.savesCount +
                        (savedIds[activeProject._id] ? 1 : 0)}
                    </span>
                  </button>

                  <button
                    onClick={handleNextReel}
                    className="flex flex-col items-center gap-1 pt-2"
                    title="Swipe up to next project"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/40 bg-violet-600/30 text-violet-200 backdrop-blur-md hover:bg-violet-600/50 transition animate-bounce">
                      <ChevronDown className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      Next Reel
                    </span>
                  </button>
                </div>

                {/* Bottom Project & Creator Details Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pr-16 space-y-3.5">
                  {/* Creator Row */}
                  <div className="flex items-center gap-3">
                    <img
                      src={activeProject.creator?.avatar}
                      alt={activeProject.creator?.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">
                          {activeProject.creator?.name}
                        </span>
                        {activeProject.creator.openToWork && (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Open to Work
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        @{activeProject.creator.username} •{" "}
                        {activeProject.creator.location}
                      </p>
                    </div>
                  </div>

                  {/* Project Title & Short Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {activeProject.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-300 leading-relaxed">
                      {activeProject.description}
                    </p>
                  </div>

                  {/* Technology Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200 backdrop-blur-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons: View Project | View Profile | Message Creator */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <a
                      href={activeProject.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                      <span>View Project</span>
                    </a>
                    <Link
                      href={`/creators/${activeProject.creator.userId}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      <Users className="h-3.5 w-3.5 text-violet-300" />
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={() => setShowMessageDrawer(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-2.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>

                {/* Contextual Recruiter Messaging Overlay Drawer (Inside Reel!) */}
                {showMessageDrawer && (
                  <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="rounded-2xl border border-white/15 bg-slate-900 p-4 shadow-2xl space-y-3.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeProject.creator.avatar}
                            alt={activeProject.creator.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">
                              Message {activeProject.creator.name}
                            </div>
                            <div className="text-[10px] text-emerald-400">
                              ● Real-Time Socket.IO Channel
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowMessageDrawer(false)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Pinned Project Attribution Badge */}
                      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 text-xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                          Context Attached (projectId: {activeProject._id.slice(-6)})
                        </div>
                        <div className="font-semibold text-white truncate mt-0.5">
                          {activeProject.title}
                        </div>
                      </div>

                      {messageSent ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                          <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
                          <div className="text-sm font-bold text-white">
                            Contextual Message Sent!
                          </div>
                          <p className="text-xs text-slate-300">
                            {activeProject.creator.name} received a real-time
                            notification linked directly to{" "}
                            <span className="text-white font-medium">
                              {activeProject.title.split("—")[0]}
                            </span>
                            .
                          </p>
                          <button
                            onClick={() => setShowMessageDrawer(false)}
                            className="mt-2 inline-block rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                          >
                            Back to Project Feed
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleSendContextualMessage}
                          className="space-y-3"
                        >
                          <textarea
                            rows={4}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-slate-100 focus:border-violet-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:opacity-95"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Send Without Leaving Feed</span>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. IMPORTANT PRODUCT PRINCIPLE: PROJECT FIRST vs PROFILE FIRST
      ===================================================================== */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/10 bg-slate-950/60 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Product Principle
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Project First.{" "}
              <span className="text-slate-400 line-through decoration-rose-500/80">
                Not Profile First.
              </span>
            </h2>
            <p className="text-slate-300 text-base">
              BuildSpace is not another resume database. Every connection,
              collaboration, and job offer starts from something real you built.
            </p>
          </div>

          {/* 7-Step Vertical/Horizontal Discovery-to-Hiring Pipeline */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              {
                step: "01",
                title: "Discovery",
                desc: "Recruiter scrolls vertical project feed",
                icon: Play,
              },
              {
                step: "02",
                title: "Profile",
                desc: "Inspects creator's full portfolio & stack",
                icon: Code2,
              },
              {
                step: "03",
                title: "Connection",
                desc: "Follows creator or saves candidate",
                icon: UserCheck,
              },
              {
                step: "04",
                title: "Message",
                desc: "Chats with projectId context attached",
                icon: MessageSquare,
              },
              {
                step: "05",
                title: "Collaboration",
                desc: "Co-build or invite to team repo",
                icon: Users,
              },
              {
                step: "06",
                title: "Job Opportunity",
                desc: "Shares role matched to proven skills",
                icon: Briefcase,
              },
              {
                step: "07",
                title: "Hiring",
                desc: "Moves through 6-stage pipeline to offer",
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-violet-500/40 hover:bg-slate-900 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-violet-400">
                      STEP {item.step}
                    </span>
                    <Icon className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
                  </div>
                  <div className="font-bold text-white text-sm">{item.title}</div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. FOR CREATORS / FOR RECRUITERS / FOR EVERYONE (Section 22)
      ===================================================================== */}
      <section
        id="for-whom"
        className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 md:flex-row">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Built for the Whole Ecosystem
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              One Feed. Three Superpowers.
            </h2>
          </div>

          {/* Interactive Audience Switcher */}
          <div className="inline-flex rounded-2xl border border-white/10 bg-slate-900 p-1.5">
            {(
              [
                { id: "creators", label: "For Creators" },
                { id: "recruiters", label: "For Recruiters" },
                { id: "everyone", label: "For Everyone" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAudienceTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeAudienceTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Three Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pillar 1: For Creators */}
          <div
            className={`rounded-3xl border p-8 transition ${
              activeAudienceTab === "creators"
                ? "border-violet-500/50 bg-gradient-to-b from-violet-950/30 to-slate-900/90 shadow-xl shadow-violet-950/30"
                : "border-white/10 bg-slate-900/50"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-white">For Creators</h3>
            <p className="mt-1 text-sm font-medium text-violet-300">
              Showcase your real work.
            </p>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Students, developers, freelancers, and startup builders upload
              screenshots, demo videos, GitHub repos, and live URLs that speak
              louder than bullet points on a CV.
            </p>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              {[
                "Publish projects with images, demo videos & tech tags",
                "Attach GitHub repositories and live interactive URLs",
                "Track total views, unique viewers & recruiter profile views",
                "Receive direct recruiter messages & collaboration requests",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register?role=creator"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              <span>Create Creator Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pillar 2: For Recruiters */}
          <div
            className={`rounded-3xl border p-8 transition ${
              activeAudienceTab === "recruiters"
                ? "border-cyan-500/50 bg-gradient-to-b from-cyan-950/30 to-slate-900/90 shadow-xl shadow-cyan-950/30"
                : "border-white/10 bg-slate-900/50"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-white">
              For Recruiters
            </h3>
            <p className="mt-1 text-sm font-medium text-cyan-300">
              Discover talent through real projects.
            </p>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Evaluate engineers by what they have actually shipped. Scroll the
              project feed, filter by exact stack and availability, and message
              candidates without leaving the feed.
            </p>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              {[
                "Filter by React, Node.js, MongoDB, experience & Open to Work",
                "Message creators directly from a project with context saved",
                "Post job opportunities & receive proof-of-work applications",
                "Move candidates across a 6-stage Kanban hiring pipeline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register?role=recruiter"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              <span>Start Hiring via Proof-of-Work</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pillar 3: For Everyone */}
          <div
            className={`rounded-3xl border p-8 transition ${
              activeAudienceTab === "everyone"
                ? "border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-slate-900/90 shadow-xl shadow-emerald-950/30"
                : "border-white/10 bg-slate-900/50"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-white">For Everyone</h3>
            <p className="mt-1 text-sm font-medium text-emerald-300">
              Explore ideas, technologies and innovations.
            </p>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Browse what builders around the world are shipping right now. Save
              inspiring architectures, follow rising creators, and join
              collaborative side projects.
            </p>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              {[
                "Global search across projects, creators, technologies & jobs",
                "Like, comment, bookmark & share full-screen project reels",
                "Send collaboration requests to join open-source or indie teams",
                "Real-time Socket.IO notifications on every interaction",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/explore"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              <span>Browse Live Project Feed</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. RECRUITER DISCOVERY & 6-STAGE HIRING PIPELINE PREVIEW
      ===================================================================== */}
      <section
        id="pipeline"
        className="relative z-10 border-t border-white/10 bg-slate-950/70 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Filter className="h-3.5 w-3.5" />
                <span>Proof-of-Work Candidate Discovery</span>
              </span>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                From Reel Discovery to Signed Offer in 6 Stages.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Recruiters filter candidates by exact skills (`React`, `Node.js`,
                `MongoDB`), experience (`0–2 years`), location (`India`), and{" "}
                <span className="text-emerald-400 font-semibold">
                  Open to Work
                </span>{" "}
                status—with every candidate card anchored by their actual shipped
                projects.
              </p>

              {/* Sample Search Filter Chips */}
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Recruiter Filter Query
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React",
                    "Node.js",
                    "MongoDB",
                    "0–2 years",
                    "Open to Work",
                    "India",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 6-Stage Pipeline Visualization */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-sm font-bold text-white">
                      Recruiter Hiring Pipeline
                    </div>
                    <div className="text-xs text-slate-400">
                      Instant candidate notifications on every stage transition
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono text-emerald-300">
                    PATCH /api/applications/:id/status
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    {
                      stage: "New",
                      count: "14 Candidates",
                      badge: "bg-slate-800 text-slate-300 border-white/10",
                    },
                    {
                      stage: "Under Review",
                      count: "8 Candidates",
                      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                    },
                    {
                      stage: "Shortlisted",
                      count: "5 Candidates",
                      badge:
                        "bg-violet-500/15 text-violet-300 border-violet-500/30",
                    },
                    {
                      stage: "Interview",
                      count: "3 Candidates",
                      badge:
                        "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    },
                    {
                      stage: "Selected",
                      count: "2 Hired",
                      badge:
                        "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                    },
                    {
                      stage: "Rejected",
                      count: "Archived",
                      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
                    },
                  ].map((item, idx) => (
                    <div
                      key={item.stage}
                      className={`rounded-2xl border p-4 ${item.badge}`}
                    >
                      <div className="text-[10px] font-mono uppercase opacity-75">
                        Stage 0{idx + 1}
                      </div>
                      <div className="mt-1 text-base font-bold">
                        {item.stage}
                      </div>
                      <div className="mt-1 text-xs opacity-80">
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. FINAL CTA BANNER & FOOTER
      ===================================================================== */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-900/50 via-indigo-900/40 to-cyan-900/40 p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to let your projects speak for themselves?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-200">
            Join creators shipping real software and recruiters hiring through
            proof of work.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100 transition"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Explore Projects</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/40 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-black/60 transition"
            >
              <Rocket className="h-4 w-4 text-cyan-400" />
              <span>Start Building</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#05070B] py-10 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <span className="font-bold text-white">BuildSpace</span>
            <span>— Build. Share. Discover. Collaborate.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/explore" className="hover:text-white">
              Explore Feed
            </Link>
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
            <Link href="/register" className="hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}