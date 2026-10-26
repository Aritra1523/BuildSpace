// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   ArrowRight,
//   Eye,
//   EyeOff,
//   LoaderCircle,
//   UserRound,
//   Mail,
//   LockKeyhole,
// } from "lucide-react";

// import { useAppDispatch, useAppSelector } from "@/redux/strore/hooks";
// import { registerUser } from "@/redux/slice/auth/authSlice";
// import { AuthShell } from "@/component/Auth/AuthShell";
// import {
//   RegisterFormData,
//   registerSchema,
// } from "@/shema/authSchema/RegisterSchema/RegisterSchema";

// export default function RegisterPage() {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);

//   const { status, error } = useAppSelector((state) => state.auth);
//   const loading = status === "loading";

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     formState: { errors },
//   } = useForm<RegisterFormData>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       password: "",
//       role: "creator",
//     },
//   });

//   const selectedRole = watch("role");

//   const onSubmit = async (data: RegisterFormData) => {
//     const result = await dispatch(
//       registerUser({
//         name: data.name.trim(),
//         email: data.email.trim(),
//         password: data.password,
//         role: data.role,
//       }),
//     );

//     if (registerUser.fulfilled.match(result)) {
//       router.push("/explore");
//     }
//   };

//   const inputClass =
//     "w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10";

//   return (
//     <AuthShell mode="register">
//       <div className="rounded-3xl border border-white/10 bg-[#0c1019]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
//         <div className="mb-7">
//           <p className="text-sm font-semibold text-violet-300">
//             GET STARTED FOR FREE
//           </p>

//           <h2 className="mt-2 text-3xl font-bold tracking-tight">
//             Create your account
//           </h2>

//           <p className="mt-2 text-sm leading-6 text-slate-400">
//             Build your profile and put your projects in the spotlight.
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
//           {/* Full name */}
//           <div>
//             <label
//               htmlFor="name"
//               className="mb-2 block text-sm font-medium text-slate-300"
//             >
//               Full name
//             </label>

//             <div className="relative">
//               <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

//               <input
//                 id="name"
//                 autoComplete="name"
//                 placeholder="Your full name"
//                 aria-invalid={!!errors.name}
//                 {...register("name")}
//                 className={inputClass}
//               />
//             </div>

//             {errors.name && (
//               <p className="mt-1.5 text-xs text-rose-300">
//                 {errors.name.message}
//               </p>
//             )}
//           </div>

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

//           {/* Role selection */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-slate-300">
//               I’m joining as
//             </label>

//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 type="button"
//                 aria-pressed={selectedRole === "creator"}
//                 onClick={() =>
//                   setValue("role", "creator", {
//                     shouldValidate: true,
//                     shouldDirty: true,
//                   })
//                 }
//                 className={`rounded-xl border p-3 text-left transition ${
//                   selectedRole === "creator"
//                     ? "border-violet-400/60 bg-violet-500/10"
//                     : "border-white/10 bg-black/20 hover:bg-white/5"
//                 }`}
//               >
//                 <span className="block text-sm font-semibold">Creator</span>
//                 <span className="mt-1 block text-xs text-slate-400">
//                   Share projects
//                 </span>
//               </button>

//               <button
//                 type="button"
//                 aria-pressed={selectedRole === "recruiter"}
//                 onClick={() =>
//                   setValue("role", "recruiter", {
//                     shouldValidate: true,
//                     shouldDirty: true,
//                   })
//                 }
//                 className={`rounded-xl border p-3 text-left transition ${
//                   selectedRole === "recruiter"
//                     ? "border-cyan-400/60 bg-cyan-500/10"
//                     : "border-white/10 bg-black/20 hover:bg-white/5"
//                 }`}
//               >
//                 <span className="block text-sm font-semibold">Recruiter</span>
//                 <span className="mt-1 block text-xs text-slate-400">
//                   Discover talent
//                 </span>
//               </button>
//             </div>

//             {errors.role && (
//               <p className="mt-1.5 text-xs text-rose-300">
//                 {errors.role.message}
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
//                 autoComplete="new-password"
//                 placeholder="At least 8 characters"
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

//           <p className="text-xs leading-5 text-slate-500">
//             By continuing, you agree to use BuildSpace respectfully and keep
//             your account details secure.
//           </p>

//           <button
//             disabled={loading}
//             type="submit"
//             className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}

//             {loading ? "Creating account..." : "Create account"}

//             {!loading && <ArrowRight className="h-4 w-4" />}
//           </button>
//         </form>

//         <div className="my-6 flex items-center gap-3 text-xs text-slate-600">
//           <span className="h-px flex-1 bg-white/10" />
//           SECURE BY DESIGN
//           <span className="h-px flex-1 bg-white/10" />
//         </div>

//         <p className="text-center text-xs leading-5 text-slate-500">
//           Your session is handled by secure HTTP-only cookies.
//         </p>
//       </div>
//     </AuthShell>
//   );
// }


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
    } catch (err: any) {
      setError(err.message || "Could not register account");
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
          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
            role === "creator"
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
          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
            role === "recruiter"
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

        {role === "creator" ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Full-Stack MERN & Next.js Developer"
                className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Core Technologies (comma separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
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