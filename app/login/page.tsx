// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   ArrowRight,
//   Eye,
//   EyeOff,
//   LoaderCircle,
//   Mail,
//   LockKeyhole,
// } from "lucide-react";

// import { useAppDispatch, useAppSelector } from "@/redux/strore/hooks";
// import { loginUser } from "@/redux/slice/auth/authSlice";
// import { AuthShell } from "@/component/Auth/AuthShell";
// import { LoginFormData, loginSchema } from "@/shema/authSchema/LoginSchema/Login";


// export default function LoginPage() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);

//   const { status, error } = useAppSelector((state) => state.auth);
//   const loading = status === "loading";

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   const onSubmit = async (data: LoginFormData) => {
//     const result = await dispatch(
//       loginUser({
//         email: data.email.trim(),
//         password: data.password,
//       }),
//     );

//     if (loginUser.fulfilled.match(result)) {
//       router.push("/explore");
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10";

//   return (
//     <AuthShell mode="login">
//       <div className="rounded-3xl border border-white/10 bg-[#0c1019]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
//         <div className="mb-7">
//           <p className="text-sm font-semibold text-cyan-300">WELCOME BACK</p>
//           <h2 className="mt-2 text-3xl font-bold tracking-tight">
//             Log in to BuildSpace
//           </h2>
//           <p className="mt-2 text-sm leading-6 text-slate-400">
//             Pick up where you left off and keep building.
//           </p>
//         </div>

//         {error && (
//           <div
//             role="alert"
//             className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
//           >
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           {/* Email */}
//           <div>
//             <label
//               htmlFor="email"
//               className="mb-2 block text-sm font-medium text-slate-300"
//             >
//               Email address
//             </label>

//             <div className="relative">
//               <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

//               <input
//                 id="email"
//                 type="email"
//                 autoComplete="email"
//                 placeholder="you@example.com"
//                 aria-invalid={!!errors.email}
//                 {...register("email")}
//                 className={inputClass}
//               />
//             </div>

//             {errors.email && (
//               <p className="mt-1.5 text-xs text-rose-300">
//                 {errors.email.message}
//               </p>
//             )}
//           </div>

//           {/* Password */}
//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-medium text-slate-300"
//             >
//               Password
//             </label>

//             <div className="relative">
//               <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="current-password"
//                 placeholder="Enter your password"
//                 aria-invalid={!!errors.password}
//                 {...register("password")}
//                 className={`${inputClass} pr-12`}
//               />

//               <button
//                 type="button"
//                 onClick={() => setShowPassword((value) => !value)}
//                 aria-label={showPassword ? "Hide password" : "Show password"}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
//               >
//                 {showPassword ? (
//                   <EyeOff className="h-4 w-4" />
//                 ) : (
//                   <Eye className="h-4 w-4" />
//                 )}
//               </button>
//             </div>

//             {errors.password && (
//               <p className="mt-1.5 text-xs text-rose-300">
//                 {errors.password.message}
//               </p>
//             )}
//           </div>

//           {/* Submit */}
//           <button
//             disabled={loading}
//             type="submit"
//             className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}

//             {loading ? "Signing in..." : "Log in"}

//             {!loading && <ArrowRight className="h-4 w-4" />}
//           </button>
//         </form>

//         <div className="my-6 flex items-center gap-3 text-xs text-slate-600">
//           <span className="h-px flex-1 bg-white/10" />
//           YOUR NEXT CHAPTER STARTS HERE
//           <span className="h-px flex-1 bg-white/10" />
//         </div>

//         <p className="text-center text-xs leading-5 text-slate-500">
//           Your account session is managed with HTTP-only cookies.
//         </p>
//       </div>
//     </AuthShell>
//   );
// }


"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Code2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  getPostAuthRedirect,
  normalizeAuthPayload,
  UserRole,
} from "@/lib/auth-redirect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  // 1. Role Selection State (Clicking a role button ONLY changes this state)
  const [selectedRole, setSelectedRole] = useState<UserRole>("creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Form Submit Handler (Only runs when user clicks the Submit button)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole, // Send selected role to backend for verification
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Invalid email, password, or role"
        );
      }

      const { user, profile, token } = normalizeAuthPayload(
        data,
        email.trim(),
        selectedRole
      );

      // Strict frontend role check in case backend didn't reject a role mismatch
      if (data?.user?.role && data.user.role !== selectedRole) {
        throw new Error(
          `Access denied: This account is registered as a "${data.user.role}", not "${selectedRole}". Please select the "${data.user.role}" tab above.`
        );
      }

      if (token) localStorage.setItem("buildspace_token", token);
      localStorage.setItem("buildspace_user", JSON.stringify(user));
      localStorage.setItem("buildspace_profile", JSON.stringify(profile));

      const destination = getPostAuthRedirect({
        role: user.role,
        isNewUser: false,
        callbackUrl,
      });

      router.push(destination);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-600/25">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Build<span className="text-violet-400">Space</span>
          </span>
        </Link>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
          Role-Based Sign In
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white">Sign in to your account</h1>
      <p className="mt-1 text-xs text-slate-400">
        Select your role and enter your credentials to continue.
      </p>

      {/* =====================================================================
          ROLE SELECTOR TABS (Does NOT auto-login; only selects role)
      ===================================================================== */}
      <div className="mt-5 space-y-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          1. Select Your Account Role
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("creator");
              setError(null);
            }}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition ${
              selectedRole === "creator"
                ? "border-violet-500 bg-violet-500/20 text-white shadow-lg shadow-violet-600/20"
                : "border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
            }`}
          >
            {selectedRole === "creator" && (
              <CheckCircle2 className="absolute right-2 top-2 h-3.5 w-3.5 text-violet-400" />
            )}
            <Code2
              className={`h-5 w-5 ${
                selectedRole === "creator" ? "text-violet-400" : "text-slate-500"
              }`}
            />
            <span>Creator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("recruiter");
              setError(null);
            }}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition ${
              selectedRole === "recruiter"
                ? "border-cyan-500 bg-cyan-500/20 text-white shadow-lg shadow-cyan-600/20"
                : "border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
            }`}
          >
            {selectedRole === "recruiter" && (
              <CheckCircle2 className="absolute right-2 top-2 h-3.5 w-3.5 text-cyan-400" />
            )}
            <Briefcase
              className={`h-5 w-5 ${
                selectedRole === "recruiter" ? "text-cyan-400" : "text-slate-500"
              }`}
            />
            <span>Recruiter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setError(null);
            }}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition ${
              selectedRole === "admin"
                ? "border-emerald-500 bg-emerald-500/20 text-white shadow-lg shadow-emerald-600/20"
                : "border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
            }`}
          >
            {selectedRole === "admin" && (
              <CheckCircle2 className="absolute right-2 top-2 h-3.5 w-3.5 text-emerald-400" />
            )}
            <ShieldCheck
              className={`h-5 w-5 ${
                selectedRole === "admin" ? "text-emerald-400" : "text-slate-500"
              }`}
            />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================================
          CREDENTIALS FORM (Requires Manual Input + Submit)
      ===================================================================== */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            2. Email Address ({selectedRole})
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                selectedRole === "recruiter"
                  ? "recruiter@demo.dev"
                  : selectedRole === "admin"
                  ? "admin@demo.dev"
                  : "aritra@demo.dev"
              }
              className="w-full rounded-xl border border-white/15 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              3. Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/15 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
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
              <span className="capitalize">Sign In as {selectedRole}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?role=${selectedRole === "recruiter" ? "recruiter" : "creator"}`}
          className="font-semibold text-violet-400 hover:text-violet-300"
        >
          Register as a Creator or Recruiter
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07090E] px-4 py-12 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
      </div>
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}