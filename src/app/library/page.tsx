
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

export default function LibraryPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState("");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("studymate-courses");
            setCourses(saved ? JSON.parse(saved) : []);
        } catch (error) {
            console.error("Could not load library:", error);
        } finally {
            setReady(true);
        }
    }, []);

    const filteredCourses = courses.filter((course) => {
        const query = search.toLowerCase().trim();

        return (
            course.title.toLowerCase().includes(query) ||
            course.filename.toLowerCase().includes(query) ||
            course.description.toLowerCase().includes(query)
        );
    });

    return (
        <main className="min-h-screen bg-[#080b14] p-5 text-white sm:p-10">
            <div className="mx-auto max-w-6xl">
                <a
                    href="/"
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    ← Dashboard
                </a>

                <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                            Your resources
                        </p>
                        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                            Study Library
                        </h1>
                        <p className="mt-3 text-slate-400">
                            All your PDF-based courses and learning materials in one place.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/courses")}
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                    >
                        + Add study material
                    </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">Total courses</p>
                        <p className="mt-2 text-3xl font-bold">{courses.length}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">Study lessons</p>
                        <p className="mt-2 text-3xl font-bold">
                            {courses.reduce(
                                (total, course) => total + course.lessons.length,
                                0
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">Completed courses</p>
                        <p className="mt-2 text-3xl font-bold">
                            {courses.filter((course) => course.progress === 100).length}
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search courses, PDFs, or descriptions..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                {!ready ? (
                    <p className="mt-8 text-slate-400">Loading your library...</p>
                ) : filteredCourses.length === 0 ? (
                    <section className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center">
                        <div className="text-4xl">📚</div>
                        <h2 className="mt-4 text-xl font-semibold">
                            {courses.length === 0
                                ? "Your library is empty"
                                : "No matching materials"}
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                            {courses.length === 0
                                ? "Upload a PDF and StudyMate will turn it into a personalized course with lessons and AI-powered study support."
                                : "Try a different search term to find your study materials."}
                        </p>

                        {courses.length === 0 && (
                            <button
                                onClick={() => router.push("/courses")}
                                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
                            >
                                Upload a PDF
                            </button>
                        )}
                    </section>
                ) : (
                    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <article
                                key={course.id}
                                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-blue-500/40"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl">
                                        PDF
                                    </div>
                                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                        {course.progress}% complete
                                    </span>
                                </div>

                                <h2 className="mt-5 text-lg font-bold">{course.title}</h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    {course.description}
                                </p>

                                <div className="mt-4 rounded-lg bg-black/20 p-3">
                                    <p className="truncate text-sm text-slate-300">
                                        {course.filename}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {course.lessons.length} lessons
                                    </p>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, course.progress))}%`,
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                    className="mt-5 w-full rounded-xl border border-blue-500/30 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
                                >
                                    Open course →
                                </button>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}
