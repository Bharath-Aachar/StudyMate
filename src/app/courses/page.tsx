
"use client";

import { useEffect, useRef, useState } from "react";
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

const STORAGE_KEY = "studymate-courses";

function readCourses(): Course[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export default function CoursesPage() {
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);

    const [search, setSearch] = useState("");
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [ready, setReady] = useState(false);

    // Load saved courses in the browser.
    // This avoids accessing localStorage during server rendering.
    useEffect(() => {
        setCourses(readCourses());
        setReady(true);
    }, []);

    // Load courses after the component mounts.
    const loadCourses = () => {
        const saved = readCourses();
        setCourses(saved);
        setReady(true);
    };

    async function handleUpload(file?: File) {
        if (!file) return;

        setError("");
        setMessage("");

        if (file.type !== "application/pdf") {
            setError("Please select a PDF file.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Your PDF must be smaller than 10 MB.");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || "PDF upload failed.");
            }

            if (typeof uploadData.text !== "string" || !uploadData.text.trim()) {
                throw new Error("No readable text was extracted from the PDF.");
            }

            setUploading(false);
            setGenerating(true);
            setMessage("PDF uploaded. Generating your personalized lessons...");

            const generationResponse = await fetch("/api/courses/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filename: uploadData.filename || file.name,
                    documentText: uploadData.text,
                }),
            });

            const generationData = await generationResponse.json();

            if (!generationResponse.ok) {
                throw new Error(
                    generationData.error || "Could not generate your lessons."
                );
            }

            const generated = generationData.course;

            if (!generated || !Array.isArray(generated.lessons)) {
                throw new Error("The generated course has an invalid format.");
            }

            const newCourse: Course = {
                id: crypto.randomUUID(),
                title: generated.title || file.name.replace(/\.pdf$/i, ""),
                description: generated.description || "Course generated from your PDF.",
                filename: uploadData.filename || file.name,
                documentText: uploadData.text.slice(0, 15000),
                lessons: generated.lessons,
                progress: 0,
            };

            const updatedCourses = [newCourse, ...readCourses()];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCourses));
            setCourses(updatedCourses);
            setMessage("Your course and lessons are ready!");

            router.push(`/courses/${newCourse.id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
            setMessage("");
        } finally {
            setUploading(false);
            setGenerating(false);

            if (fileInput.current) {
                fileInput.current.value = "";
            }
        }
    }

    // Initialize saved courses after first render.
    // The effect is imported below with the other React hooks.
    // See the useEffect implementation at the top of the component.

    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#080b14] p-6 text-white sm:p-10">
            <div className="mx-auto max-w-6xl">
                <a href="/" className="text-sm text-blue-400 hover:text-blue-300">
                    ← Back to Dashboard
                </a>

                <header className="mb-8 mt-6">
                    <p className="text-sm text-blue-400">YOUR LEARNING SPACE</p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        My Courses
                    </h1>
                    <p className="mt-3 text-slate-400">
                        Upload your study material and turn it into a personalized course.
                    </p>
                </header>

                <section className="mb-10 rounded-2xl border border-blue-400/20 bg-blue-500/[0.06] p-6 sm:p-8">
                    <div className="mb-5">
                        <p className="text-sm font-medium text-blue-400">
                            PDF-POWERED LEARNING
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold">
                            Create a course from your PDF
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            StudyMate extracts your document and uses AI to organize its
                            content into lessons and key concepts.
                        </p>
                    </div>

                    <input
                        ref={fileInput}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(event) => handleUpload(event.target.files?.[0])}
                    />

                    <button
                        type="button"
                        disabled={uploading || generating}
                        onClick={() => fileInput.current?.click()}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {uploading
                            ? "Uploading PDF..."
                            : generating
                                ? "Generating lessons..."
                                : "↑ Upload PDF & Create Course"}
                    </button>

                    <p className="mt-3 text-xs text-slate-500">
                        PDF only · Maximum file size 10 MB
                    </p>

                    {message && (
                        <p role="status" className="mt-4 text-sm text-emerald-400">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </section>

                <section>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Your learning library</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Courses created from your uploaded study material.
                            </p>
                        </div>

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search courses..."
                            aria-label="Search courses"
                            className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
                        />
                    </div>

                    {!ready && (
                        <p className="py-8 text-sm text-slate-400">
                            Loading your courses...
                        </p>
                    )}

                    {ready && filteredCourses.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                            <p className="text-slate-300">
                                {search
                                    ? "No courses match your search."
                                    : "You haven't created a course yet."}
                            </p>
                            {!search && (
                                <p className="mt-2 text-sm text-slate-500">
                                    Upload a PDF above to generate your first course.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <article
                                key={course.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-3xl">📘</span>
                                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                                        {course.lessons.length} lessons
                                    </span>
                                </div>

                                <h3 className="mt-5 text-xl font-semibold">{course.title}</h3>

                                <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-slate-400">
                                    {course.description}
                                </p>

                                <p className="mt-3 truncate text-xs text-slate-500">
                                    {course.filename}
                                </p>

                                <div className="mt-5">
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span className="text-slate-400">Progress</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                    className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500"
                                >
                                    Open Course →
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
