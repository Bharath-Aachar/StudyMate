"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { recordSolvedMCQs, recordCompletedChat } from "@/lib/activityTracker";
import { Sidebar } from "@/components/Sidebar";
import {
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Hourglass,
  House,
  Image as ImageIcon,
  Library,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";

interface UploadedDoc {
  fileName: string;
  fileSize: number;
  fileType: "pdf" | "image" | "document";
  mimeType?: string;
  totalPages?: number | null;
  previewUrl?: string | null;
  extractedText: string;
  charCount?: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const navigation = [
  { name: "Dashboard", icon: House, href: "/" },
  { name: "My Courses", icon: BookOpen, href: "/courses" },
  { name: "AI Tutor", icon: BrainCircuit, href: "/ai-tutor" },
  { name: "Practice", icon: Target, href: "/practice" },
  { name: "Learning Map", icon: ChartNoAxesCombined, href: "/learning-map" },
  { name: "Library", icon: Library, href: "/library" },
];

export default function PracticePage() {
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "quiz" | "qa">("summary");

  // Summary State
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Quiz State
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Timer & Stopwatch State
  const [timerMode, setTimerMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(10);
  const [timeTakenOnSubmit, setTimeTakenOnSubmit] = useState<string | null>(null);

  // Q&A State
  const [qaMessages, setQaMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [askingQa, setAskingQa] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async function handleFileUpload(file: File) {
    setUploadError(null);

    // Client-side 20MB validation
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File is ${sizeMb} MB, which exceeds the 20MB limit. Please choose a smaller file.`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload and parse file.");
      }

      setDoc(data);
      // Reset generated data for fresh file
      setSummary(null);
      setQuiz(null);
      setSelectedAnswers({});
      setQaMessages([
        {
          role: "assistant",
          text: `📄 Ready! I've loaded "${data.fileName}"${data.totalPages ? ` (${data.totalPages} pages)` : ""
            }. You can generate a summary, create practice quiz questions, or ask anything about this document!`,
        },
      ]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "stopwatch") {
            return prev + 1;
          } else {
            if (prev <= 1) {
              setTimerRunning(false);
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerMode]);

  function formatTimerDisplay(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function handleToggleTimerPlay() {
    setTimerRunning((prev) => !prev);
  }

  function handleResetTimer() {
    setTimerRunning(false);
    if (timerMode === "stopwatch") {
      setTimerSeconds(0);
    } else {
      setTimerSeconds(timerInitialMinutes * 60);
    }
  }

  function handleSwitchTimerMode(mode: "stopwatch" | "timer") {
    setTimerMode(mode);
    setTimerRunning(false);
    if (mode === "stopwatch") {
      setTimerSeconds(0);
    } else {
      setTimerSeconds(timerInitialMinutes * 60);
    }
  }

  function handleSelectTimerPreset(mins: number) {
    setTimerInitialMinutes(mins);
    setTimerRunning(false);
    setTimerSeconds(mins * 60);
  }

  function removeDoc() {
    setDoc(null);
    setSummary(null);
    setQuiz(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    handleResetTimer();
    setTimeTakenOnSubmit(null);
    setQaMessages([]);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRetakeQuiz() {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    handleResetTimer();
    setTimeTakenOnSubmit(null);
  }

  function handleSubmitQuiz() {
    setTimerRunning(false);
    const elapsed =
      timerMode === "stopwatch"
        ? timerSeconds
        : Math.max(0, timerInitialMinutes * 60 - timerSeconds);
    setTimeTakenOnSubmit(formatTimerDisplay(elapsed));
    setQuizSubmitted(true);

    // Record solved MCQs in activity tracker
    if (quiz) {
      const correctCount = Object.entries(selectedAnswers).filter(
        ([idx, chosen]) => quiz[Number(idx)]?.correctIndex === chosen
      ).length;
      const countToRecord = correctCount > 0 ? correctCount : Object.keys(selectedAnswers).length;
      if (countToRecord > 0) {
        recordSolvedMCQs(countToRecord);
      }
    }
  }

  async function handleGenerateSummary() {
    if (!doc) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize",
          fileName: doc.fileName,
          content: doc.extractedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary.");
      setSummary(data.result);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error generating summary");
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function handleGenerateQuiz() {
    if (!doc) return;
    setGeneratingQuiz(true);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    handleResetTimer();
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quiz",
          fileName: doc.fileName,
          content: doc.extractedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz.");
      setQuiz(data.quiz);
      setTimeTakenOnSubmit(null);
    } catch (err) {

      alert(err instanceof Error ? err.message : "Error generating quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  }

  async function handleSendQa(overrideQuestion?: string) {
    const q = (overrideQuestion || questionInput).trim();
    if (!q || !doc || askingQa) return;

    setQuestionInput("");
    setQaMessages((prev) => [...prev, { role: "user", text: q }]);
    setAskingQa(true);

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          fileName: doc.fileName,
          content: doc.extractedText,
          question: q,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer.");
      setQaMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
      recordCompletedChat();
    } catch (err) {
      setQaMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Sorry, I couldn't answer that question.",
        },
      ]);
    } finally {
      setAskingQa(false);
    }
  }

  const scoreCount = quiz
    ? Object.entries(selectedAnswers).filter(
      ([idx, chosen]) => quiz[Number(idx)]?.correctIndex === chosen
    ).length
    : 0;

  return (
    <div className="min-h-screen bg-[#080F1C] text-slate-100 md:flex">
      {/* Sidebar Navigation */}
      <Sidebar activeItem="Practice" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Practice Hub
              </span>

            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Upload Materials & Practice
            </h2>
            <p className="text-sm text-slate-400 md:text-base">
              Upload any document (PDF, TXT, MD, Code, CSV) or image (PNG, JPG, WEBP). StudyMate extracts the content and creates interactive quizzes, summaries, and Q&A practice sessions.
            </p>
          </header>

          {/* Upload Dropzone */}
          {!doc && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 ${uploading
                ? "border-blue-500/50 bg-blue-500/[0.04]"
                : "border-white/15 bg-white/[0.02] hover:border-blue-400/50 hover:bg-white/[0.04]"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,image/*,.txt,.md,.json,.csv,.py,.js,.ts,.tsx,.html,.css"
                onChange={handleFileSelect}
                disabled={uploading}
              />

              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(59,130,246,0.15)] transition group-hover:scale-105">
                {uploading ? (
                  <Loader2 className="animate-spin" size={36} />
                ) : (
                  <UploadCloud size={36} />
                )}
              </div>

              <h3 className="text-lg font-semibold text-white">
                {uploading ? "Analyzing & Verifying File..." : "Click or drag & drop any document or image"}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Supports PDF, Images (PNG, JPG, WEBP), Markdown, Text, Code, CSV
              </p>

              {/* Requirement Badges */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">

              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
              <XCircle className="shrink-0 text-rose-400" size={22} />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}

          {/* Attached Document Showcase Card */}
          {doc && (
            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0F1D33] to-[#0A1424] p-6 shadow-[0_0_40px_rgba(34,211,238,0.06)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {doc.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.previewUrl}
                      alt={doc.fileName}
                      className="h-16 w-16 rounded-xl border border-white/10 object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-cyan-300 shadow-inner">
                      {doc.fileType === "pdf" ? (
                        <FileText size={30} />
                      ) : (
                        <ImageIcon size={30} />
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="max-w-[300px] truncate text-base font-bold text-white sm:max-w-[450px]">
                        {doc.fileName}
                      </h4>
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                        Ready
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Size: {formatBytes(doc.fileSize)}</span>
                      {doc.totalPages && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-300 font-medium">
                            {doc.totalPages} Pages
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{doc.fileType} format</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={removeDoc}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <Trash2 size={14} />
                    Remove File
                  </button>
                </div>
              </div>

              {/* Practice Navigation Tabs */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.08] pt-6">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${activeTab === "summary"
                    ? "border border-blue-400/30 bg-blue-600 text-white shadow-lg"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                    }`}
                >
                  <Sparkles size={15} />
                  Summary & Key Concepts
                </button>

                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${activeTab === "quiz"
                    ? "border border-blue-400/30 bg-blue-600 text-white shadow-lg"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                    }`}
                >
                  <Target size={15} />
                  10-Question MCQ Quiz
                </button>

                <button
                  onClick={() => setActiveTab("qa")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${activeTab === "qa"
                    ? "border border-blue-400/30 bg-blue-600 text-white shadow-lg"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                    }`}
                >
                  <HelpCircle size={15} />
                  Ask Your Material
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SUMMARY */}
          {doc && activeTab === "summary" && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Summary & Core Takeaways</h3>
                  <p className="text-xs text-slate-400">
                    High-yield overview synthesized directly from {doc.fileName}
                  </p>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {generatingSummary ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      {summary ? "Regenerate Summary" : "Generate Summary"}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6">
                {summary ? (
                  <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#0E1726] p-6 text-sm leading-7 text-slate-200">
                    {summary}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Lightbulb size={36} className="mb-3 text-cyan-400/50" />
                    <p className="text-sm font-medium text-slate-400">No summary generated yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click &quot;Generate Summary&quot; to distill key concepts from your uploaded material.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRACTICE QUIZ */}
          {doc && activeTab === "quiz" && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive 10-Question MCQ Quiz</h3>
                  <p className="text-xs text-slate-400">
                    Test your understanding of {doc.fileName} with Google Gemini AI
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                  {/* TIMER / STOPWATCH WIDGET (APPEARS ONLY AFTER QUIZ IS GENERATED) */}
                  {quiz && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#0D1829] p-1.5 shadow-sm">
                      {/* Mode Toggle */}
                      <div className="flex items-center rounded-lg bg-white/[0.05] p-0.5">
                        <button
                          type="button"
                          onClick={() => handleSwitchTimerMode("stopwatch")}
                          title="Stopwatch (Count-up)"
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${timerMode === "stopwatch"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                            }`}
                        >
                          <Clock size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchTimerMode("timer")}
                          title="Countdown Timer"
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${timerMode === "timer"
                            ? "bg-cyan-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                            }`}
                        >
                          <Hourglass size={13} />
                        </button>
                      </div>

                      {/* Presets in Timer mode */}
                      {timerMode === "timer" && !timerRunning && (
                        <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                          {[5, 10, 15].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => handleSelectTimerPreset(mins)}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${timerInitialMinutes === mins
                                ? "border border-cyan-400/40 bg-cyan-500/25 text-cyan-200"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Square-shaped Digital Time Display with curved edges */}
                      <div className="flex h-7 min-w-[62px] items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2.5 shadow-inner">
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${timerRunning ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-500"
                            }`}
                        />
                        <span
                          className={`font-mono text-xs sm:text-[13px] font-bold tracking-wider tabular-nums ${timerMode === "timer" && timerSeconds <= 30 && timerSeconds > 0
                            ? "animate-pulse text-amber-400"
                            : timerMode === "timer" && timerSeconds === 0
                              ? "text-rose-400"
                              : "text-slate-100"
                            }`}
                        >
                          {formatTimerDisplay(timerSeconds)}
                        </span>
                      </div>

                      {/* Play/Pause */}
                      <button
                        type="button"
                        onClick={handleToggleTimerPlay}
                        title={timerRunning ? "Pause" : "Start"}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${timerRunning
                          ? "border-amber-400/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          : "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          }`}
                      >
                        {timerRunning ? (
                          <Pause size={13} />
                        ) : (
                          <Play size={13} className="ml-0.5" />
                        )}
                      </button>

                      {/* Reset */}
                      <button
                        type="button"
                        onClick={handleResetTimer}
                        title="Reset"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  )}

                  {quiz && quizSubmitted && (
                    <span className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                      Score: {scoreCount} / {quiz.length}
                    </span>
                  )}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-500 disabled:opacity-50 shrink-0"
                  >
                    {generatingQuiz ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Creating 10 Questions...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        {quiz ? "New 10-Question Quiz" : "Generate 10-Question Quiz"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {!quiz ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Target size={36} className="mb-3 text-blue-400/50" />
                    <p className="text-sm font-medium text-slate-400">No quiz generated yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click &quot;Generate 10-Question Quiz&quot; to create 10 personalized MCQs from {doc.fileName} using Gemini.
                    </p>
                  </div>
                ) : !quizSubmitted ? (
                  /* STEPPER MODE: Questions 1 to 10 */
                  <div className="space-y-6">
                    {/* Progress indicators & Pills */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0A1322] p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyan-300">
                          Question {currentQuestionIndex + 1} of {quiz.length}
                        </span>
                        <span className="text-slate-400">
                          {Object.keys(selectedAnswers).length} of {quiz.length} Answered
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                          style={{
                            width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Question Pills */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {quiz.map((_, idx) => {
                          const isCurrent = idx === currentQuestionIndex;
                          const isAnswered = selectedAnswers[idx] !== undefined;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${isCurrent
                                ? "border border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                : isAnswered
                                  ? "border border-blue-400/40 bg-blue-600/30 text-blue-200"
                                  : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                                }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Single Active Question Card */}
                    {(() => {
                      const q = quiz[currentQuestionIndex];
                      const chosen = selectedAnswers[currentQuestionIndex];

                      if (!q) return null;

                      return (
                        <div className="rounded-2xl border border-white/10 bg-[#0E1726] p-6 shadow-xl">
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-bold text-cyan-300">
                              {currentQuestionIndex + 1}
                            </span>
                            <h4 className="text-base font-semibold leading-7 text-white">
                              {q.question}
                            </h4>
                          </div>

                          <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = chosen === optIndex;

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [currentQuestionIndex]: optIndex,
                                    }))
                                  }
                                  className={`flex items-center gap-3.5 rounded-xl border p-4 text-left text-xs font-medium transition ${isSelected
                                    ? "border-blue-400 bg-gradient-to-r from-blue-600/30 to-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/40"
                                    : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                                    }`}
                                >
                                  <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${isSelected
                                      ? "bg-blue-500 text-white shadow"
                                      : "border border-white/20 bg-white/[0.05] text-slate-300"
                                      }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className="leading-5">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Bottom Stepper Navigation Bar */}
                          <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
                            {/* Bottom Left: Previous */}
                            <button
                              type="button"
                              disabled={currentQuestionIndex === 0}
                              onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                  Math.max(0, prev - 1)
                                )
                              }
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                            >
                              <ChevronLeft size={16} />
                              Previous
                            </button>

                            <span className="hidden text-xs text-slate-500 sm:inline">
                              Question {currentQuestionIndex + 1} of {quiz.length}
                            </span>

                            {/* Bottom Right: Next or Submit */}
                            {currentQuestionIndex < quiz.length - 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentQuestionIndex((prev) =>
                                    Math.min(quiz.length - 1, prev + 1)
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
                              >
                                Next
                                <ChevronRight size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500"
                              >
                                <CheckCheck size={16} />
                                Submit Quiz
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* REVIEW MODE: All 10 Questions with Answers & Explanations */
                  <div className="space-y-6">
                    {/* Score summary banner */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[#0A1820] to-[#0A1322] p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Completed
                          </span>
                          <h4 className="text-xl font-bold text-white">Quiz Results & Answer Key</h4>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          You scored{" "}
                          <span className="font-bold text-cyan-300">
                            {scoreCount}
                          </span>{" "}
                          out of{" "}
                          <span className="font-bold text-cyan-300">
                            {quiz.length}
                          </span>{" "}
                          ({Math.round((scoreCount / quiz.length) * 100)}%)
                          {timeTakenOnSubmit && (
                            <>
                              {" "}• Time taken:{" "}
                              <span className="font-semibold text-cyan-300">
                                {timeTakenOnSubmit}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleRetakeQuiz}
                          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                        >
                          <RotateCcw size={14} />
                          Retake Quiz
                        </button>

                      </div>
                    </div>

                    {/* All 10 questions review list */}
                    <div className="space-y-6">
                      {quiz.map((q, qIndex) => {
                        const chosen = selectedAnswers[qIndex];
                        const isCorrect = chosen === q.correctIndex;

                        return (
                          <div
                            key={qIndex}
                            className="rounded-2xl border border-white/10 bg-[#0E1726] p-6 shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-cyan-300">
                                  {qIndex + 1}
                                </span>
                                <p className="text-sm font-semibold text-slate-100">
                                  {q.question}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${isCorrect
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                                  }`}
                              >
                                {isCorrect ? "Correct ✓" : "Incorrect ✗"}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                              {q.options.map((opt, optIndex) => {
                                let optStyle =
                                  "border-white/5 bg-white/[0.01] text-slate-400 opacity-60";
                                let icon = null;

                                if (optIndex === q.correctIndex) {
                                  optStyle =
                                    "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 font-semibold";
                                  icon = (
                                    <CheckCircle2
                                      size={15}
                                      className="shrink-0 text-emerald-400"
                                    />
                                  );
                                } else if (chosen === optIndex) {
                                  optStyle =
                                    "border-rose-500/50 bg-rose-500/20 text-rose-200";
                                  icon = (
                                    <XCircle
                                      size={15}
                                      className="shrink-0 text-rose-400"
                                    />
                                  );
                                }

                                return (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${optStyle}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                                        {String.fromCharCode(65 + optIndex)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {icon}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation / Reason Callout */}
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-500/[0.08] p-4 text-xs leading-6 text-slate-200">
                              <Lightbulb
                                size={18}
                                className="mt-0.5 shrink-0 text-cyan-300"
                              />
                              <div>
                                <p className="font-semibold text-cyan-200">
                                  Reason & Explanation:
                                </p>
                                <p className="mt-0.5 text-slate-300">
                                  {q.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Q&A ABOUT MATERIAL */}
          {doc && activeTab === "qa" && (
            <div className="flex min-h-[500px] flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <div className="border-b border-white/[0.08] p-5">
                <h3 className="text-lg font-bold text-white">Ask Your Uploaded Material</h3>
                <p className="text-xs text-slate-400">
                  Responses are strictly grounded in {doc.fileName}
                </p>

                {/* Quick prompt chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendQa("Summarize this document")}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:border-blue-400/40 hover:text-white"
                  >
                    ✨ Summarize this document
                  </button>
                  <button
                    onClick={() => handleSendQa("What are the most important formulas or definitions?")}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:border-blue-400/40 hover:text-white"
                  >
                    🔑 Key definitions & formulas
                  </button>
                  <button
                    onClick={() => handleSendQa("Explain the most difficult concept simply")}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:border-blue-400/40 hover:text-white"
                  >
                    💡 Explain hardest concept
                  </button>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {qaMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "border border-white/10 bg-[#0E1726] text-slate-200"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {askingQa && (
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <Loader2 className="animate-spin" size={14} />
                    StudyMate is analyzing your document...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendQa();
                }}
                className="border-t border-white/[0.08] p-4"
              >
                <div className="flex gap-2">
                  <input
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask any question about your uploaded document or image..."
                    disabled={askingQa}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0E1726] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={askingQa || !questionInput.trim()}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    <Send size={15} />
                    Ask
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
