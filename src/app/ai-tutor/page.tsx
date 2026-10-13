"use client";

import { useState } from "react";

type Message = {
    role: "user" | "assistant";
    text: string;
};

export default function AITutorPage() {
    const [question, setQuestion] = useState("");
    const [selectedLesson, setSelectedLesson] = useState(
        "Introduction to Machine Learning"
    );
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            text: "Hey! I'm your StudyMate AI tutor. Ask me anything about your lesson!",
        },
    ]);
    const [loading, setLoading] = useState(false);

    async function sendQuestion() {
        const text = question.trim();
        if (!text || loading) return;

        const previousMessages = messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-10)
            .map((m) => ({
                role: m.role,
                content: m.text,
            }));

        setQuestion("");
        setLoading(true);

        setMessages((prev) => [
            ...prev,
            { role: "user", text },
            { role: "assistant", text: "" },
        ]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: text,
                    lesson: selectedLesson,
                    history: previousMessages,
                }),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Request failed.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let answer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                answer += decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: "assistant",
                        text: answer,
                    };
                    return updated;
                });
            }

            answer += decoder.decode();

            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    text: answer,
                };
                return updated;
            });
        } catch (error) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    text:
                        error instanceof Error
                            ? error.message
                            : "Something went wrong.",
                };
                return updated;
            });
        } finally {
            setLoading(false);
        }
    }
    return (
        <main className="min-h-screen bg-[#080b14] p-4 text-white sm:p-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <header>
                    <a href="/" className="text-sm text-blue-400">
                        ← Back to Dashboard
                    </a>

                    <h1 className="mt-4 text-3xl font-bold">
                        StudyMate AI Tutor
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Your personal AI learning companion.
                    </p>
                </header>

                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <label htmlFor="lesson" className="mb-2 block text-sm">
                        Current lesson
                    </label>

                    <select
                        id="lesson"
                        value={selectedLesson}
                        onChange={(e) => setSelectedLesson(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3"
                    >
                        <option>Introduction to Machine Learning</option>
                        <option>Python Programming</option>
                        <option>Data Structures and Algorithms</option>
                        <option>Database Management Systems</option>
                        <option>Artificial Intelligence</option>
                    </select>
                </section>

                <section className="flex min-h-[480px] flex-col rounded-2xl border border-white/10 bg-white/[0.04]">
                    <div className="border-b border-white/10 p-4">
                        <h2 className="font-semibold">✦ StudyMate Assistant</h2>
                        <p className="text-xs text-slate-400">
                            AI-powered learning support
                        </p>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user"
                                        ? "bg-blue-600"
                                        : "border border-white/10 bg-[#111827]"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <p className="text-sm text-blue-300">
                                StudyMate is thinking...
                            </p>
                        )}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void sendQuestion();
                        }}
                        className="border-t border-white/10 p-4"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask anything about your lesson..."
                                maxLength={4000}
                                disabled={loading}
                                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-blue-500"
                            />

                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading ? "Thinking..." : "Ask AI ↑"}
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            StudyMate can make mistakes. Verify important information.
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}