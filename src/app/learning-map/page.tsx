
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lesson = {
    title: string;
    summary: string;
    keyPoints: string[];
};

type Course = {
    id: string;
    title: string;
    description: string;
    filename: string;
    documentText: string;
    lessons: Lesson[];
    progress: number;
};

export default function LearningMapPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [completedByCourse, setCompletedByCourse] = useState<
        Record<string, number[]>
    >({});
    const [ready, setReady] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("studymate-courses");
            const parsed: Course[] = saved ? JSON.parse(saved) : [];
            setCourses(parsed);

            const completionMap: Record<string, number[]> = {};

            for (const course of parsed) {
                const completed = localStorage.getItem(
                    `studymate-completed-${course.id}`
                );

                completionMap[course.id] = completed
                    ? JSON.parse(completed)
                    : [];
            }

            setCompletedByCourse(completionMap);
        } catch (error) {
            console.error("Could not load learning map:", error);
            setCourses([]);
        } finally {
            setReady(true);
        }
    }, []);

    const totalLessons = courses.reduce(
        (sum, course) => sum + course.lessons.length,
        0
    );

    const totalCompleted = courses.reduce(
        (sum, course) =>
            sum + (completedByCourse[course.id]?.length ?? 0),
        0
    );

    const overallProgress = totalLessons
        ? Math.round((totalCompleted / totalLessons) * 100)
        : 0;

    return (
        <main className="min-h-screen bg-[#080b14] p-5 text-white sm:p-10">
            <div className="mx-auto max-w-6xl">
                <a
                    href="/"
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    ← Dashboard
                </a>

                <div className="mt-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                        Your learning journey
                    </p>
                    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Learning Map
                    </h1>
                    <p className="mt-3 max-w-2xl text-slate-400">
                        Follow your courses, complete lessons, and see how far
                        you have progressed.
                    </p>
                </div>

                <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-400">Overall progress</p>
                            <p className="mt-2 text-4xl font-bold">{overallProgress}%</p>
                        </div>
                        <p className="text-sm text-slate-400">
                            {totalCompleted} of {totalLessons} lessons completed
                        </p>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </section>

                {!ready ? (
                    <p className="mt-8 text-slate-400">Loading your learning map...</p>
                ) : courses.length === 0 ? (
                    <section className="mt-8 rounded-2xl border border-dashed border-white/15 p-8 text-center">
                        <h2 className="text-xl font-semibold">Your map is waiting</h2>
                        <p className="mt-3 text-sm text-slate-400">
                            Upload a study PDF to generate your first course and learning path.
                        </p>
                        <button
                            onClick={() => router.push("/courses")}
                            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
                        >
                            Create your first course
                        </button>
                    </section>
                ) : (
                    <div className="mt-8 space-y-8">
                        {courses.map((course) => {
                            const completed = completedByCourse[course.id] ?? [];
                            const lessonCount = course.lessons.length;
                            const progress = lessonCount
                                ? Math.round((completed.length / lessonCount) * 100)
                                : 0;

                            const currentIndex = course.lessons.findIndex(
                                (_, index) => !completed.includes(index)
                            );

                            return (
                                <section
                                    key={course.id}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h2 className="text-xl font-bold">{course.title}</h2>
                                            <p className="mt-2 text-sm text-slate-400">
                                                {lessonCount} lessons · {completed.length} completed
                                            </p>
                                        </div>

                                        <span className="rounded-full border border-blue-500/30 px-3 py-1 text-sm text-blue-300">
                                            {progress}%
                                        </span>
                                    </div>

                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="mt-7 space-y-0">
                                        {course.lessons.map((lesson, index) => {
                                            const isComplete = completed.includes(index);
                                            const isCurrent =
                                                !isComplete && index === currentIndex;

                                            return (
                                                <div key={`${lesson.title}-${index}`}>
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <button
                                                                onClick={() =>
                                                                    router.push(`/courses/${course.id}`)
                                                                }
                                                                aria-label={`Open lesson ${index + 1}: ${lesson.title}`}
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${isComplete
                                                                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                                                                        : isCurrent
                                                                            ? "border-blue-400 bg-blue-500/20 text-blue-300 ring-4 ring-blue-500/10"
                                                                            : "border-white/15 bg-white/5 text-slate-400 hover:border-blue-400"
                                                                    }`}
                                                            >
                                                                {isComplete ? "✓" : index + 1}
                                                            </button>

                                                            {index < lessonCount - 1 && (
                                                                <div className="my-1 min-h-6 w-px flex-1 bg-white/10" />
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                router.push(`/courses/${course.id}`)
                                                            }
                                                            className="mb-5 min-w-0 flex-1 rounded-xl border border-white/5 p-3 text-left hover:border-blue-500/30 hover:bg-white/[0.03]"
                                                        >
                                                            <p className="font-medium">{lesson.title}</p>
                                                            <p className="mt-1 text-sm text-slate-400">
                                                                {isComplete
                                                                    ? "Completed"
                                                                    : isCurrent
                                                                        ? "Up next · Continue learning"
                                                                        : "Upcoming lesson"}
                                                            </p>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                        className="mt-2 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 sm:w-auto"
                                    >
                                        {progress === 100
                                            ? "Review course"
                                            : completed.length
                                                ? "Continue learning"
                                                : "Start learning"}
                                    </button>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
