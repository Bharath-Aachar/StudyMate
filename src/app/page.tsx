
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronRight,
  Library,
  Search,
  Settings,
  Target,
  CalendarDays,
  Clock3,
  ArrowUpRight,
  Play,
  FileText,
  CheckCircle2,
  Map,
  Plus,
} from "lucide-react";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { Sidebar } from "@/components/Sidebar";

type DashboardLesson = {
  title: string;
  summary: string;
  keyPoints: string[];
};

type DashboardCourse = {
  id: string;
  title: string;
  description: string;
  filename: string;
  documentText: string;
  lessons: DashboardLesson[];
  progress: number;
};

const quickLinks = [
  {
    title: "AI Tutor",
    description: "Ask questions about your study material",
    href: "/ai-tutor",
    icon: BrainCircuit,
  },
  {
    title: "My Courses",
    description: "Manage your generated courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    title: "Learning Map",
    description: "Explore your learning journey",
    href: "/learning-map",
    icon: Map,
  },
  {
    title: "Study Library",
    description: "Find your saved study materials",
    href: "/library",
    icon: Library,
  },
  {
    title: "Practice",
    description: "Strengthen your understanding",
    href: "/practice",
    icon: Target,
  },
  {
    title: "Settings",
    description: "Manage your study preferences",
    href: "/settings",
    icon: Settings,
  },
];

function AiOrb() {
  return (
    <div
      className="relative flex h-36 w-36 items-center justify-center"
      role="img"
      aria-label="Glowing StudyMate AI companion"
    >
      <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/30 blur-3xl" />

      <div className="absolute inset-3 rounded-full border border-cyan-300/40 shadow-[0_0_35px_rgba(34,211,238,0.25)]" />

      <div className="absolute inset-5 rounded-full border border-cyan-200/60 bg-gradient-to-br from-cyan-300/40 via-blue-600/70 to-indigo-950 shadow-[inset_0_0_30px_rgba(34,211,238,0.35),0_0_35px_rgba(59,130,246,0.4)]" />

      <div className="absolute left-10 top-9 h-8 w-14 rotate-[-35deg] rounded-full bg-white/20 blur-md" />

      <div className="relative mt-1 flex items-center gap-4">
        <span className="h-3 w-2.5 rounded-full bg-cyan-100 shadow-[0_0_12px_#67e8f9]" />
        <span className="h-3 w-2.5 rounded-full bg-cyan-100 shadow-[0_0_12px_#67e8f9]" />
      </div>

      <div className="absolute bottom-10 h-2 w-7 rounded-b-full border-b-2 border-cyan-200/90" />

      <span className="absolute right-5 top-7 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_#67e8f9]" />
      <span className="absolute bottom-7 left-6 h-1 w-1 rounded-full bg-blue-200" />
    </div>
  );
}

