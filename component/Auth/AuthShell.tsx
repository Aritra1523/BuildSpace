import Link from "next/link";
import { Layers, ShieldCheck, Code2, Users } from "lucide-react";

export function AuthShell({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "login" | "register";
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090e] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
            <Layers className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Build<span className="text-violet-400">Space</span>
          </span>
        </Link>
        <span className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Secure account access
        </span>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="hidden space-y-8 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Project-first discovery & hiring
          </div>
          <h1 className="max-w-xl text-5xl font-extrabold leading-[1.1] tracking-tight xl:text-6xl">
            Your work deserves to be{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              discovered.
            </span>
          </h1>
          <p className="max-w-lg text-lg leading-8 text-slate-400">
            Share real projects, connect with builders, and help great
            opportunities find you.
          </p>
          <div className="grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Code2 className="mb-3 h-5 w-5 text-cyan-300" />
              <p className="font-semibold">Show your work</p>
              <p className="mt-1 text-sm text-slate-400">Projects over promises.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Users className="mb-3 h-5 w-5 text-violet-300" />
              <p className="font-semibold">Meet your people</p>
              <p className="mt-1 text-sm text-slate-400">Creators and recruiters.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          {children}
          <p className="mt-7 text-center text-xs text-slate-500">
            {mode === "login" ? "New to BuildSpace?" : "Already part of BuildSpace?"}{" "}
            <Link
              href={mode === "login" ? "/register" : "/login"}
              className="font-semibold text-violet-300 hover:text-violet-200"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
