"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, LogOut, Plus, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/customHooks/profile/useProfile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, loading } = useAuth(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include", // Clears the HTTP-only cookies on backend
      });
    } catch {}

    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Build<span className="text-violet-400">Space</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.role === "creator" && (
                <Link
                  href="/projects/new"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-600/30 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Upload Project</span>
                </Link>
              )}

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5">
                <img
                  src={profile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={profile?.name || "User"}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-white">
                  {profile?.name || user.email.split("@")[0]}
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-cyan-300">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}