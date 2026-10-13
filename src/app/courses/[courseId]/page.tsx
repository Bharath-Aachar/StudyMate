
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

export default function CourseWorkspacePage() {
    const params = useParams<{ courseId: string }>();
    const router = useRouter();

    const [course, setCourse] = useState<Course | null>(null);
    const [lessonIndex, setLessonIndex] = useState(0);
    const [completed, setCompleted] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const courses: Course[] = saved ? JSON.parse(saved) : [];
            const selected = courses.find((item) => item.id === params.courseId);

            if (selected) {
                setCourse(selected);

                const savedCompleted = localStorage.getItem(
                    `studymate-completed-${selected.id}`
                );

                if (savedCompleted) {
                    setCompleted(JSON.parse(savedCompleted));
                }
            }
        } catch (error) {
            console.error("Could not load course:", error);
        } finally {
            setLoading(false);
        }
    }, [params.courseId]);

    function markComplete() {
        if (!course) return;

        const updated = completed.includes(lessonIndex)
            ? completed
            : [...completed, lessonIndex];

        setCompleted(updated);
        localStorage.setItem(
            `studymate-completed-${course.id}`,
            JSON.stringify(updated)
        );

        const progress = Math.round(
            (updated.length / course.lessons.length) * 100
        );

        const saved = localStorage.getItem(STORAGE_KEY);
        const courses: Course[] = saved ? JSON.parse(saved) : [];

        const updatedCourses = courses.map((item) =>
            item.id === course.id ? { ...item, progress } : item
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCourses));
        setCourse({ ...course, progress });
    }

    function askTutor() {
        if (!course) return;

        sessionStorage.setItem(
            "studymate-active-document",
            JSON.stringify({
                filename: course.filename,
                documentText: course.documentText,
                lesson: course.lessons[lessonIndex]?.title ?? course.title,
            })
        );

        router.push("/ai-tutor");
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#080b14] p-8 text-white">
                Loading course...
            </main>
        );
    }

    if (!course) {
        return (
            <main className="min-h-screen bg-[#080b14] p-8 text-white">
                <h1 className="text-2xl font-bold">Course not found</h1>
                <p className="mt-3 text-slate-400">
                    This course may have been removed or created in another browser.
                </p>
                <button
                    onClick={() => router.push("/courses")}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3"
                >
                    Back to My Courses
                </button>
            </main>
        );
    }

    const lesson = course.lessons[lessonIndex];
    const isComplete = completed.includes(lessonIndex);

    return (
        <main className="min-h-screen bg-[#080b14] text-white">
            <header className="border-b border-white/10 px-5 py-4 sm:px-8">
                <button
                    onClick={() => router.push("/courses")}
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    ← My Courses
                </button>

                <h1 className="mt-3 text-2xl font-bold">{course.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{course.filename}</p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${course.progress}%` }}
                    />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                    {course.progress}% course progress · {completed.length} of{" "}
                    {course.lessons.length} lessons completed
                </p>
            </header>

            <div className="mx-auto grid max-w-7xl gap-6 p-5 sm:p-8 lg:grid-cols-[280px_1fr]">
                <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h2 className="mb-4 font-semibold">Course lessons</h2>

                    <div className="space-y-2">
                        {course.lessons.map((item, index) => (
                            <button
                                key={`${item.title}-${index}`}
                                onClick={() => setLessonIndex(index)}
                                className={`w-full rounded-xl p-3 text-left text-sm transition ${lessonIndex === index
                                    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                                    : "text-slate-300 hover:bg-white/5"
                                    }`}
                            >
                                <span className="mr-2 text-xs text-slate-500">
                                    {completed.includes(index) ? "✓" : `${index + 1}.`}
                                </span>
                                {item.title}
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-9">
                    <p className="text-sm font-medium text-blue-400">
                        LESSON {lessonIndex + 1} OF {course.lessons.length}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold">{lesson.title}</h2>

                    <p className="mt-5 whitespace-pre-wrap leading-8 text-slate-300">
                        {lesson.summary}
                    </p>

                    <div className="mt-8 rounded-xl border border-white/10 bg-black/10 p-5">
                        <h3 className="font-semibold">Key concepts</h3>

                        <ul className="mt-4 space-y-3">
                            {lesson.keyPoints.map((point, index) => (
                                <li
                                    key={`${index}-${point}`}
                                    className="flex gap-3 text-sm leading-6 text-slate-300"
                                >
                                    <span className="text-blue-400">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <button
                            onClick={askTutor}
                            className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
                        >
                            Ask AI Tutor ↗
                        </button>

                        <button
                            onClick={markComplete}
                            disabled={isComplete}
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isComplete ? "✓ Lesson Completed" : "Mark as Complete"}
                        </button>
                    </div>

                    <div className="mt-8 flex justify-between border-t border-white/10 pt-5">
                        <button
                            disabled={lessonIndex === 0}
                            onClick={() => setLessonIndex((index) => index - 1)}
                            className="text-sm text-slate-300 hover:text-white disabled:opacity-30"
                        >
                            ← Previous
                        </button>

                        <button
                            disabled={lessonIndex === course.lessons.length - 1}
                            onClick={() => setLessonIndex((index) => index + 1)}
                            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-30"
                        >
                            Next Lesson →
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
