
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Heart,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Eye,
  Send,
  Plus,
  CheckCircle2,
  X,
  Rocket,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Search,
  Code2,
  Users,
  UserPlus,
  Check,
  XCircle,
  FolderGit2,
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

interface CoBuilderItem {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
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
  openToCollab?: boolean;
  collabRoles?: string[];
  coBuilders?: CoBuilderItem[];
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

interface CollaborationRequest {
  _id: string;
  status?: string;
  [key: string]: unknown;
}

// ============================================================================
// SAFE PROJECT NORMALIZER
// ============================================================================
function normalizeProject(raw: Record<string, unknown> | null | undefined, index = 0): ProjectReel {
  const input = (raw ?? {}) as Record<string, unknown>;
  const creatorObj =
    (input.creator as Record<string, unknown> | undefined) ||
    (typeof input.creatorId === "object" && input.creatorId !== null
      ? (input.creatorId as Record<string, unknown>)
      : null) ||
    (typeof input.author === "object" && input.author !== null
      ? (input.author as Record<string, unknown>)
      : null) ||
    {};

  const creatorIdStr =
    typeof input.creatorId === "string"
      ? input.creatorId
      : ((input.creatorId as Record<string, unknown> | null)?._id as string | undefined) ||
        (creatorObj.userId as string | undefined) ||
        (creatorObj._id as string | undefined) ||
        "unknown_creator";

  const rawViews = input.views as Record<string, unknown> | number | undefined;
  const viewsObj =
    typeof rawViews === "number"
      ? {
          total: rawViews,
          unique: rawViews,
          creatorViews: Math.max(0, rawViews - 5),
          recruiterViews: 5,
        }
      : {
          total: Number((rawViews as Record<string, unknown> | undefined)?.total ?? input.viewsCount ?? 0),
          unique: Number((rawViews as Record<string, unknown> | undefined)?.unique ?? 0),
          creatorViews: Number((rawViews as Record<string, unknown> | undefined)?.creatorViews ?? 0),
          recruiterViews: Number((rawViews as Record<string, unknown> | undefined)?.recruiterViews ?? 0),
        };

  return {
    _id: String(input._id ?? input.id ?? `proj_${index}`),
    creatorId: String(creatorIdStr),
    title: (input.title as string | undefined) || "Untitled BuildSpace Project",
    description:
      (input.description as string | undefined) ||
      "Full-stack application built with modern web technologies.",
    category: (input.category as string | undefined) || "Full-Stack",
    technologies: Array.isArray(input.technologies)
      ? (input.technologies as string[])
      : ["React", "Next.js", "TypeScript", "Node.js"],
    thumbnail:
      (input.thumbnail as string | undefined) ||
      ((input.media as Array<Record<string, unknown>> | undefined)?.[0]?.url as string | undefined) ||
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    githubUrl: input.githubUrl as string | undefined,
    liveDemoUrl: input.liveDemoUrl as string | undefined,
    openToCollab: Boolean(input.openToCollab),
    collabRoles: Array.isArray(input.collabRoles) ? (input.collabRoles as string[]) : [],
    coBuilders: Array.isArray(input.coBuilders) ? (input.coBuilders as CoBuilderItem[]) : [],
    likesCount: Number(input.likesCount ?? (input.likes as unknown[] | undefined)?.length ?? 0),
    commentsCount: Number(input.commentsCount ?? (input.comments as unknown[] | undefined)?.length ?? 0),
    savesCount: Number(input.savesCount ?? (input.saves as unknown[] | undefined)?.length ?? 0),
    views: viewsObj,
    creator: {
      userId: String(creatorIdStr),
      name: (creatorObj.name as string | undefined) || "Unknown Builder",
      username: (creatorObj.username as string | undefined) || "unknown",
      avatar:
        (creatorObj.avatar as string | undefined) ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250",
      headline: (creatorObj.headline as string | undefined) || "Builder",
      location: creatorObj.location as string | undefined,
      openToWork: Boolean(creatorObj.openToWork),
    },
    isLiked: Boolean(input.isLiked),
    isSaved: Boolean(input.isSaved),
  };
}

function ExploreFeedContent() {
  const searchParams = useSearchParams();

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

  const [projects, setProjects] = useState<ProjectReel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collabFilterActive, setCollabFilterActive] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const [messageTargetProject, setMessageTargetProject] =
    useState<ProjectReel | null>(null);
  const [messageInput, setMessageInput] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [commentTargetProject, setCommentTargetProject] =
    useState<ProjectReel | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState<string>("");

