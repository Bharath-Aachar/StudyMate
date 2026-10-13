"use client";

import { useState } from "react";

const courses = [
    {
        id: 1,
        title: "Machine Learning",
        description: "Learn ML concepts, algorithms, and applications.",
        progress: 35,
        lessons: 12,
        icon: "🤖",
    },
    {
        id: 2,
        title: "Python Programming",
        description: "Build strong Python programming foundations.",
        progress: 60,
        lessons: 16,
        icon: "🐍",
    },
    {
        id: 3,
        title: "Data Structures & Algorithms",
        description: "Understand algorithms and solve coding problems.",
        progress: 20,
        lessons: 20,
        icon: "🧩",
    },
];

export default function CoursesPage() {
    const [search, setSearch] = useState("");

    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#080b14] p-6 text-white sm:p-10">
            <div className="mx-auto max-w-6xl">
                <a href="/" className="text-sm text-blue-400">
                    ← Back to Dashboard
                </a>

                <header className="mb-8 mt-6">
                    <p className="text-sm text-blue-400">YOUR LEARNING SPACE</p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        My Courses
                    </h1>
                    <p className="mt-3 text-slate-400">
                        Continue learning, track progress, and explore your subjects.
                    </p>
                </header>

                <div className="mb-8 flex flex-wrap gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-slate-400">Total Courses</p>
                        <p className="mt-2 text-2xl font-bold">{courses.length}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-slate-400">Total Lessons</p>
                        <p className="mt-2 text-2xl font-bold">
                            {courses.reduce((sum, course) => sum + course.lessons, 0)}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search your courses..."
                        className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 outline-none focus:border-blue-500 sm:max-w-md"
                    />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                        <article
                            key={course.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/50"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-3xl">{course.icon}</span>
                                <span className="text-sm text-slate-400">
                                    {course.lessons} lessons
                                </span>
                            </div>

                            <h2 className="mt-5 text-xl font-semibold">
                                {course.title}
                            </h2>

                            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                                {course.description}
                            </p>

                            <div className="mt-5">
                                <div className="mb-2 flex justify-between text-sm">
                                    <span className="text-slate-400">Progress</span>
                                    <span>{course.progress}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{ width: `${course.progress}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    alert(`${course.title} workspace coming next!`)
                                }
                                className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500"
                            >
                                Open Course →
                            </button>
                        </article>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <p className="py-12 text-center text-slate-400">
                        No courses found. Try another search.
                    </p>
                )}
            </div>
        </main>
    );
}