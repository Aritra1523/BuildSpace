"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface UserSession {
  _id: string;
  email: string;
  role: "creator" | "recruiter" | "admin";
  isVerified: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  headline?: string;
  skills?: string[];
  location?: string;
  openToWork?: boolean;
}

export function useAuth(redirectToLogin = false) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        credentials: "include", // Crucial: Sends the HTTP-only cookie automatically
      });

      if (res.status === 401) {
        setUser(null);
        setProfile(null);
        if (redirectToLogin) {
          router.push("/login");
        }
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to authenticate session");
      }

      const data = await res.json();
      setUser(data.user || null);
      setProfile(data.profile || null);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      // If user is registered but not email-verified, redirect them to verification
      if (data.user && data.user.isVerified === false) {
        router.push("/verify-email");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router, redirectToLogin]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, profile, devOtp, loading, error, refreshAuth: fetchUser };
}