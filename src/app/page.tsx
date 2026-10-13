
"use client";

import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  House,
  Library,
  Search,
  Settings,
  Sparkles,
  Target,
  Bell,
  CalendarDays,
  Clock3,
  Flame,
  ArrowUpRight,
  Play,
} from "lucide-react";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { Sidebar } from "@/components/Sidebar";

const subjects = [
  { name: "Calculus", topic: "Chain Rule", mastery: 43, color: "rose" },
  {
    name: "Machine Learning",
    topic: "Gradient Descent",
    mastery: 71,
    color: "cyan",
  },
  { name: "Python", topic: "Functions", mastery: 89, color: "blue" },
];

const navigation = [
  { name: "Dashboard", icon: House, href: "/" },
  { name: "My Courses", icon: BookOpen, href: "/courses" },
  { name: "AI Tutor", icon: BrainCircuit, href: "/ai-tutor" },
  { name: "Practice", icon: Target, href: "/practice" },
  {
    name: "Learning Map",
    icon: ChartNoAxesCombined,
    href: "/learning-map",
  },
  { name: "Library", icon: Library, href: "/library" },
];

function AiOrb() {
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center"
      role="img"
      aria-label="Glowing AI companion"
    >
      <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/30 blur-2xl" />

      <div className="absolute inset-1 rounded-full border border-cyan-300/60 bg-gradient-to-br from-cyan-300/30 via-blue-600/50 to-indigo-950 shadow-[0_0_35px_rgba(59,130,246,0.4)]" />

      <div className="absolute inset-3 rounded-full border border-blue-300/50 bg-[#09152B]/90 shadow-[inset_0_0_20px_rgba(34,211,238,0.3)]" />

      <div className="relative flex items-center gap-2">
        <span className="h-2.5 w-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#22D3EE]" />
        <span className="h-2.5 w-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#22D3EE]" />
      </div>

      <div className="absolute bottom-5 h-1 w-5 rounded-full bg-blue-300 blur-[1px]" />
    </div>
  );
}

