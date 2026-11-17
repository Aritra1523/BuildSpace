"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Code2,
  Briefcase,
  Building2,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("role") === "recruiter" ? "recruiter" : "creator";

  const [role, setRole] = useState<"creator" | "recruiter">(initialRole);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [headline, setHeadline] = useState("");
  const [skillsInput, setSkillsInput] = useState("React, Next.js, TypeScript, Node.js");
  const [companyName, setCompanyName] = useState("");

  // NEW: Added Experience Level State
  const [experienceLevel, setExperienceLevel] = useState("Fresher / Entry-Level");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name,
      username: username || name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      email: email.trim(),
      password,
      role,
      headline:
        headline ||
        (role === "recruiter"
          ? `Talent Partner @ ${companyName || "Tech Company"}`
          : "Full-Stack Developer"),
      skills,
      experienceLevel, // NEW: Sending experience level to the backend!
      companyName: role === "recruiter" ? companyName : undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Stores HTTP-only auth cookies automatically
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Registration failed");
      }

      // Guaranteed hard redirect to the OTP verification page
      window.location.href = `/verify-email?email=${encodeURIComponent(
        email.trim()
      )}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not register account";
      setError(message || "Could not register account");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Build<span className="text-violet-400">Space</span>
          </span>
        </Link>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
          Step 1 of 2 • Register
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white">Create your BuildSpace account</h1>
      <p className="mt-1 text-xs text-slate-400">
        Showcase your projects or hire top engineering talent.
      </p>

      {/* Role Selector */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("creator")}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${role === "creator"
            ? "border-violet-500 bg-violet-500/15 text-white"
            : "border-white/10 bg-slate-950/60 text-slate-400 hover:text-white"
            }`}
        >
          <Code2 className="h-5 w-5 text-violet-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Creator / Builder</div>
            <div className="text-[10px] opacity-80">Upload & showcase projects</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRole("recruiter")}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${role === "recruiter"
            ? "border-cyan-500 bg-cyan-500/15 text-white"
            : "border-white/10 bg-slate-950/60 text-slate-400 hover:text-white"
            }`}
        >
          <Briefcase className="h-5 w-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Recruiter / HR</div>
            <div className="text-[10px] opacity-80">Discover & hire builders</div>
          </div>
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rohan Das"
              className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="rohan_builds"
              className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rohan@domain.com"
            className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* NEW: Experience Level Dropdown added for Creators */}
        {role === "creator" ? (
          <>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Full-Stack Developer"
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="Fresher / Entry-Level">Fresher / Entry-Level</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-3 Years">1-3 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Core Technologies (comma separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React, Node.js, MongoDB"
                className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Company Name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Cloud Systems"
                className="w-full rounded-xl border border-white/15 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Continue to Email Verification</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07090E] px-4 py-12 text-slate-100">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}