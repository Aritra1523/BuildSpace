"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  MailCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getPostAuthRedirect, UserRole } from "@/lib/auth-redirect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryEmail = searchParams.get("email") || "";
  const queryToken = searchParams.get("token") || "";

  const [email, setEmail] = useState<string>(queryEmail);
  const [role, setRole] = useState<UserRole>("creator");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch session details from HTTP-only cookie via /api/auth/me
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (!queryEmail && data.user.email) setEmail(data.user.email);
          if (data.user.role) setRole(data.user.role);
          if (data.user.isVerified) {
            router.push(getPostAuthRedirect({ role: data.user.role, isNewUser: false }));
          }
        }
        if (data?.devOtp) {
          setDevOtpHint(String(data.devOtp));
        }
      })
      .catch(() => {});
  }, [queryEmail, router]);

  // Countdown timer for code resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle automatic link verification if ?token=... is present in URL
  useEffect(() => {
    if (queryToken && queryToken.length >= 6) {
      setOtpDigits(queryToken.slice(0, 6).split(""));
      verifyCode(queryToken, queryEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryToken]);

  const verifyCode = async (codeToVerify: string, targetEmail?: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: targetEmail || email,
          otp: codeToVerify,
          token: codeToVerify,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Invalid or expired verification code");
      }

      setVerifiedSuccess(true);
      const verifiedRole: UserRole = data?.user?.role || role;

      setTimeout(() => {
        router.push(getPostAuthRedirect({ role: verifiedRole, isNewUser: true }));
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9a-zA-Z]/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    setError(null);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\s+/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const combined = otpDigits.join("");
    if (combined.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    await verifyCode(combined, email);
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setResending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Could not resend verification code");
      }

      if (data?.verificationToken) {
        setDevOtpHint(String(data.verificationToken));
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">
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
          Step 2 of 2 • Verify Email
        </span>
      </div>

      {verifiedSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-xs text-slate-300">
            Redirecting you to the BuildSpace vertical project feed...
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
              <MailCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Verify your email</h1>
              <p className="text-xs text-slate-400">
                Code sent to{" "}
                <span className="font-semibold text-slate-200">
                  {email || "your email"}
                </span>
              </p>
            </div>
          </div>

          {devOtpHint && (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-amber-200">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  Dev Mode OTP: <strong className="font-mono">{devOtpHint}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtpDigits(devOtpHint.slice(0, 6).split(""))}
                className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Enter 6-Digit OTP
              </label>
              <div className="grid grid-cols-6 gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="h-12 w-full rounded-xl border border-white/15 bg-slate-950 text-center font-mono text-lg font-bold text-white focus:border-violet-500 focus:outline-none"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Verify & Enter Feed</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-1.5 font-semibold text-violet-400 hover:text-violet-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification code"}
              </span>
            </button>

            <Link
              href={getPostAuthRedirect({ role, isNewUser: true })}
              className="text-slate-400 hover:text-white"
            >
              Skip for now →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07090E] px-4 py-12 text-slate-100">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}