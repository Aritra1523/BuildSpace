"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Layers,
  MapPin,
  Briefcase,
  Code2,
  Globe,
  MessageSquare,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Heart,
  Eye,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Code,
} from "lucide-react";
import { useAuth } from "@/customHooks/profile/useProfile"; 

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CreatorProfileContent() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  const { user: currentUser } = useAuth();

  const [creatorUser, setCreatorUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Creator Profile & Projects
  useEffect(() => {
    if (!creatorId) return;

    const fetchCreatorData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${creatorId}`, {
          credentials: "include", // Sends cookie to check 'isFollowing' status
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Creator not found");

        setCreatorUser(data.user);
        setProfile(data.profile);
        setProjects(data.projects || []);
        setIsFollowing(data.isFollowing || false);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorId]);

  // Toggle Follow / Unfollow
  const handleToggleFollow = async () => {
    if (!currentUser) {
      router.push(`/login?callbackUrl=/creators/${creatorId}`);
      return;
    }

    setFollowLoading(true);
    const willFollow = !isFollowing;

    // Optimistic UI Update
    setIsFollowing(willFollow);
    setProfile((prev: any) => ({
      ...prev,
      followersCount: Math.max(0, prev.followersCount + (willFollow ? 1 : -1)),
    }));

    try {
      await fetch(`${API_BASE}/api/users/${creatorId}/follow`, {
        method: willFollow ? "POST" : "DELETE",
        credentials: "include",
      });
    } catch {
      // Revert on failure
      setIsFollowing(!willFollow);
      setProfile((prev: any) => ({
        ...prev,
        followersCount: Math.max(0, prev.followersCount + (!willFollow ? 1 : -1)),
      }));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090E]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07090E] text-slate-100 px-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">{error}</p>
        <Link href="/explore" className="mt-6 text-violet-400 hover:text-violet-300">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === creatorId;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <button
            onClick={() => router.back()}
            className="rounded-xl p-2 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="font-bold text-white truncate">
            {profile.name}&apos;s Portfolio
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {/* Profile Hero Section */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]" />

          <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
            <img
              src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250"}
              alt={profile.name}
              className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-4 ring-slate-950 shadow-xl"
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white truncate">
                  {profile.name}
                </h1>
                {profile.openToWork && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Open to Work
                  </span>
                )}
              </div>

              <div className="mt-1 text-sm text-violet-300 font-medium">
                @{profile.username}
              </div>

              <p className="mt-3 text-sm text-slate-300 max-w-2xl leading-relaxed">
                {profile.headline || "Full-Stack Builder"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  {profile.experienceYears} Years Exp.
                </div>
                {(profile.githubUrl || profile.portfolioUrl) && (
                  <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-4">
                    {profile.githubUrl && (
                      <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="hover:text-white transition">
                        <Code2 className="h-4 w-4" />
                      </a>
                    )}
                    {profile.portfolioUrl && (
                      <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="hover:text-white transition">
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons & Stats */}
            <div className="w-full sm:w-auto flex flex-col gap-4 sm:items-end">
              <div className="flex items-center gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{projects.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Projects</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{profile.followersCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{profile.followingCount}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Following</div>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex w-full sm:w-auto items-center gap-2 mt-2">
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-lg ${isFollowing
                        ? "border border-white/15 bg-white/5 text-slate-200 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
                        : "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-95 shadow-violet-600/25"
                      }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      // Pass target user to the messaging drawer in feed, or route to messages
                      router.push(`/messages?userId=${creatorId}`);
                    }}
                    className="flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2.5 text-white hover:bg-white/10 transition"
                    title="Send Message"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skills Badges */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Core Technologies
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              Published Projects
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-slate-900/30 py-20 text-center">
              <Code2 className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <div className="text-sm font-semibold text-slate-300">No projects yet</div>
              <p className="text-xs text-slate-500 mt-1">
                {profile.name} hasn&apos;t uploaded any proof-of-work yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  href={`/projects/${project._id}`}
                  key={project._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 hover:border-violet-500/40 hover:bg-slate-900 transition duration-300"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                      <Eye className="h-3 w-3 text-cyan-400" />
                      {project.views?.total || 0}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1.5">
                      {project.category}
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-violet-300 transition">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                      {project.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex flex-wrap gap-1">
                        {project.technologies?.slice(0, 2).map((tech: string) => (
                          <span
                            key={tech}
                            className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-medium text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies?.length > 2 && (
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                            +{project.technologies.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {project.likesCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {project.commentsCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <CreatorProfileContent />
    </Suspense>
  );
}