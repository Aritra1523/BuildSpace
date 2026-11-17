"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Compass,
  Users,
  BookmarkCheck,
  MessageSquare,
  Briefcase,
  Kanban,
  Building2,
  Search,
  ExternalLink,
  Code2,
  Eye,
  Heart,
  Send,
  Plus,
  CheckCircle2,
  MapPin,
  X,
  UserCheck,
  FolderGit2,
  ShieldCheck,
  Trash2,
  LogOut,
  Menu,
  Filter,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type NavSection =
  | "discover"
  | "talent"
  | "shortlisted"
  | "messages"
  | "jobs"
  | "pipeline"
  | "company";

const PIPELINE_STAGES = [
  "Applied",
  "Shortlisted",
  "Contacted",
  "Interview",
  "Hired",
  "Rejected",
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

interface ProjectItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  thumbnail: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  views: number;
  likesCount: number;
  creator?: CreatorItem;
  isShortlisted?: boolean;
}

interface CreatorItem {
  userId: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  headline: string;
  bio?: string;
  location: string;
  experienceLevel: string;
  openToWork: boolean;
  skills: string[];
  projects: ProjectItem[];
  isShortlisted?: boolean;
  shortlistStage?: PipelineStage | null;
}

interface ShortlistEntry {
  _id: string;
  candidateId: string;
  reason: string;
  stage: PipelineStage;
  updatedAt: string;
  candidate: CreatorItem;
  project: ProjectItem | null;
}

interface JobPost {
  _id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryRange: string;
  applicationsCount?: number;
  createdAt: string;
}

interface Conversation {
  _id?: string;
  userId: string;
  name: string;
  avatar?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId?: string;
  message: string;
  createdAt: string;
}

interface JobApplication {
  _id: string;
  status?: string;
  [key: string]: unknown;
}

