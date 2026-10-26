"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ExternalLink,
  Eye,
  Send,
  Plus,
  LogOut,
  CheckCircle2,
  Sparkles,
  X,
  Rocket,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Users,
  Search,
  Code2,
} from "lucide-react";
import Navbar from "@/component/Navbar/Navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================
interface CreatorProfile {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  headline?: string;
  location?: string;
  openToWork?: boolean;
}

interface ProjectReel {
  _id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  thumbnail: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  views: {
    total: number;
    unique: number;
    creatorViews: number;
    recruiterViews: number;
  };
  creator: CreatorProfile;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
}

// ============================================================================
// SAFE PROJECT NORMALIZER (Prevents 'Cannot read properties of undefined')
// ============================================================================
function normalizeProject(raw: any, index = 0): ProjectReel {
  const creatorObj =
    raw?.creator ||
    (typeof raw?.creatorId === "object" ? raw.creatorId : null) ||
    (typeof raw?.author === "object" ? raw.author : null) ||
    {};

  const creatorIdStr =
    typeof raw?.creatorId === "string"
      ? raw.creatorId
      : raw?.creatorId?._id ||
      creatorObj?.userId ||
      creatorObj?._id ||
      "unknown_creator";

  const rawViews = raw?.views;
  const viewsObj =
    typeof rawViews === "number"
      ? {
        total: rawViews,
        unique: rawViews,
        creatorViews: Math.max(0, rawViews - 5),
        recruiterViews: 5,
      }
      : {
        total: Number(rawViews?.total ?? raw?.viewsCount ?? 0),
        unique: Number(rawViews?.unique ?? 0),
        creatorViews: Number(rawViews?.creatorViews ?? 0),
        recruiterViews: Number(rawViews?.recruiterViews ?? 0),
      };

  return {
    _id: String(raw?._id || raw?.id || `proj_${index}`),
    creatorId: String(creatorIdStr),
    title: raw?.title || "Untitled BuildSpace Project",
    description:
      raw?.description ||
      "Full-stack application built with modern web technologies.",
    category: raw?.category || "Full-Stack",
    technologies: Array.isArray(raw?.technologies)
      ? raw.technologies
      : ["React", "Next.js", "TypeScript", "Node.js"],
    thumbnail:
      raw?.thumbnail ||
      raw?.media?.[0]?.url ||
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    githubUrl: raw?.githubUrl,
    liveDemoUrl: raw?.liveDemoUrl,
    likesCount: Number(raw?.likesCount ?? raw?.likes?.length ?? 0),
    commentsCount: Number(raw?.commentsCount ?? raw?.comments?.length ?? 0),
    savesCount: Number(raw?.savesCount ?? raw?.saves?.length ?? 0),
    views: viewsObj,
    creator: {
      userId: String(creatorIdStr),
      name: creatorObj?.name || "Unknown Builder",
      username: creatorObj?.username || "unknown",
      avatar:
        creatorObj?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250",
      headline: creatorObj?.headline || "Builder",
      location: creatorObj?.location,
      openToWork: creatorObj?.openToWork ?? false,
    },
    isLiked: Boolean(raw?.isLiked),
    isSaved: Boolean(raw?.isSaved),
  };
}

function ExploreFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safely read query params
  const onboardingMode = searchParams?.get("onboarding") || null;

  // Auth User State (Empty by default)
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    email: string;
    role: "creator" | "recruiter" | "admin";
  } | null>(null);

  const [currentProfile, setCurrentProfile] = useState<{
    name: string;
    username: string;
    avatar?: string;
  } | null>(null);

  // Feed & Cursor Pagination State (Starts empty)
  const [projects, setProjects] = useState<ProjectReel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Drawers & Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [messageTargetProject, setMessageTargetProject] =
    useState<ProjectReel | null>(null);
  const [messageInput, setMessageInput] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [commentTargetProject, setCommentTargetProject] =
    useState<ProjectReel | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState<string>("");

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // UPDATED: Added file property to handle native file uploads
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Full-Stack",
    technologies: "",
    file: null as File | null,
    githubUrl: "",
    liveDemoUrl: "",
  });

  const viewedProjectIdsRef = useRef<Set<string>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (onboardingMode) setShowOnboarding(true);
  }, [onboardingMode]);

  // Load logged-in user purely from localStorage or backend (No hardcoded fallbacks)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("buildspace_user");
      const savedProfile = localStorage.getItem("buildspace_profile");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser._id) {
          setCurrentUser({
            _id: parsedUser._id || parsedUser.id,
            email: parsedUser.email,
            role: parsedUser.role || "creator",
          });
        }
      }
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile && parsedProfile.name) {
          setCurrentProfile({
            name: parsedProfile.name,
            username: parsedProfile.username,
            avatar: parsedProfile.avatar,
          });
        }
      }
    } catch { }

    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user || data;
        if (u && (u._id || u.id)) {
          setCurrentUser({
            _id: u._id || u.id,
            email: u.email,
            role: u.role || "creator",
          });
        }
        if (data?.profile) {
          setCurrentProfile({
            name: data.profile.name,
            username: data.profile.username,
            avatar: data.profile.avatar,
          });
        }
      })
      .catch(() => { });
  }, []);

  // Fetch Vertical Feed with Cursor Pagination
  const fetchFeed = useCallback(
    async (cursor?: string | null, techFilter?: string, replace = false) => {
      try {
        const params = new URLSearchParams({ limit: "10" });
        if (cursor) params.set("cursor", cursor);
        if (techFilter) params.set("tech", techFilter);

        const res = await fetch(
          `${API_BASE}/api/feed/for-you?${params.toString()}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) return;
        const data = await res.json();

        const rawList = Array.isArray(data?.projects)
          ? data.projects
          : Array.isArray(data)
            ? data
            : [];

        if (rawList.length > 0) {
          const normalized = rawList.map((item: any, idx: number) =>
            normalizeProject(item, idx),
          );
          setProjects((prev) =>
            replace ? normalized : [...prev, ...normalized],
          );
          setNextCursor(data?.nextCursor || null);
          setHasMore(Boolean(data?.hasMore));
        } else if (replace) {
          setProjects([]);
          setHasMore(false);
        }
      } catch {
        // Leave projects unchanged on network failure
      }
    },
    [],
  );

  useEffect(() => {
    fetchFeed(null, selectedTech, true);
  }, [selectedTech, fetchFeed]);

  // IntersectionObserver for View Tracking + Cursor Pagination
  useEffect(() => {
    const userRole = currentUser?.role || "creator";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const projId = entry.target.getAttribute("data-project-id");
            const idxAttr = entry.target.getAttribute("data-index");

            if (idxAttr !== null) {
              const idx = Number(idxAttr);
              setActiveIndex(idx);
              if (hasMore && nextCursor && idx >= projects.length - 2) {
                fetchFeed(nextCursor, selectedTech, false);
              }
            }

            if (projId && !viewedProjectIdsRef.current.has(projId)) {
              viewedProjectIdsRef.current.add(projId);

              setProjects((prev) =>
                prev.map((p) =>
                  p._id === projId
                    ? {
                      ...p,
                      views: {
                        ...p.views,
                        total: p.views.total + 1,
                        unique: p.views.unique + 1,
                        recruiterViews:
                          userRole === "recruiter"
                            ? p.views.recruiterViews + 1
                            : p.views.recruiterViews,
                        creatorViews:
                          userRole !== "recruiter"
                            ? p.views.creatorViews + 1
                            : p.views.creatorViews,
                      },
                    }
                    : p,
                ),
              );

              fetch(`${API_BASE}/api/projects/${projId}/view`, {
                method: "POST",
                credentials: "include",
              }).catch(() => { });
            }
          }
        });
      },
      { threshold: [0.6] },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [
    projects.length,
    hasMore,
    nextCursor,
    selectedTech,
    currentUser?.role,
    fetchFeed,
  ]);

  const scrollToReel = (index: number) => {
    cardRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleLike = async (project: ProjectReel) => {
    const willLike = !project.isLiked;
    setProjects((prev) =>
      prev.map((p) =>
        p._id === project._id
          ? {
            ...p,
            isLiked: willLike,
            likesCount: Math.max(0, p.likesCount + (willLike ? 1 : -1)),
          }
          : p,
      ),
    );

    try {
      await fetch(`${API_BASE}/api/projects/${project._id}/like`, {
        method: willLike ? "POST" : "DELETE",
        credentials: "include",
      });
    } catch { }
  };

  const handleToggleSave = async (project: ProjectReel) => {
    const willSave = !project.isSaved;
    setProjects((prev) =>
      prev.map((p) =>
        p._id === project._id
          ? {
            ...p,
            isSaved: willSave,
            savesCount: Math.max(0, p.savesCount + (willSave ? 1 : -1)),
          }
          : p,
      ),
    );

    try {
      await fetch(`${API_BASE}/api/projects/${project._id}/save`, {
        method: willSave ? "POST" : "DELETE",
        credentials: "include",
      });
    } catch { }
  };

  const openMessageDrawer = (project: ProjectReel) => {
    const firstName = (project.creator?.name || "Creator").split(" ")[0];
    const topTech =
      (project.technologies || []).slice(0, 2).join(" and ") || "Full-Stack";
    setMessageTargetProject(project);
    setMessageInput(
      `Hi ${firstName}, I discovered your ${project.title
        .split("—")[0]
        .trim()} project on BuildSpace. I liked your ${topTech} implementation. We have a Full-Stack Developer opportunity. Would you be interested?`,
    );
  };

  const handleSendContextualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTargetProject || !messageInput.trim()) return;

    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId:
            messageTargetProject.creator?.userId ||
            messageTargetProject.creatorId,
          projectId: messageTargetProject._id,
          message: messageInput.trim(),
        }),
      });
    } catch { }

    setToastMessage(
      `Message sent to ${messageTargetProject.creator?.name || "Creator"} with project context attached!`,
    );
    setMessageTargetProject(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openCommentsDrawer = async (project: ProjectReel) => {
    setCommentTargetProject(project);
    setComments([]);

    try {
      const res = await fetch(
        `${API_BASE}/api/projects/${project._id}/comments`,
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.comments) ? data.comments : [];
        if (list.length > 0) setComments(list);
      }
    } catch { }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentTargetProject || !newComment.trim()) return;

    const created: CommentItem = {
      _id: "c_" + Date.now(),
      content: newComment.trim(),
      createdAt: "Just now",
      author: {
        name: currentProfile?.name || "You",
        username: currentProfile?.username || "builder",
        avatar:
          currentProfile?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      },
    };

    setComments((prev) => [created, ...prev]);
    setProjects((prev) =>
      prev.map((p) =>
        p._id === commentTargetProject._id
          ? { ...p, commentsCount: p.commentsCount + 1 }
          : p,
      ),
    );
    setNewComment("");

    try {
      await fetch(
        `${API_BASE}/api/projects/${commentTargetProject._id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: created.content }),
        },
      );
    } catch { }
  };

  // UPDATED: Project Creation Flow with Native Media Upload
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file) {
      setToastMessage("Please select a video or image file first.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsUploading(true);
    const techs = uploadForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      // 1. Upload the media file first
      const formData = new FormData();
      formData.append("file", uploadForm.file);

      const uploadRes = await fetch(`${API_BASE}/api/uploads`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Media upload failed");
      const uploadData = await uploadRes.json();
      const uploadedMediaUrl = uploadData.url;

      // 2. Create the project with the returned media URL
      const projectRes = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description,
          category: uploadForm.category,
          technologies: techs,
          thumbnail: uploadedMediaUrl,
          githubUrl: uploadForm.githubUrl,
          liveDemoUrl: uploadForm.liveDemoUrl,
          visibility: "public",
          status: "published",
        }),
      });

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        const saved = normalizeProject(projectData?.project || projectData);
        setProjects((prev) => [saved, ...prev]);
        setShowUploadModal(false);
        setUploadForm({
          title: "", description: "", category: "Full-Stack",
          technologies: "", file: null, githubUrl: "", liveDemoUrl: ""
        });
        setToastMessage("Project published to the vertical discovery feed!");
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        throw new Error("Failed to save project");
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.message || "Something went wrong during upload.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { }
    localStorage.removeItem("buildspace_token");
    localStorage.removeItem("buildspace_user");
    localStorage.removeItem("buildspace_profile");
    router.push("/login");
  };

  const filteredProjects = projects.filter((p) => {
    const matchesTech =
      !selectedTech ||
      p.technologies.some(
        (t) => t.toLowerCase() === selectedTech.toLowerCase(),
      );
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technologies.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesTech && matchesSearch;
  });

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06080D] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          LEFT SIDEBAR: ROLE WORKSPACE & FILTERS
      ===================================================================== */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-white/10 bg-[#080B12] p-5 md:flex">
        <div className="space-y-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">
                Build<span className="text-violet-400">Space</span>
              </span>
              <span className="block text-[10px] font-mono uppercase text-emerald-400">
                ● {currentUser?.role || "creator"} feed
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, stack, creator..."
              className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Primary Upload Project CTA */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Project Reel</span>
          </button>

          {/* Stack Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Filter by Technology</span>
              {selectedTech && (
                <button
                  onClick={() => setSelectedTech("")}
                  className="text-violet-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "React",
                "Next.js",
                "TypeScript",
                "Node.js",
                "MongoDB",
                "Socket.IO",
                "Rust",
                "WebGPU",
              ].map((tech) => (
                <button
                  key={tech}
                  onClick={() =>
                    setSelectedTech((prev) => (prev === tech ? "" : tech))
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${selectedTech === tech
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          {/* Active Feed Instructions */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3.5 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Reels Discovery Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Scroll vertically through live builds. Click{" "}
              <span className="text-cyan-300 font-semibold">
                Message Creator
              </span>{" "}
              to chat with the project automatically linked.
            </p>
          </div>
        </div>

        {/* Logged-In User Footer */}
        <div className="border-t border-white/10 pt-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/30 font-bold text-violet-200 text-xs">
                {(currentProfile?.name || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-white">
                  {currentProfile?.name || "Unknown User"}
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  @{currentProfile?.username || "unknown"} •{" "}
                  <span className="capitalize text-violet-400">
                    {currentUser.role || "creator"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-rose-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================================
          CENTER VERTICAL REELS FEED (scroll-snap-type: y mandatory)
      ===================================================================== */}
      <main className="relative flex-1 h-screen overflow-hidden flex justify-center bg-[#05070B]">
        {/* Desktop Up/Down Reel Switcher */}
        <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-2">
          <button
            onClick={() => scrollToReel(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-white hover:bg-white/10 disabled:opacity-30 transition"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={() =>
              scrollToReel(
                Math.min(filteredProjects.length - 1, activeIndex + 1),
              )
            }
            disabled={activeIndex >= filteredProjects.length - 1 || filteredProjects.length === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-white hover:bg-white/10 disabled:opacity-30 transition"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Snap Scroll Container */}
        <div className="h-screen w-full max-w-[540px] overflow-y-scroll snap-y snap-mandatory scroll-smooth">
          {filteredProjects.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <div className="text-center space-y-4">
                <Layers className="mx-auto h-12 w-12 text-slate-700" />
                <p className="text-sm">No projects found in the feed.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-lg bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition"
                >
                  Be the first to upload
                </button>
              </div>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <div
                key={project._id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                data-project-id={project._id}
                data-index={index}
                className="relative h-screen w-full snap-start snap-always flex items-center justify-center p-0 sm:p-4"
              >
                <div className="relative h-full w-full overflow-hidden sm:rounded-[28px] border border-white/15 bg-slate-950 shadow-2xl">
                  {project.thumbnail.endsWith('.mp4') ? (
                    <video
                      src={project.thumbnail}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="h-full w-full object-cover object-center"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04060A] via-[#04060A]/65 to-black/30" />

                  {/* Top Bar: Category & View Telemetry */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200 backdrop-blur-md">
                      {project.category}
                    </span>
                    <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-slate-200 backdrop-blur-md">
                      <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{project.views.total.toLocaleString()} views</span>
                      <span className="text-emerald-400 font-semibold">
                        • {project.views.recruiterViews} recruiters
                      </span>
                    </div>
                  </div>

                  {/* Right Vertical Action Rail */}
                  <div className="absolute right-4 bottom-40 flex flex-col items-center gap-4 z-20">
                    <button
                      onClick={() => handleToggleLike(project)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition ${project.isLiked
                            ? "border-rose-500 bg-rose-500/25 text-rose-400"
                            : "border-white/15 bg-black/55 text-white hover:bg-white/15"
                          }`}
                      >
                        <Heart
                          className={`h-5 w-5 ${project.isLiked ? "fill-rose-400" : ""}`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {project.likesCount}
                      </span>
                    </button>

                    <button
                      onClick={() => openCommentsDrawer(project)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-white/15 transition">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {project.commentsCount}
                      </span>
                    </button>

                    <button
                      onClick={() => handleToggleSave(project)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition ${project.isSaved
                            ? "border-amber-400 bg-amber-500/25 text-amber-300"
                            : "border-white/15 bg-black/55 text-white hover:bg-white/15"
                          }`}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${project.isSaved ? "fill-amber-300" : ""}`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {project.savesCount}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        setToastMessage("Project link copied to clipboard!");
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-white/15 transition">
                        <Share2 className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] text-slate-300">Share</span>
                    </button>
                  </div>

                  {/* Bottom Project & Creator Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pr-20 space-y-4 z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.creator.avatar}
                        alt={project.creator.name}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-violet-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {project.creator.name}
                          </span>
                          {project.creator.openToWork && (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Open to Work
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300">
                          @{project.creator.username}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-white leading-snug">
                        {project.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-3 text-xs text-slate-200 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-cyan-200 backdrop-blur-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Primary Reel CTAs */}
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {project.liveDemoUrl ? (
                        <a
                          href={project.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Live Demo</span>
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed">
                          <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                          <span>No Demo</span>
                        </div>
                      )}

                      {project.githubUrl ? (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>GitHub</span>
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed">
                          <Code2 className="h-3.5 w-3.5 opacity-50" />
                          <span>No Repo</span>
                        </div>
                      )}

                      <button
                        onClick={() => openMessageDrawer(project)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Message Creator</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* =====================================================================
          CONTEXTUAL MESSAGE CREATOR DRAWER
      ===================================================================== */}
      {messageTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-white/15 bg-slate-900 p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={messageTargetProject.creator.avatar}
                    alt={messageTargetProject.creator.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Message {messageTargetProject.creator.name}
                    </h3>
                    <p className="text-xs text-emerald-400">
                      ● Real-Time Socket.IO Channel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMessageTargetProject(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3.5 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300">
                  Triggered from Project Reel (projectId:{" "}
                  {messageTargetProject._id})
                </div>
                <div className="text-sm font-bold text-white">
                  {messageTargetProject.title}
                </div>
              </div>
            </div>

            <form onSubmit={handleSendContextualMessage} className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Direct Message
              </label>
              <textarea
                rows={5}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white focus:border-violet-500 focus:outline-none leading-relaxed"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
              >
                <Send className="h-4 w-4" />
                <span>Send Message Without Leaving Feed</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          COMMENTS DRAWER
      ===================================================================== */}
      {commentTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-white/15 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Project Comments
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">
                  {commentTargetProject.title}
                </p>
              </div>
              <button
                onClick={() => setCommentTargetProject(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-10">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {c.author?.name || "Builder"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {c.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          UPLOAD PROJECT MODAL
      ===================================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  Publish Project to BuildSpace Feed
                </h3>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="e.g. CloudPulse — Real-Time Kubernetes Monitor"
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what you built and how it works..."
                  className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.technologies}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      technologies: e.target.value,
                    })
                  }
                  placeholder="React, Next.js, Node.js"
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              {/* NATIVE FILE UPLOAD INPUT */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Media (MP4 Video or Image)
                </label>
                <input
                  type="file"
                  required
                  accept="video/mp4,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadForm({
                        ...uploadForm,
                        file: e.target.files[0],
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-slate-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-600/20 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-violet-300 hover:file:bg-violet-600/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={uploadForm.githubUrl}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        githubUrl: e.target.value,
                      })
                    }
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={uploadForm.liveDemoUrl}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        liveDemoUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30 disabled:opacity-50 transition"
              >
                {isUploading ? "Uploading & Publishing..." : "Publish to Vertical Feed"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          FIRST-TIME ONBOARDING WELCOME MODAL
      ===================================================================== */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-violet-500/40 bg-slate-900 p-7 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Welcome to BuildSpace, {currentProfile?.name || "Builder"}!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are now inside the vertical project discovery feed. Scroll
              through live projects or upload your own build.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowOnboarding(false);
                  setShowUploadModal(true);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-xs font-bold text-white"
              >
                Upload First Project
              </button>
              <button
                onClick={() => setShowOnboarding(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                Explore Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06080D]" />}>
      <Navbar />
      <ExploreFeedContent />
    </Suspense>
  );
}