function MasteryRing({
  mastery,
  color,
}: {
  mastery: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    rose: "#FB7185",
    cyan: "#2DD4BF",
    blue: "#38BDF8",
  };

  const stroke = colors[color] ?? colors.blue;

  return (
    <div
      className="group/ring relative flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105"
      style={{
        background: `conic-gradient(${stroke} ${mastery * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
        boxShadow: `0 0 22px ${stroke}20`,
      }}
      aria-label={`${mastery}% mastery`}
    >
      <div className="absolute inset-[5px] rounded-full border border-white/[0.08] bg-[#0D1728]" />

      <div
        className="absolute inset-0 rounded-full opacity-30 blur-md"
        style={{
          background: `conic-gradient(${stroke} ${mastery * 3.6}deg, transparent 0deg)`,
        }}
      />

      <div className="relative text-center">
        <span className="text-lg font-semibold tracking-tight text-white">
          {mastery}%
        </span>
        <p className="text-[9px] uppercase tracking-wider text-slate-500">
          Mastery
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#080F1C] text-slate-100 md:flex">
      {/* Sidebar Navigation */}
      <Sidebar activeItem="Dashboard" />

      {/* Main content */}
      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#080F1C]/85 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2.5 text-sm text-slate-500 focus-within:border-blue-400/40 md:w-80">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search anything..."
              aria-label="Search anything"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
            <span className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] md:inline">
              Ctrl K
            </span>
          </div>

          <div className="ml-3 flex items-center gap-3 md:gap-5">
            <span className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
              <CalendarDays size={15} />
              Your learning space
            </span>

            <button
              type="button"
              aria-label="Notifications"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Bell size={19} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/30 bg-gradient-to-br from-blue-500/30 to-cyan-400/10 text-sm font-semibold text-blue-200">
              B
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-8 p-5 md:p-8 lg:p-10">
          {/* Greeting */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              YOUR PERSONAL LEARNING SPACE
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Good morning, Bharath. <span>👋</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Let&apos;s keep building your knowledge today.
            </p>
          </section>

          {/* Featured cards */}
          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            {/* Continue learning */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#142B4B]/90 via-[#101D33]/95 to-[#0B1424] p-6 shadow-[0_0_40px_rgba(59,130,246,0.07)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-400/35 hover:shadow-[0_0_45px_rgba(59,130,246,0.12)] md:p-8">
              <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl transition group-hover:bg-blue-500/15" />

              <div className="relative flex items-center gap-3">
                <div className="rounded-xl border border-blue-300/20 bg-blue-500/15 p-3 text-cyan-200">
                  <BookOpen size={25} />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-blue-300">
                    CONTINUE LEARNING
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Pick up where you left off
                  </p>
                </div>
              </div>

              <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Gradient Descent
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Machine Learning
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    12-minute session
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500/10 text-blue-300 transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]">
                  <Play size={19} fill="currentColor" />
                </div>
              </div>

              <div className="relative mt-7">
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full w-[43%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Course progress</span>
                  <span className="font-medium text-blue-300">43%</span>
                </div>
              </div>

              <button
                type="button"
                className="relative mt-6 flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white shadow-[0_4px_20px_rgba(59,130,246,0.2)] transition hover:bg-blue-400"
              >
                Continue learning
                <ChevronRight size={17} />
              </button>
            </div>

            {/* AI Companion */}
            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#111F33]/90 via-[#0D192B]/90 to-[#0A1423] p-6 shadow-[0_0_35px_rgba(34,211,238,0.04)] backdrop-blur-2xl transition duration-300 hover:border-cyan-300/25 md:p-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/[0.06] blur-3xl" />

              <div className="relative flex items-center gap-4">
                <AiOrb />
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Your AI Companion
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Ready to help you learn
                  </p>
                </div>
              </div>

              <p className="relative mt-5 text-sm leading-6 text-slate-400">
                Stuck on a concept? Explore explanations, review your notes,
                and build your understanding one question at a time.
              </p>

              <div className="relative mt-5 rounded-xl border border-white/[0.08] bg-black/15 p-3">
                <p className="text-xs text-slate-500">Try asking</p>
                <p className="mt-1 text-sm text-slate-300">
                  &quot;Explain gradient descent simply&quot;
                </p>
              </div>

              <Link
                href="/ai-tutor"
                className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-200 transition hover:border-blue-400/40 hover:bg-blue-500/20"
              >
                Explore AI Tutor
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>

          {/* Learning progress */}
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Your learning progress
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  Example mastery levels for the interface preview
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-sm text-blue-400 transition hover:text-cyan-300"
              >
                View all
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {subjects.map((subject) => (
                <article
                  key={subject.name}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#142136]/80 via-[#101B2D]/90 to-[#0B1423]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_8px_35px_rgba(37,99,235,0.10)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold tracking-tight">
                        {subject.name}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {subject.topic}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={`About ${subject.name}`}
                      className="rounded-lg p-1 text-slate-600 transition hover:bg-white/5 hover:text-slate-300"
                    >
                      <CircleHelp size={18} />
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Current mastery
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {subject.mastery >= 80
                          ? "Strong progress"
                          : subject.mastery >= 60
                            ? "Making progress"
                            : "Needs practice"}
                      </p>
                    </div>

                    <MasteryRing
                      mastery={subject.mastery}
                      color={subject.color}
                    />
                  </div>

                  <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        subject.color === "rose"
                          ? "bg-rose-400"
                          : subject.color === "cyan"
                            ? "bg-teal-300"
                            : "bg-sky-400"
                      }`}
                      style={{ width: `${subject.mastery}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Next step */}
          <section className="rounded-2xl border border-white/[0.09] bg-gradient-to-r from-[#111F33]/90 to-[#0C1728]/90 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-300">
                <Target size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">Your next step</h3>
                  <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2 py-0.5 text-[10px] font-medium text-amber-200">
                    Suggested
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">
                  Review the Chain Rule before your next calculus quiz.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Flame size={15} className="text-orange-300" />
                Build your momentum
              </div>
            </div>
          </section>

          {/* GitHub-Style Learning Activity Heatmap */}
          <ActivityHeatmap />

          <footer className="pb-3 pt-1 text-center text-xs text-slate-600">
            StudyMate · Learn smarter. Understand deeper.
          </footer>
        </div>
      </section>
    </main>
  );
}