export default function RecruiterDashboardPage() {
  const router = useRouter();

  // Default Landing Section: 2. Discover Projects
  const [activeNav, setActiveNav] = useState<NavSection>("discover");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    email: string;
    role: string;
    name?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================================================
  // STATE: 1. DISCOVER PROJECTS
  // ==========================================================================
  const [discoverProjects, setDiscoverProjects] = useState<ProjectItem[]>([]);
  const [projectTechFilter, setProjectTechFilter] = useState("");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);

  // ==========================================================================
  // STATE: 2. FIND TALENT
  // ==========================================================================
  const [developers, setDevelopers] = useState<CreatorItem[]>([]);
  const [talentSearch, setTalentSearch] = useState("");
  const [talentSkill, setTalentSkill] = useState("");
  const [talentExperience, setTalentExperience] = useState("All");
  const [talentLocation, setTalentLocation] = useState("");
  const [talentOpenOnly, setTalentOpenOnly] = useState(false);
  const [loadingTalent, setLoadingTalent] = useState(false);

  // ==========================================================================
  // STATE: 3. SHORTLISTED & 6. HIRING PIPELINE
  // ==========================================================================
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // ==========================================================================
  // STATE: 4. PROJECT-LINKED MESSAGES
  // ==========================================================================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [attachedChatProject, setAttachedChatProject] = useState<ProjectItem | null>(null);

  // ==========================================================================
  // STATE: 5. JOBS & APPLICATIONS
  // ==========================================================================
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    description: "",
    requiredSkills: "React, Next.js, TypeScript, Node.js, MongoDB",
    experienceLevel: "Fresher / Entry-Level",
    location: "Kolkata, India",
    workMode: "Remote",
    employmentType: "Full-Time",
    salaryRange: "₹6L – ₹12L PA",
  });

  // ==========================================================================
  // STATE: 7. COMPANY PROFILE & SETTINGS
  // ==========================================================================
  const [companyProfile, setCompanyProfile] = useState({
    companyName: "",
    website: "",
    industry: "Software & Internet",
    companySize: "11-50 employees",
    headquarters: "Kolkata, India",
    about: "",
    isVerified: true,
  });

  // ==========================================================================
  // MODALS: CREATOR PROFILE, SHORTLIST CONTEXT, PROJECT-LINKED MESSAGE
  // ==========================================================================
  const [selectedCreatorModal, setSelectedCreatorModal] = useState<CreatorItem | null>(null);

  const [shortlistModalTarget, setShortlistModalTarget] = useState<{
    candidate: CreatorItem;
    project: ProjectItem | null;
  } | null>(null);
  const [shortlistReason, setShortlistReason] = useState("");
  const [shortlistStage, setShortlistStage] = useState<PipelineStage>("Shortlisted");

  const [contactModalTarget, setContactModalTarget] = useState<{
    candidate: CreatorItem;
    project: ProjectItem | null;
  } | null>(null);
  const [contactMessageText, setContactMessageText] = useState("");

  // ==========================================================================
  // AUTH & INITIAL DATA FETCHING
  // ==========================================================================
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/me`, {
        withCredentials: true,
      })
      .then((response) => {
        const data = response.data;

        if (data?.user) {
          setCurrentUser({
            _id: data.user._id,
            email: data.user.email,
            role: data.user.role,
            name:
              data.profile?.name ||
              data.user.name ||
              "Recruiter",
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const fetchDiscoverProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const params = new URLSearchParams();
      if (projectTechFilter) params.set("tech", projectTechFilter);
      if (projectCategoryFilter !== "All")
        params.set("category", projectCategoryFilter);
      if (projectSearch.trim()) params.set("search", projectSearch.trim());

      const res = await axios.get(
        `${API_BASE}/api/recruiter/discover-projects?${params.toString()}`,
        { withCredentials: true }
      );

      setDiscoverProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch discover projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, [projectTechFilter, projectCategoryFilter, projectSearch]);

  const fetchTalent = useCallback(async () => {
    setLoadingTalent(true);
    try {
      const params = new URLSearchParams();
      if (talentSearch.trim()) params.set("search", talentSearch.trim());
      if (talentSkill.trim()) params.set("skill", talentSkill.trim());
      if (talentExperience !== "All") params.set("experience", talentExperience);
      if (talentLocation.trim()) params.set("location", talentLocation.trim());
      if (talentOpenOnly) params.set("openToWork", "true");

      const res = await axios.get(
        `${API_BASE}/api/recruiter/talent?${params.toString()}`,
        { withCredentials: true }
      );

      setDevelopers(res.data.developers || []);
    } catch (err) {
      console.error("Failed to fetch talent:", err);
    } finally {
      setLoadingTalent(false);
    }
  }, [talentSearch, talentSkill, talentExperience, talentLocation, talentOpenOnly]);

  const fetchShortlist = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/recruiter/shortlist`,
        {
          withCredentials: true,
        }
      );

      setShortlist(res.data.shortlist || []);
    } catch (err) {
      console.error("Failed to fetch shortlist:", err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/messages/conversations`, {
      withCredentials: true,
    });

    setConversations(res.data.conversations || []);
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
  }
}, []);

  const fetchJobsAndApps = useCallback(async () => {
  try {
    const [jobsRes, appsRes] = await Promise.all([
      axios.get(`${API_BASE}/api/jobs?mine=true`, {
        withCredentials: true,
      }),
      axios.get(`${API_BASE}/api/recruiter/applications`, {
        withCredentials: true,
      }),
    ]);

    setJobs(jobsRes.data.jobs || []);
    setApplications(appsRes.data.applications || []);
  } catch (err) {
    console.error("Failed to fetch jobs and applications:", err);
  }
}, []);

  const fetchCompany = useCallback(async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/recruiter/company`, {
      withCredentials: true,
    });

    const data = res.data;
    if (data.company) {
      setCompanyProfile(data.company);
      setJobForm((prev) => ({
        ...prev,
        company: data.company.companyName || prev.company,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch company profile:", err);
  }
}, []);

  useEffect(() => {
    fetchDiscoverProjects();
  }, [fetchDiscoverProjects]);

  useEffect(() => {
    fetchTalent();
  }, [fetchTalent]);

  useEffect(() => {
    fetchShortlist();
    fetchConversations();
    fetchJobsAndApps();
    fetchCompany();
  }, [fetchShortlist, fetchConversations, fetchJobsAndApps, fetchCompany]);

  // Fetch active chat messages
 useEffect(() => {
  if (!activeConversation) return;

  axios
    .get(`${API_BASE}/api/${activeConversation.userId}`, {
      withCredentials: true,
    })
    .then((res) => res.data)
    .then((d) => {
      if (d?.messages) setChatMessages(d.messages);
    })
    .catch(() => {});
}, [activeConversation]);

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  // Open Shortlist Modal with Project Context preserved
  const openShortlistModal = (candidate: CreatorItem, project: ProjectItem | null) => {
    const targetProject = project || candidate.projects?.[0] || null;
    setShortlistModalTarget({ candidate, project: targetProject });
    setShortlistReason(
      targetProject
        ? `Strong execution on "${targetProject.title}" using ${targetProject.technologies.slice(0, 3).join(", ")}`
        : `Strong developer profile and project portfolio`
    );
    setShortlistStage("Shortlisted");
  };

 const handleConfirmShortlist = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!shortlistModalTarget) return;

  try {
    await axios.post(
      `${API_BASE}/api/recruiter/shortlist`,
      {
        candidateId: shortlistModalTarget.candidate.userId,
        projectId: shortlistModalTarget.project?._id,
        reason: shortlistReason,
        stage: shortlistStage,
      },
      {
        withCredentials: true,
      }
    );

    showToast(
      `${shortlistModalTarget.candidate.name} saved to Shortlist with project context!`
    );
    setShortlistModalTarget(null);
    fetchShortlist();
    fetchDiscoverProjects();
    fetchTalent();
  } catch (err) {
    console.error(err);
  }
};

  // Update Hiring Pipeline Stage
 const handleUpdateStage = async (shortlistId: string, newStage: PipelineStage) => {
  setShortlist((prev) =>
    prev.map((item) => (item._id === shortlistId ? { ...item, stage: newStage } : item))
  );
  try {
    await axios.patch(
      `${API_BASE}/api/recruiter/shortlist/${shortlistId}/stage`,
      { stage: newStage },
      { withCredentials: true }
    );
    showToast(`Candidate moved to ${newStage}`);
  } catch (err) {
    console.error(err);
  }
};

  const handleRemoveShortlist = async (shortlistId: string) => {
    setShortlist((prev) => prev.filter((item) => item._id !== shortlistId));
    try {
      await fetch(`${API_BASE}/api/recruiter/shortlist/${shortlistId}`, {
        method: "DELETE",
        credentials: "include",
      });
      showToast("Removed from shortlist");
    } catch (err) {
      console.error(err);
    }
  };

  // Open Project-Linked Contact Drawer
  const openContactModal = (candidate: CreatorItem, project: ProjectItem | null) => {
    const targetProject = project || candidate.projects?.[0] || null;
    setContactModalTarget({ candidate, project: targetProject });
    const firstName = candidate.name.split(" ")[0];
    if (targetProject) {
      setContactMessageText(
        `Hi ${firstName}, I discovered your project "${targetProject.title}" on BuildSpace and was impressed by your work with ${targetProject.technologies.slice(0, 3).join(", ")}. We are hiring and would love to discuss an opportunity with you!`
      );
    } else {
      setContactMessageText(
        `Hi ${firstName}, I reviewed your profile on BuildSpace and would love to connect regarding an open engineering role.`
      );
    }
  };

  const handleSendContextualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalTarget || !contactMessageText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId: contactModalTarget.candidate.userId,
          projectId: contactModalTarget.project?._id,
          message: contactMessageText.trim(),
        }),
      });

      if (res.ok) {
        // Automatically record in pipeline as "Contacted" with project preserved
        await fetch(`${API_BASE}/api/recruiter/shortlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            candidateId: contactModalTarget.candidate.userId,
            projectId: contactModalTarget.project?._id,
            reason: contactModalTarget.project
              ? `Contacted via project: ${contactModalTarget.project.title}`
              : "Direct recruiter message",
            stage: "Contacted",
          }),
        });

        showToast(
          `Project-linked message sent to ${contactModalTarget.candidate.name}!`
        );
        setContactModalTarget(null);
        fetchShortlist();
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInThreadMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`${API_BASE}/api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId: activeConversation.userId,
          projectId: attachedChatProject?._id,
          message: text,
        }),
      });
      if (res.ok) {
        setAttachedChatProject(null);
        const updatedRes = await fetch(
          `${API_BASE}/api/message/${activeConversation.userId}`,
          { credentials: "include" }
        );
        if (updatedRes.ok) {
          const d = await updatedRes.json();
          setChatMessages(d.messages || []);
        }
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = jobForm.requiredSkills
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
          requiredSkills: skills,
        }),
      });
      if (res.ok) {
        showToast("Job / Internship post published!");
        setShowCreateJobModal(false);
        setJobForm((prev) => ({ ...prev, title: "", description: "" }));
        fetchJobsAndApps();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Only verified recruiters can post jobs");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/company`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(companyProfile),
      });
      if (res.ok) {
        showToast("Company Profile & Settings updated!");
      }
    } catch (err) {
      console.error(err);
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

  const navItems: { id: NavSection; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: "discover", label: "Discover Projects", icon: Compass },
    { id: "talent", label: "Find Talent", icon: Users },
    { id: "shortlisted", label: "Shortlisted", icon: BookmarkCheck, badge: shortlist.length },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: conversations.length },
    { id: "jobs", label: "Jobs & Applications", icon: Briefcase, badge: jobs.length },
    { id: "pipeline", label: "Hiring Pipeline", icon: Kanban },
    { id: "company", label: "Company Profile & Settings", icon: Building2 },
  ];

  const filteredShortlist =
    statusFilter === "All"
      ? shortlist
      : shortlist.filter((s) => s.stage === statusFilter);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06080D] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* =====================================================================
          1. RECRUITER DASHBOARD SIDEBAR NAVIGATION
      ===================================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-68 shrink-0 flex-col justify-between border-r border-white/10 bg-[#080B12] p-5 transition-transform md:static md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <Link href="/explore" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">
                  Build<span className="text-emerald-400">Space</span>
                </span>
                <span className="block text-[10px] font-mono uppercase text-emerald-400">
                  ● Recruiter Workspace
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 7 Required Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${isActive
                    ? "bg-gradient-to-r from-emerald-600/25 to-cyan-600/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Workflow Differentiation Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3.5 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Project-First Workflow</span>
            </div>
            <p className="leading-relaxed">
              Discover Project → Evaluate Creator → Shortlist → Message → Interview → Hire.
            </p>
          </div>
        </div>

        {/* Recruiter Account Footer */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">
              {currentUser?.name || companyProfile.companyName || "Recruiter"}
            </div>
            <div className="truncate text-[11px] text-emerald-400">
              Verified Recruiter
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
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE CONTENT
      ===================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="flex items-center justify-between border-b border-white/10 bg-[#080B12] px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-white">
            BuildSpace Recruiter
          </span>
          <Link
            href="/explore"
            className="text-xs font-semibold text-emerald-400"
          >
            Reels View
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* =================================================================
              SECTION 2: DISCOVER PROJECTS (Default Recruiter Landing Page)
          ================================================================= */}
          {activeNav === "discover" && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">
                    Discover Projects
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluate developers through their live published builds, source code, and architecture.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/explore"
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                  >
                    Vertical Reels Mode
                  </Link>
                  <button
                    onClick={() => setActiveNav("shortlisted")}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    <BookmarkCheck className="h-4 w-4" />
                    <span>Shortlisted ({shortlist.length})</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar: Technology & Project Category */}
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search project title, description, or tech stack..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-10 pr-4 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                        setProjectTechFilter((prev) => (prev === tech ? "" : tech))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${projectTechFilter === tech
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                    >
                      {tech}
                    </button>
                  ))}

                  <select
                    value={projectCategoryFilter}
                    onChange={(e) => setProjectCategoryFilter(e.target.value)}
                    className="rounded-xl border border-white/15 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="Full-Stack">Full-Stack</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend & APIs">Backend & APIs</option>
                    <option value="AI & ML">AI & ML</option>
                    <option value="Realtime & Socket.IO">Realtime & Socket.IO</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Visually Engaging Project Cards */}
              {loadingProjects ? (
                <div className="py-16 text-center text-sm text-slate-400">
                  Loading published developer projects...
                </div>
              ) : discoverProjects.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center space-y-2">
                  <Compass className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">
                    No published projects match your filter.
                  </p>
                  <button
                    onClick={() => {
                      setProjectTechFilter("");
                      setProjectCategoryFilter("All");
                      setProjectSearch("");
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {discoverProjects.map((project) => {
                    const creator = project.creator!;
                    return (
                      <div
                        key={project._id}
                        className="flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-900/75 shadow-xl transition hover:border-emerald-500/40"
                      >
                        <div>
                          {/* Project Screenshot / Video Preview */}
                          <div className="relative h-56 w-full bg-slate-950 overflow-hidden">
                            {project.thumbnail?.endsWith(".mp4") ? (
                              <video
                                src={project.thumbnail}
                                muted
                                loop
                                playsInline
                                onMouseOver={(e) => e.currentTarget.play()}
                                onMouseOut={(e) => e.currentTarget.pause()}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                              <span className="rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                                {project.category}
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[11px] text-slate-200 backdrop-blur-md">
                                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                                {project.views} views
                              </span>
                            </div>
                          </div>

                          {/* Project & Creator Info */}
                          <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => setSelectedCreatorModal(creator)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                              >
                                <img
                                  src={creator.avatar}
                                  alt={creator.name}
                                  className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/40"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                                      {creator.name}
                                    </span>
                                    {creator.openToWork && (
                                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                        Open to Work
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {creator.experienceLevel} • {creator.location}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedCreatorModal(creator)}
                                className="text-xs font-semibold text-cyan-400 hover:underline"
                              >
                                View Creator Profile
                              </button>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-white leading-snug">
                                {project.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-300 leading-relaxed">
                                {project.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {project.technologies.map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 5 Action Buttons: Live Demo, GitHub Repo, View Creator Profile, Shortlist, Contact Creator */}
                        <div className="border-t border-white/10 bg-slate-950/60 p-4 space-y-2.5">
                          <div className="grid grid-cols-3 gap-2">
                            {project.liveDemoUrl ? (
                              <a
                                href={project.liveDemoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                                <span>Live Demo</span>
                              </a>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] py-2 text-xs text-slate-600">
                                No Demo
                              </span>
                            )}

                            {project.githubUrl ? (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                              >
                                <Code2 className="h-3.5 w-3.5" />
                                <span>GitHub Repo</span>
                              </a>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] py-2 text-xs text-slate-600">
                                No Repo
                              </span>
                            )}

                            <button
                              onClick={() => setSelectedCreatorModal(creator)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-violet-400" />
                              <span>Creator Profile</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openShortlistModal(creator, project)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${project.isShortlisted
                                ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                                : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                                }`}
                            >
                              <BookmarkCheck className="h-4 w-4" />
                              <span>
                                {project.isShortlisted ? "Shortlisted" : "Shortlist"}
                              </span>
                            </button>

                            <button
                              onClick={() => openContactModal(creator, project)}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Contact Creator</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SECTION 3: FIND TALENT (Supports Freshers & Project Portfolios)
          ================================================================= */}
          {activeNav === "talent" && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Find Talent</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Search developers by name, skills, experience level (including freshers without formal work history), location, and availability.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={talentSearch}
                    onChange={(e) => setTalentSearch(e.target.value)}
                    placeholder="Search developer name, username, headline..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-10 pr-3 text-xs text-white"
                  />
                </div>

                <input
                  type="text"
                  value={talentSkill}
                  onChange={(e) => setTalentSkill(e.target.value)}
                  placeholder="Skill (e.g. React, Node.js)"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
                />

                <select
                  value={talentExperience}
                  onChange={(e) => setTalentExperience(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="All">All Experience Levels</option>
                  <option value="Fresher / Entry-Level">Fresher / Entry-Level</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-3 Years">1-3 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>

                <input
                  type="text"
                  value={talentLocation}
                  onChange={(e) => setTalentLocation(e.target.value)}
                  placeholder="Location (e.g. Kolkata)"
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={talentOpenOnly}
                    onChange={(e) => setTalentOpenOnly(e.target.checked)}
                    className="rounded border-white/20 bg-slate-950"
                  />
                  <span>Available / Open to Work Only</span>
                </label>
                <span className="text-xs text-slate-400">
                  {developers.length} developers matched
                </span>
              </div>

              {loadingTalent ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Searching developer profiles...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {developers.map((dev) => (
                    <div
                      key={dev.userId}
                      className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-5 space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={dev.avatar}
                              alt={dev.name}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/40"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">
                                  {dev.name}
                                </h3>
                                <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                                  {dev.experienceLevel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{dev.headline}</p>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                                <MapPin className="h-3 w-3 text-cyan-400" />
                                <span>{dev.location}</span>
                                {dev.openToWork && (
                                  <span className="text-emerald-400 font-semibold">
                                    • Open to Work
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Developer Skills */}
                        <div className="flex flex-wrap gap-1.5">
                          {dev.skills.slice(0, 7).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-cyan-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Relevant Projects on Developer Profile Card */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            Relevant Projects ({dev.projects.length})
                          </div>
                          {dev.projects.slice(0, 2).map((proj) => (
                            <div
                              key={proj._id}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-2.5"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="truncate text-xs font-bold text-white">
                                  {proj.title}
                                </div>
                                <div className="truncate text-[11px] text-slate-400">
                                  {proj.technologies.join(" • ")}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {proj.liveDemoUrl && (
                                  <a
                                    href={proj.liveDemoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-white/5 p-1.5 text-cyan-400 hover:bg-white/10"
                                    title="Live Demo"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => openShortlistModal(dev, proj)}
                                  className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                                >
                                  Shortlist
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => setSelectedCreatorModal(dev)}
                          className="rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          Open Profile
                        </button>
                        <button
                          onClick={() =>
                            openShortlistModal(dev, dev.projects[0] || null)
                          }
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
                        >
                          {dev.isShortlisted
                            ? `In ${dev.shortlistStage}`
                            : "Shortlist"}
                        </button>
                        <button
                          onClick={() =>
                            openContactModal(dev, dev.projects[0] || null)
                          }
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-2 text-xs font-bold text-white"
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SECTION 4: SHORTLISTED CANDIDATES
          ================================================================= */}
          {activeNav === "shortlisted" && (
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">
                    Shortlisted Candidates
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Preserves the exact project that attracted you, your shortlisting reason, and current candidate status.
                  </p>
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {["All", ...PIPELINE_STAGES].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${statusFilter === st
                        ? "bg-emerald-600 text-white"
                        : "border border-white/10 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredShortlist.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center space-y-3">
                  <BookmarkCheck className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="text-sm text-slate-300">
                    No candidates in this shortlist view yet.
                  </p>
                  <button
                    onClick={() => setActiveNav("discover")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    Discover Projects
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShortlist.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/75 p-5 lg:flex-row lg:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={entry.candidate.avatar}
                          alt={entry.candidate.name}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/40"
                        />
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">
                              {entry.candidate.name}
                            </h3>
                            <span className="text-xs text-slate-400">
                              @{entry.candidate.username} •{" "}
                              {entry.candidate.experienceLevel}
                            </span>
                          </div>

                          {/* Preserved Project Context */}
                          {entry.project && (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                              <FolderGit2 className="h-3.5 w-3.5 text-cyan-400" />
                              <span>
                                Shortlisted via Project:{" "}
                                <strong>{entry.project.title}</strong>
                              </span>
                            </div>
                          )}

                          {/* Recorded Reason */}
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">Reason: </span>
                            {entry.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <select
                          value={entry.stage}
                          onChange={(e) =>
                            handleUpdateStage(
                              entry._id,
                              e.target.value as PipelineStage
                            )
                          }
                          className="rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs font-bold text-emerald-300"
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st} value={st}>
                              Status: {st}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setSelectedCreatorModal(entry.candidate)}
                          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          Profile
                        </button>

                        <button
                          onClick={() =>
                            openContactModal(entry.candidate, entry.project)
                          }
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Message</span>
                        </button>

                        <button
                          onClick={() => handleRemoveShortlist(entry._id)}
                          className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-rose-400"
                          title="Remove from Shortlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SECTION 5: PROJECT-LINKED MESSAGING
          ================================================================= */}
          {activeNav === "messages" && (
            <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
              {/* Left Conversations List */}
              <div className="w-80 border-r border-white/10 bg-[#080B12] flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <h2 className="text-base font-bold text-white">
                    Project-Linked Messages
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Every thread preserves the creator's project context
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No conversations yet. Click "Contact Creator" on any project card!
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => setActiveConversation(conv)}
                        className={`flex w-full items-center gap-3 border-b border-white/5 p-4 text-left transition hover:bg-white/5 ${activeConversation?.userId === conv.userId
                          ? "bg-white/5 border-l-2 border-l-emerald-500"
                          : ""
                          }`}
                      >
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-xs font-bold text-white">
                              {conv.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {conv.lastMessageTime}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-slate-400 mt-0.5">
                            {conv.lastMessage}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Chat History & Project Context */}
              <div className="flex-1 flex flex-col bg-[#05070B]">
                {!activeConversation ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Select a developer conversation on the left to view project-linked messages.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#080B12] p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeConversation.avatar}
                          alt={activeConversation.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {activeConversation.name}
                          </h3>
                          <span className="text-[11px] text-emerald-400">
                            ● Project Context Attached
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {chatMessages.map((m, idx) => {
                        const isMine =
                          currentUser && String(m.senderId) === String(currentUser._id);
                        return (
                          <div
                            key={m._id || idx}
                            className={`flex flex-col ${isMine ? "items-end" : "items-start"
                              } space-y-1.5`}
                          >
                            {/* Attached Project Banner inside Chat */}
                            {m.project && (
                              <div className="max-w-md rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex items-center justify-between gap-4">
                                <div>
                                  <div className="text-[10px] font-mono uppercase text-cyan-300">
                                    Referenced Project
                                  </div>
                                  <div className="text-xs font-bold text-white">
                                    {m.project.title}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {m.project.liveDemoUrl && (
                                    <a
                                      href={m.project.liveDemoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/20"
                                    >
                                      Demo
                                    </a>
                                  )}
                                  {m.project.githubUrl && (
                                    <a
                                      href={m.project.githubUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/20"
                                    >
                                      Repo
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            <div
                              className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed ${isMine
                                ? "bg-emerald-600 text-white"
                                : "border border-white/10 bg-slate-900 text-slate-100"
                                }`}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={handleSendInThreadMessage}
                      className="border-t border-white/10 bg-[#080B12] p-4 flex gap-2"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white"
                      >
                        Send
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 6: JOBS & APPLICATIONS
          ================================================================= */}
          {activeNav === "jobs" && (
            <div className="mx-auto max-w-6xl space-y-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">
                    Jobs & Applications
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Create job or internship posts and review candidate applications alongside their submitted projects.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateJobModal(true)}
                  className="flex items-center gap-2 self-start rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-3 text-xs font-bold text-white shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Job / Internship Post</span>
                </button>
              </div>

              {/* Published Jobs List */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {job.company} • {job.location} ({job.workMode})
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300">
                        {job.employmentType} • {job.experienceLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(job.requiredSkills || []).map((sk) => (
                        <span
                          key={sk}
                          className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-cyan-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">
                  Candidate Applications ({applications.length})
                </h2>
                {applications.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                    No direct applications yet. Proactively shortlist developers from the Discover Projects feed!
                  </div>
                ) : (
                  applications.map((app) => (
                    <div
                      key={app._id}
                      className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/75 p-5 lg:flex-row lg:items-center"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.candidate.avatar}
                            alt={app.candidate.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              {app.candidate.name}
                            </h4>
                            <p className="text-xs text-emerald-400">
                              Applied for: {app.job?.title || "Open Role"}
                            </p>
                          </div>
                        </div>
                        {app.project && (
                          <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                            <FolderGit2 className="h-3.5 w-3.5" />
                            <span>Attached Project: {app.project.title}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCreatorModal(app.candidate)}
                          className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white"
                        >
                          View Profile & Projects
                        </button>
                        <button
                          onClick={() =>
                            openContactModal(app.candidate, app.project)
                          }
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          Message Applicant
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 7: HIRING PIPELINE
              Stages: Applied → Shortlisted → Contacted → Interview → Hired / Rejected
          ================================================================= */}
          {activeNav === "pipeline" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-white">
                  Hiring Pipeline
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Track and move candidates across stages: Applied → Shortlisted → Contacted → Interview → Hired or Rejected.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {PIPELINE_STAGES.map((stage) => {
                  const stageItems = shortlist.filter((item) => item.stage === stage);
                  return (
                    <div
                      key={stage}
                      className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 min-h-[520px]"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                          {stage}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          {stageItems.length}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1">
                        {stageItems.map((entry) => (
                          <div
                            key={entry._id}
                            className="rounded-2xl border border-white/10 bg-slate-950 p-3 space-y-2.5 shadow-lg"
                          >
                            <div
                              onClick={() =>
                                setSelectedCreatorModal(entry.candidate)
                              }
                              className="flex items-center gap-2.5 cursor-pointer"
                            >
                              <img
                                src={entry.candidate.avatar}
                                alt={entry.candidate.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-bold text-white hover:text-emerald-300">
                                  {entry.candidate.name}
                                </div>
                                <div className="truncate text-[10px] text-slate-400">
                                  {entry.candidate.experienceLevel}
                                </div>
                              </div>
                            </div>

                            {entry.project && (
                              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-200 truncate">
                                Project: {entry.project.title}
                              </div>
                            )}

                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {entry.reason}
                            </p>

                            <select
                              value={entry.stage}
                              onChange={(e) =>
                                handleUpdateStage(
                                  entry._id,
                                  e.target.value as PipelineStage
                                )
                              }
                              className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-emerald-300"
                            >
                              {PIPELINE_STAGES.map((st) => (
                                <option key={st} value={st}>
                                  Move to: {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 8: COMPANY PROFILE & SETTINGS
          ================================================================= */}
          {activeNav === "company" && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-white">
                  Company Profile & Settings
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your company details and verification badge displayed on job posts and project outreach.
                </p>
              </div>

              <form
                onSubmit={handleSaveCompany}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified Recruiter Organization</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyProfile.companyName}
                      onChange={(e) =>
                        setCompanyProfile({
                          ...companyProfile,
                          companyName: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={companyProfile.website}
                      onChange={(e) =>
                        setCompanyProfile({
                          ...companyProfile,
                          website: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Headquarters
                    </label>
                    <input
                      type="text"
                      value={companyProfile.headquarters}
                      onChange={(e) =>
                        setCompanyProfile({
                          ...companyProfile,
                          headquarters: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company Size
                    </label>
                    <select
                      value={companyProfile.companySize}
                      onChange={(e) =>
                        setCompanyProfile({
                          ...companyProfile,
                          companySize: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                    >
                      <option value="1-10 employees">1-10 employees</option>
                      <option value="11-50 employees">11-50 employees</option>
                      <option value="51-200 employees">51-200 employees</option>
                      <option value="200+ employees">200+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    About Company & Engineering Culture
                  </label>
                  <textarea
                    rows={4}
                    value={companyProfile.about}
                    onChange={(e) =>
                      setCompanyProfile({
                        ...companyProfile,
                        about: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 text-xs font-bold text-white"
                >
                  Save Company Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL 1: VIEW CREATOR PROFILE & ALL SHIPPED PROJECTS
      ===================================================================== */}
      {selectedCreatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCreatorModal.avatar}
                  alt={selectedCreatorModal.name}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">
                      {selectedCreatorModal.name}
                    </h2>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {selectedCreatorModal.experienceLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedCreatorModal.headline}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedCreatorModal.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCreatorModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Skills Demonstrated Across Projects
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCreatorModal.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-cyan-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Published Projects ({selectedCreatorModal.projects.length})
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedCreatorModal.projects.map((proj) => (
                  <div
                    key={proj._id}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-3"
                  >
                    <div className="text-sm font-bold text-white">
                      {proj.title}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {proj.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {proj.technologies.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-cyan-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white hover:bg-white/10"
                        >
                          Live Demo
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white hover:bg-white/10"
                        >
                          GitHub
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const c = selectedCreatorModal;
                          setSelectedCreatorModal(null);
                          openShortlistModal(c, proj);
                        }}
                        className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white"
                      >
                        Shortlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SHORTLIST CANDIDATE WITH PROJECT CONTEXT & REASON
      ===================================================================== */}
      {shortlistModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                Shortlist {shortlistModalTarget.candidate.name}
              </h3>
              <button
                onClick={() => setShortlistModalTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shortlistModalTarget.project && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-300">
                  Preserved Project Context
                </div>
                <div className="text-xs font-bold text-white">
                  {shortlistModalTarget.project.title}
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmShortlist} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Shortlisting
                </label>
                <textarea
                  rows={3}
                  required
                  value={shortlistReason}
                  onChange={(e) => setShortlistReason(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hiring Pipeline Stage
                </label>
                <select
                  value={shortlistStage}
                  onChange={(e) =>
                    setShortlistStage(e.target.value as PipelineStage)
                  }
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-xs font-bold text-white"
              >
                Save to Shortlist & Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: PROJECT-LINKED CONTACT CREATOR DRAWER
      ===================================================================== */}
      {contactModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-white/15 bg-slate-900 p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={contactModalTarget.candidate.avatar}
                    alt={contactModalTarget.candidate.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Contact {contactModalTarget.candidate.name}
                    </h3>
                    <p className="text-xs text-emerald-400">
                      ● Project-Linked Message
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setContactModalTarget(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {contactModalTarget.project && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-cyan-300">
                    Attached Project Context
                  </div>
                  <div className="text-sm font-bold text-white">
                    {contactModalTarget.project.title}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendContextualMessage} className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Direct Message
              </label>
              <textarea
                rows={6}
                required
                value={contactMessageText}
                onChange={(e) => setContactMessageText(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-950 p-3.5 text-xs text-white"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-xs font-bold text-white"
              >
                <Send className="h-4 w-4" />
                <span>Send Message with Project Attached</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: CREATE JOB / INTERNSHIP POST
      ===================================================================== */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                Create Job or Internship Post
              </h3>
              <button
                onClick={() => setShowCreateJobModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, title: e.target.value })
                    }
                    placeholder="e.g. Frontend React Developer"
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, company: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={jobForm.experienceLevel}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        experienceLevel: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Fresher / Entry-Level">
                      Fresher / Entry-Level
                    </option>
                    <option value="0-1 Years">0-1 Years</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3+ Years">3+ Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Work Mode
                  </label>
                  <select
                    value={jobForm.workMode}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, workMode: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={jobForm.employmentType}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        employmentType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Salary / Stipend
                  </label>
                  <input
                    type="text"
                    value={jobForm.salaryRange}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, salaryRange: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.requiredSkills}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, requiredSkills: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={jobForm.description}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-xs font-bold text-white"
              >
                Publish Job Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}