export default function Dashboard() {
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [completedByCourse, setCompletedByCourse] = useState<
    Record<string, number[]>
  >({});
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("studymate-courses");
      const parsed: DashboardCourse[] = saved ? JSON.parse(saved) : [];

      setCourses(parsed);

      const completionMap: Record<string, number[]> = {};

      for (const course of parsed) {
        const stored = localStorage.getItem(
          `studymate-completed-${course.id}`
        );

        completionMap[course.id] = stored ? JSON.parse(stored) : [];
      }

      setCompletedByCourse(completionMap);
    } catch (error) {
      console.error("Could not load StudyMate dashboard:", error);
    } finally {
      setReady(true);
    }
  }, []);

  const courseStats = useMemo(
    () =>
      courses.map((course) => {
        const completed = completedByCourse[course.id] ?? [];
        const total = course.lessons.length;

        const validCompleted = completed.filter(
          (index) =>
            Number.isInteger(index) && index >= 0 && index < total
        ).length;

        return {
          ...course,
          completedCount: validCompleted,
          totalLessons: total,
          actualProgress: total
            ? Math.round((validCompleted / total) * 100)
            : 0,
        };
      }),
    [courses, completedByCourse]
  );

  const totalLessons = courseStats.reduce(
    (total, course) => total + course.totalLessons,
    0
  );

  const completedCount = courseStats.reduce(
    (total, course) => total + course.completedCount,
    0
  );

  const overallProgress = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const activeCourse =
    courseStats.find((course) => course.actualProgress < 100) ??
    courseStats[0] ??
    null;

  const filteredCourses = courseStats.filter((course) => {
    const query = search.trim().toLowerCase();

    return (
      course.title.toLowerCase().includes(query) ||
      course.filename.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-[#080F1C] text-slate-100 md:flex">
      <Sidebar activeItem="Dashboard" />

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#080F1C]/85 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2.5 text-sm text-slate-400 md:max-w-md">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your courses..."
              aria-label="Search your courses"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
              <CalendarDays size={15} />
              Your learning space
            </span>

            <Link
              href="/settings"
              aria-label="Open settings"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Settings size={19} />
            </Link>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/30 bg-gradient-to-br from-blue-500/30 to-cyan-400/10 text-sm font-semibold text-blue-200">
              B
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-8 p-5 md:p-8 lg:p-10">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              YOUR PERSONAL LEARNING SPACE
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back, Bharath 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Let's keep building your knowledge today.
            </p>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            {/* Continue Learning */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#142B4B]/90 via-[#101D33]/95 to-[#0B1424] p-6 shadow-[0_0_40px_rgba(59,130,246,0.07)] transition md:p-8">
              <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative flex items-center gap-3">
                <div className="rounded-xl border border-blue-300/20 bg-blue-500/15 p-3 text-cyan-200">
                  <BookOpen size={25} />
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-blue-300">
                    CONTINUE LEARNING
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Pick up where you left off
                  </p>
                </div>
              </div>

              <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {!ready
                      ? "Loading your courses..."
                      : activeCourse
                        ? activeCourse.title
                        : "Start your learning journey"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {activeCourse
                      ? activeCourse.filename
                      : "Upload a PDF to create your first course"}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    {activeCourse
                      ? `${activeCourse.totalLessons} lessons · ${activeCourse.completedCount} completed`
                      : "Your next learning session starts here"}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500/10 text-blue-300 transition group-hover:scale-105">
                  <Play size={19} fill="currentColor" />
                </div>
              </div>

              <div className="relative mt-7">
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all"
                    style={{
                      width: `${activeCourse?.actualProgress ?? 0}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Course progress</span>
                  <span className="font-medium text-blue-300">
                    {activeCourse?.actualProgress ?? 0}%
                  </span>
                </div>
              </div>

              <Link
                href={
                  activeCourse
                    ? `/courses/${activeCourse.id}`
                    : "/courses"
                }
                className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
              >
                {activeCourse
                  ? "Continue learning"
                  : "Create your first course"}
                <ChevronRight size={17} />
              </Link>
            </div>

            {/* AI Companion card continues in Part 2 */}

            {/* AI Companion */}
            <div className="group relative flex min-h-[420px] flex-col items-center overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-b from-[#111F33] via-[#0D192B] to-[#080F1C] p-6 text-center shadow-[0_0_40px_rgba(34,211,238,0.05)] transition hover:border-cyan-300/30 md:p-7">
              <div className="pointer-events-none absolute -right-16 -top-12 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium tracking-wide text-emerald-300">
                  AI COMPANION
                </span>
              </div>

              <div className="relative my-4 transition duration-500 group-hover:scale-105">
                <AiOrb />
              </div>

              <div className="relative">
                <h2 className="text-xl font-semibold tracking-tight">
                  Your AI Study Companion
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
                  Your personal learning partner. Ask questions, understand
                  difficult concepts, and learn from your course material.
                </p>
              </div>

              <div className="relative mt-5 w-full rounded-xl border border-white/[0.08] bg-black/20 p-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  TRY ASKING
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  "Explain a difficult concept from my PDF."
                </p>
              </div>

              <Link
                href="/ai-tutor"
                className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_25px_rgba(59,130,246,0.2)] transition hover:from-blue-500 hover:to-indigo-500"
              >
                Ask your AI Companion
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </section>

          {/* Learning statistics */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                Your learning progress
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Based on your saved courses and completed lessons.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total courses",
                  value: ready ? String(courses.length) : "—",
                  icon: BookOpen,
                },
                {
                  label: "Total lessons",
                  value: ready ? String(totalLessons) : "—",
                  icon: FileText,
                },
                {
                  label: "Lessons completed",
                  value: ready ? String(completedCount) : "—",
                  icon: CheckCircle2,
                },
                {
                  label: "Overall progress",
                  value: ready ? `${overallProgress}%` : "—",
                  icon: ChartNoAxesCombined,
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#142136]/80 via-[#101B2D]/90 to-[#0B1423]/95 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <Icon size={19} className="text-blue-300" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Real courses */}
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Your courses
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Continue a course or explore your saved study materials.
                </p>
              </div>

              <Link
                href="/courses"
                className="flex items-center gap-1 text-sm text-blue-400 transition hover:text-cyan-300"
              >
                All courses <ChevronRight size={16} />
              </Link>
            </div>

            {!ready ? (
              <p className="text-sm text-slate-400">Loading courses...</p>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                <BookOpen size={32} className="mx-auto text-blue-300" />
                <h3 className="mt-4 font-semibold">
                  {courses.length === 0
                    ? "Your learning journey starts here"
                    : "No matching courses"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  {courses.length === 0
                    ? "Upload a PDF and turn your study material into a personalized course."
                    : "Try searching with another course title or PDF filename."}
                </p>

                {courses.length === 0 && (
                  <Link
                    href="/courses"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-400"
                  >
                    <Plus size={16} />
                    Create a course
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <article
                    key={course.id}
                    className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#142136]/80 via-[#101B2D]/90 to-[#0B1423]/95 p-5 transition hover:border-blue-400/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-500/10 text-blue-300">
                        <FileText size={21} />
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {course.actualProgress}% complete
                      </span>
                    </div>

                    <h3 className="mt-5 font-semibold">{course.title}</h3>
                    <p className="mt-2 truncate text-xs text-slate-500">
                      {course.filename}
                    </p>
                    <p className="mt-3 text-sm text-slate-400">
                      {course.completedCount} of {course.totalLessons} lessons
                      completed
                    </p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all"
                        style={{ width: `${course.actualProgress}%` }}
                      />
                    </div>

                    <Link
                      href={`/courses/${course.id}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-cyan-300"
                    >
                      {course.actualProgress === 100
                        ? "Review course"
                        : "Open course"}
                      <ChevronRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Quick navigation */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                Explore StudyMate
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Everything you need for your next study session.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 transition hover:border-blue-400/30 hover:bg-blue-500/[0.04]"
                  >
                    <div className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-3 text-blue-300 transition group-hover:bg-blue-500/20">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-5 text-slate-400">
                        {item.description}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-slate-500 transition group-hover:text-blue-300"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <ActivityHeatmap />

          <footer className="pb-3 pt-1 text-center text-xs text-slate-600">
            StudyMate · Learn smarter. Understand deeper.
          </footer>
        </div>
      </section>
    </main>
  );
}