  // Upload Project Modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Full-Stack",
    technologies: "",
    file: null as File | null,
    githubUrl: "",
    liveDemoUrl: "",
    openToCollab: false,
    collabRoles: "",
  });

  // Collaboration Request Modal & Hub State
  const [collabApplyProject, setCollabApplyProject] =
    useState<ProjectReel | null>(null);
  const [collabRoleInput, setCollabRoleInput] = useState<string>("");
  const [collabPitchInput, setCollabPitchInput] = useState<string>("");
  const [collabProofProjectId, setCollabProofProjectId] = useState<string>("");

  const [showCollabHubModal, setShowCollabHubModal] = useState<boolean>(false);
  const [collabTab, setCollabTab] = useState<"incoming" | "sent">("incoming");
  const [incomingCollabs, setIncomingCollabs] = useState<CollaborationRequest[]>([]);
  const [sentCollabs, setSentCollabs] = useState<CollaborationRequest[]>([]);

  const viewedProjectIdsRef = useRef<Set<string>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isUploadModalVisible =
    showUploadModal || Boolean(searchParams?.get("upload") && currentUser?.role !== "recruiter");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("buildspace_user");
      const savedProfile = localStorage.getItem("buildspace_profile");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && (parsedUser._id || parsedUser.id)) {
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

  const fetchCollaborations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/collaborations`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIncomingCollabs(data.incoming || []);
        setSentCollabs(data.sent || []);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (currentUser) fetchCollaborations();
  }, [currentUser, fetchCollaborations]);

  const fetchFeed = useCallback(
    async (
      cursor?: string | null,
      techFilter?: string,
      collabFilter?: boolean,
      replace = false
    ) => {
      try {
        const params = new URLSearchParams({ limit: "10" });
        if (cursor) params.set("cursor", cursor);
        if (techFilter) params.set("tech", techFilter);
        if (collabFilter) params.set("collab", "true");

        const res = await fetch(
          `${API_BASE}/api/feed/for-you?${params.toString()}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();

        const rawList = Array.isArray(data?.projects)
          ? data.projects
          : Array.isArray(data)
            ? data
            : [];

        if (rawList.length > 0) {
          const normalized = rawList.map((item, idx: number) =>
            normalizeProject(item as Record<string, unknown>, idx)
          );
          setProjects((prev) =>
            replace ? normalized : [...prev, ...normalized]
          );
          setNextCursor(data?.nextCursor || null);
          setHasMore(Boolean(data?.hasMore));
        } else if (replace) {
          setProjects([]);
          setHasMore(false);
        }
      } catch { }
    },
    []
  );

  useEffect(() => {
    fetchFeed(null, selectedTech, collabFilterActive, true);
  }, [selectedTech, collabFilterActive, fetchFeed]);

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
                fetchFeed(
                  nextCursor,
                  selectedTech,
                  collabFilterActive,
                  false
                );
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
                    : p
                )
              );

              fetch(`${API_BASE}/api/projects/${projId}/view`, {
                method: "POST",
                credentials: "include",
              }).catch(() => { });
            }
          }
        });
      },
      { threshold: [0.6] }
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
    collabFilterActive,
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
          : p
      )
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
          : p
      )
    );

    try {
      await fetch(`${API_BASE}/api/projects/${project._id}/save`, {
        method: willSave ? "POST" : "DELETE",
        credentials: "include",
      });
    } catch { }
  };

  const handleQuickShortlist = async (project: ProjectReel) => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateId: project.creator.userId || project.creatorId,
          projectId: project._id,
          reason: `Shortlisted from vertical reel: "${project.title}" (${project.technologies.slice(0, 3).join(", ")})`,
          stage: "Shortlisted",
        }),
      });
      if (res.ok) {
        showToast(
          `Shortlisted ${project.creator.name} with "${project.title}" attached!`
        );
      }
    } catch { }
  };

  // Open Structured Collaboration Application Modal
  const openCollabModal = (project: ProjectReel) => {
    setCollabApplyProject(project);
    const defaultRole = project.collabRoles?.[0] || "Co-Builder";
    setCollabRoleInput(defaultRole);
    const firstName = (project.creator?.name || "Creator").split(" ")[0];
    setCollabPitchInput(
      `Hi ${firstName}! I saw you're looking for a ${defaultRole} on "${project.title
        .split("—")[0]
        .trim()}". I have experience with ${project.technologies
          .slice(0, 3)
          .join(", ")} and would love to co-build this with you!`
    );
  };

  const handleSendCollabRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabApplyProject || !collabPitchInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/collaborations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId: collabApplyProject._id,
          roleApplied: collabRoleInput,
          pitch: collabPitchInput.trim(),
          ...(collabProofProjectId ? { proofProjectId: collabProofProjectId } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Collaboration request sent with your Proof-of-Work!");
        setCollabApplyProject(null);
        fetchCollaborations();
      } else {
        showToast(data.error || "Could not send collaboration request");
      }
    } catch {
      showToast("Error sending collaboration request");
    }
  };

  // Accept or Decline Collaboration Request (PATCH /api/collaborations/:id)
  const handleUpdateCollabStatus = async (
    collabId: string,
    status: "accepted" | "declined"
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/collaborations/${collabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          status === "accepted"
            ? "Accepted! Co-Builder badge added to your Project Reel!"
            : "Collaboration request declined."
        );
        fetchCollaborations();
        fetchFeed(null, selectedTech, collabFilterActive, true);
      } else {
        showToast(data.error || "Failed to update status");
      }
    } catch {
      showToast("Network error updating collaboration");
    }
  };

  const openMessageDrawer = (project: ProjectReel) => {
    const firstName = (project.creator?.name || "Creator").split(" ")[0];
    const topTech =
      (project.technologies || []).slice(0, 2).join(" and ") || "Full-Stack";
    setMessageTargetProject(project);
    setMessageInput(
      `Hi ${firstName}, I discovered your ${project.title
        .split("—")[0]
        .trim()} project on BuildSpace. I liked your ${topTech} implementation. Let's connect!`
    );
  };

  const handleSendContextualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTargetProject || !messageInput.trim()) return;

    const receiverId =
      messageTargetProject.creator?.userId || messageTargetProject.creatorId;

    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId,
          projectId: messageTargetProject._id,
          message: messageInput.trim(),
        }),
      });

      if (currentUser?.role === "recruiter") {
        await fetch(`${API_BASE}/api/recruiter/shortlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            candidateId: receiverId,
            projectId: messageTargetProject._id,
            reason: `Contacted regarding project: ${messageTargetProject.title}`,
            stage: "Contacted",
          }),
        });
      }
    } catch { }

    showToast(
      `Message sent to ${messageTargetProject.creator?.name || "Creator"} with project attached!`
    );
    setMessageTargetProject(null);
  };

  const openCommentsDrawer = async (project: ProjectReel) => {
    setCommentTargetProject(project);
    setComments([]);
    try {
      const res = await fetch(
        `${API_BASE}/api/projects/${project._id}/comments`
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
          : p
      )
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
        }
      );
    } catch { }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser?.role === "recruiter") {
      showToast("Recruiters cannot upload projects. Post jobs in the Dashboard.");
      return;
    }

    if (!uploadForm.file) {
      showToast("Please select a video or image file first.");
      return;
    }

    setIsUploading(true);
    const techs = uploadForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const collabRolesArr = uploadForm.collabRoles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
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
          openToCollab: uploadForm.openToCollab,
          collabRoles: collabRolesArr,
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
          title: "",
          description: "",
          category: "Full-Stack",
          technologies: "",
          file: null,
          githubUrl: "",
          liveDemoUrl: "",
          openToCollab: false,
          collabRoles: "",
        });
        showToast("Project published to the vertical discovery feed!");
      } else {
        throw new Error("Failed to save project");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong during upload.";
      showToast(message || "Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const myOwnProjects = projects.filter(
    (p) => currentUser && p.creatorId === currentUser._id
  );
  const pendingIncomingCount = incomingCollabs.filter(
    (c) => c.status === "pending"
  ).length;

  const filteredProjects = projects.filter((p) => {
    const matchesTech =
      !selectedTech ||
      p.technologies.some(
        (t) => t.toLowerCase() === selectedTech.toLowerCase()
      );
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technologies.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesTech && matchesSearch;
  });

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#06080D] text-slate-100">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          LEFT SIDEBAR: WORKSPACE, COLLAB HUB, SEARCH & FILTERS
      ===================================================================== */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col justify-between border-r border-white/10 bg-[#080B12] p-5 overflow-y-auto">
        <div className="space-y-6">
          {currentUser?.role === "recruiter" ? (
            <div className="space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                ● Recruiter Mode Active
              </div>
              <Link
                href="/recruiter"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:opacity-95 transition"
              >
                <Briefcase className="h-4 w-4" />
                <span>Recruiter Dashboard & Jobs</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:opacity-95 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Project Reel</span>
              </button>

              {/* Filter Feed for Collab Projects */}
              <button
                onClick={() => setCollabFilterActive(!collabFilterActive)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${collabFilterActive
                    ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
              >
                <UserPlus
                  className={`h-4 w-4 ${collabFilterActive ? "text-amber-400" : "text-slate-400"
                    }`}
                />
                <span>
                  {collabFilterActive
                    ? "Showing Collab Projects"
                    : "Find Co-Builders & Collabs"}
                </span>
              </button>

              {/* Open Collab Requests Hub (Accept / Decline Requests) */}
              <button
                onClick={() => {
                  fetchCollaborations();
                  setShowCollabHubModal(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/20 transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>Collab Requests Hub</span>
                </div>
                {pendingIncomingCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                    {pendingIncomingCount} new
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Search Projects
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, creator, or tech..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filter by Tech Stack
              </span>
              {selectedTech && (
                <button
                  onClick={() => setSelectedTech("")}
                  className="text-[11px] text-violet-400 hover:underline"
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
                "Tailwind CSS",
              ].map((tech) => (
                <button
                  key={tech}
                  onClick={() =>
                    setSelectedTech((prev) => (prev === tech ? "" : tech))
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${selectedTech.toLowerCase() === tech.toLowerCase()
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-white/10 pt-4">
            <Link
              href="/message"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <span>Project-Linked Messages</span>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 text-[11px] text-slate-400">
          <div className="font-bold text-white mb-1">
            Verified Co-Builder System
          </div>
          When you accept a collaboration request, your co-builder is automatically credited on the live project reel!
        </div>
      </aside>

      {/* =====================================================================
          CENTER VERTICAL REELS FEED
      ===================================================================== */}
      <main className="relative h-full flex-1 overflow-hidden flex justify-center bg-[#05070B]">
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
                Math.min(filteredProjects.length - 1, activeIndex + 1)
              )
            }
            disabled={
              activeIndex >= filteredProjects.length - 1 ||
              filteredProjects.length === 0
            }
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-white hover:bg-white/10 disabled:opacity-30 transition"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        <div className="h-full w-full max-w-[540px] overflow-y-scroll snap-y snap-mandatory scroll-smooth">
          {filteredProjects.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-slate-400 p-6">
              <div className="text-center space-y-4">
                <Layers className="mx-auto h-12 w-12 text-slate-700" />
                <p className="text-sm">No projects found in the feed.</p>
                {currentUser?.role === "recruiter" ? (
                  <Link
                    href="/recruiter"
                    className="inline-block rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Go to Recruiter Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-lg bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition"
                  >
                    Be the first to upload
                  </button>
                )}
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
                className="relative h-full w-full snap-start snap-always flex items-center justify-center p-0 sm:p-4"
              >
                <div className="relative h-full w-full overflow-hidden sm:rounded-[28px] border border-white/15 bg-slate-950 shadow-2xl">
                  {project.thumbnail && project.thumbnail.includes(".mp4") ? (
                    <video
                      src={project.thumbnail}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                  ) : (
                    <img
                      src={
                        project.thumbnail ||
                        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
                      }
                      alt={project.title}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04060A] via-[#04060A]/65 to-black/30 pointer-events-none" />

                  {/* Top Bar: Category & Views */}
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

                  {/* COLLABORATION BANNER & VERIFIED CO-BUILDERS */}
                  <div className="absolute top-14 left-4 right-16 z-10 flex flex-wrap items-center gap-2">
                    {project.openToCollab && (
                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 backdrop-blur-md shadow-lg">
                        <UserPlus className="h-3.5 w-3.5 text-amber-300" />
                        <span className="text-[10px] font-bold uppercase text-amber-200">
                          Open to Collab
                          {project.collabRoles && project.collabRoles.length > 0
                            ? `: ${project.collabRoles.join(", ")}`
                            : ""}
                        </span>
                      </div>
                    )}

                    {project.coBuilders && project.coBuilders.length > 0 && (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 backdrop-blur-md">
                        <div className="flex -space-x-1.5">
                          {project.coBuilders.map((cb, i) => (
                            <img
                              key={i}
                              src={cb.avatar}
                              alt={cb.name}
                              title={`${cb.name} (${cb.role})`}
                              className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-400"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-200">
                          +{project.coBuilders.length} Verified Co-Builder
                          {project.coBuilders.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
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
                          className={`h-5 w-5 ${project.isLiked ? "fill-rose-400" : ""
                            }`}
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
                          className={`h-5 w-5 ${project.isSaved ? "fill-amber-300" : ""
                            }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {project.savesCount}
                      </span>
                    </button>

                    {currentUser?.role === "recruiter" && (
                      <button
                        onClick={() => handleQuickShortlist(project)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 backdrop-blur-md">
                          <BookmarkCheck className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-300">
                          Shortlist
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        showToast("Project link copied to clipboard!");
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md">
                        <Share2 className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] text-slate-300">Share</span>
                    </button>
                  </div>

                  {/* Bottom Project Details */}
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

                      {/* FIXED COLLAB BUTTON LOGIC */}
                      {project.openToCollab &&
                        currentUser?.role !== "recruiter" &&
                        currentUser?._id !== project.creator.userId &&
                        currentUser?._id !== project.creatorId ? (
                        <button
                          onClick={() => openCollabModal(project)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:opacity-95 transition"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Join Collab</span>
                        </button>
                      ) : project.githubUrl ? (
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
                        <span>Message</span>
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
          MODAL: APPLY TO COLLABORATE (WITH PROOF-OF-WORK PROJECT)
      ===================================================================== */}
      {collabApplyProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Request to Co-Build
                </h3>
              </div>
              <button
                onClick={() => setCollabApplyProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-amber-300">
                Target Project
              </div>
              <div className="text-xs font-bold text-white">
                {collabApplyProject.title}
              </div>
            </div>

            <form onSubmit={handleSendCollabRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Role You Want to Fill
                </label>
                {collabApplyProject.collabRoles &&
                  collabApplyProject.collabRoles.length > 0 ? (
                  <select
                    value={collabRoleInput}
                    onChange={(e) => setCollabRoleInput(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {collabApplyProject.collabRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={collabRoleInput}
                    onChange={(e) => setCollabRoleInput(e.target.value)}
                    placeholder="e.g. Frontend Engineer, UI/UX, Backend"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                )}
              </div>

              {myOwnProjects.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Attach Your Shipped Project as Proof-of-Skill
                  </label>
                  <select
                    value={collabProofProjectId}
                    onChange={(e) => setCollabProofProjectId(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/30 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="">
                      Auto-attach my top BuildSpace project
                    </option>
                    {myOwnProjects.map((mp) => (
                      <option key={mp._id} value={mp._id}>
                        {mp.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Collaboration Pitch
                </label>
                <textarea
                  rows={4}
                  required
                  value={collabPitchInput}
                  onChange={(e) => setCollabPitchInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-slate-950 shadow-lg"
              >
                Send Collaboration Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: COLLABORATION REQUESTS HUB (ACCEPT / DECLINE via PATCH)
      ===================================================================== */}
      {showCollabHubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Creator Collaboration Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Accepting a request automatically adds the developer as a Verified Co-Builder on your project reel.
                </p>
              </div>
              <button
                onClick={() => setShowCollabHubModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setCollabTab("incoming")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${collabTab === "incoming"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                  }`}
              >
                Incoming Requests ({incomingCollabs.length})
              </button>
              <button
                onClick={() => setCollabTab("sent")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${collabTab === "sent"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                  }`}
              >
                My Sent Requests ({sentCollabs.length})
              </button>
            </div>

            {collabTab === "incoming" ? (
              <div className="space-y-3">
                {incomingCollabs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No incoming collaboration requests yet. Enable "Looking for Co-Builders" when uploading a project!
                  </div>
                ) : (
                  incomingCollabs.map((req) => (
                    <div
                      key={req._id}
                      className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-3"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.applicant?.avatar}
                            alt={req.applicant?.name}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-500/40"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {req.applicant?.name}
                              </span>
                              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                                Role: {req.roleApplied}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              For your project:{" "}
                              <strong className="text-white">
                                {req.project?.title}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${req.status === "accepted"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : req.status === "declined"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {req.pitch}
                      </p>

                      {/* Proof-of-Work Project Attached by Applicant */}
                      {req.proofProject && (
                        <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-xs">
                          <div className="flex items-center gap-2 text-cyan-200">
                            <FolderGit2 className="h-4 w-4 text-cyan-400" />
                            <span>
                              Applicant's Proof-of-Work:{" "}
                              <strong>{req.proofProject.title}</strong>
                            </span>
                          </div>
                          {req.proofProject.liveDemoUrl && (
                            <a
                              href={req.proofProject.liveDemoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 underline"
                            >
                              Inspect Build
                            </a>
                          )}
                        </div>
                      )}

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleUpdateCollabStatus(req._id, "accepted")
                            }
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept & Add as Co-Builder</span>
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateCollabStatus(req._id, "declined")
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sentCollabs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    You haven't sent any collaboration requests yet.
                  </div>
                ) : (
                  sentCollabs.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">
                          {req.project?.title || "Project"}
                        </div>
                        <div className="text-xs text-slate-400">
                          Role: {req.roleApplied} • Owner: {req.owner?.name}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${req.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : req.status === "declined"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                      ● Project-Linked Channel
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
                  Attached Project Context
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg"
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
                <div className="text-center text-slate-500 text-xs py-10">
                  No comments yet.
                </div>
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
          UPLOAD PROJECT MODAL (WITH COLLABORATION SETTINGS)
      ===================================================================== */}
      {isUploadModalVisible && currentUser?.role !== "recruiter" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  Publish Project
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

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-3">
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
                    placeholder="e.g. CloudPulse — Real-Time Monitor"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        description: e.target.value,
                      })
                    }
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
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.openToCollab}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        openToCollab: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-slate-950 text-amber-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    Looking for Co-Builders? (Collab Mode)
                  </span>
                </label>

                {uploadForm.openToCollab && (
                  <div>
                    <label className="block text-[11px] font-medium text-amber-200/70 mb-1">
                      Roles Needed (comma separated)
                    </label>
                    <input
                      type="text"
                      required={uploadForm.openToCollab}
                      value={uploadForm.collabRoles}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          collabRoles: e.target.value,
                        })
                      }
                      placeholder="e.g. Frontend Developer, UI/UX Designer, AI Engineer"
                      className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
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
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2 text-xs text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      GitHub URL
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
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Live Demo URL
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
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isUploading
                  ? "Uploading & Publishing..."
                  : "Publish to Vertical Feed"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="flex h-dvh flex-col bg-[#06080D]">
      <Navbar />
      <div className="min-h-0 flex-1">
        <Suspense fallback={<div className="h-full bg-[#06080D]" />}>
          <ExploreFeedContent />
        </Suspense>
      </div>
    </div>
  );
}