"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Flame,
  Zap,
  Clock3,
  BrainCircuit,
  Target,
  Sparkles,
  Trash2,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Gamepad2,
} from "lucide-react";
import {
  getAllActivity,
  getActivityStats,
  formatDateKey,
  clearActivityHistory,
  recordActivity,
  ACTIVITY_CHANGE_EVENT,
  BLUE_INTENSITY_SHADES,
  getIntensityLevel,
  DailyActivityRecord,
} from "@/lib/activityTracker";

interface DayCell {
  date: Date;
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  activity: DailyActivityRecord;
  level: 0 | 1 | 2 | 3 | 4;
}

interface WeekColumn {
  weekIndex: number;
  days: (DayCell | null)[];
  monthLabel?: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ActivityHeatmap() {
  const [activityMap, setActivityMap] = useState<Record<string, DailyActivityRecord>>({});
  const [mounted, setMounted] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    cell: DayCell;
    x: number;
    y: number;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync activity records from localStorage
  const refreshData = () => {
    const data = getAllActivity();
    setActivityMap({ ...data });
  };

  useEffect(() => {
    setMounted(true);
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(ACTIVITY_CHANGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(ACTIVITY_CHANGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Auto-scroll heatmap to the right (most recent days) on mount
  useEffect(() => {
    if (mounted && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [mounted]);

  // Temporary notification toast
  const triggerNotification = (msg: string) => {
    setStatusNotification(msg);
    window.setTimeout(() => {
      setStatusNotification(null);
    }, 3000);
  };

  // Build 52-week calendar grid ending on current week
  const { weeks, monthHeaders } = useMemo(() => {
    if (!mounted) {
      return { weeks: [], monthHeaders: [] };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = formatDateKey(today);

    // End on upcoming Saturday to complete current week column
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay();
    const daysToSaturday = 6 - dayOfWeek;
    endDate.setDate(endDate.getDate() + daysToSaturday);

    // Generate exactly 53 weeks (371 days) back from endDate
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 53 * 7 + 1);

    const weekCols: WeekColumn[] = [];
    const monthHeaderList: { month: string; colIndex: number }[] = [];

    let currentMonth = -1;
    let curr = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const days: (DayCell | null)[] = [];
      let weekFirstDayMonth = -1;

      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(curr);
        const dateKey = formatDateKey(dateObj);
        const isToday = dateKey === todayKey;
        const isFuture = dateObj.getTime() > today.getTime();

        if (d === 0) {
          weekFirstDayMonth = dateObj.getMonth();
        }

        const act = activityMap[dateKey] || {
          date: dateKey,
          chats: 0,
          mcqs: 0,
          activeSeconds: 0,
          activeMinutes: 0,
          score: 0,
        };

        const level = isFuture ? 0 : getIntensityLevel(act.score);

        days.push({
          date: dateObj,
          dateKey,
          isToday,
          isFuture,
          activity: act,
          level,
        });

        curr.setDate(curr.getDate() + 1);
      }

      // Check if we should place a month label above this week column
      if (weekFirstDayMonth !== currentMonth) {
        currentMonth = weekFirstDayMonth;
        monthHeaderList.push({
          month: MONTH_NAMES[currentMonth],
          colIndex: w,
        });
      }

      weekCols.push({
        weekIndex: w,
        days,
      });
    }

    return { weeks: weekCols, monthHeaders: monthHeaderList };
  }, [activityMap, mounted]);

  const stats = useMemo(() => {
    if (!mounted) {
      return {
        totalScore: 0,
        totalChats: 0,
        totalMcqs: 0,
        totalGamesPlayed: 0,
        totalActiveMinutes: 0,
        totalActiveHours: 0,
        totalActiveDays: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
    return getActivityStats(activityMap);
  }, [activityMap, mounted]);

  const handleCellPosition = (
    e: React.MouseEvent<HTMLDivElement>,
    cell: DayCell
  ) => {
    if (cell.isFuture) return;
    setHoveredCell({
      cell,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleClearHistory = () => {
    clearActivityHistory();
    setShowClearConfirm(false);
    triggerNotification("Activity history cleared.");
  };

  const handleAddTestActivity = (chats: number, mcqs: number, activeMinutes: number) => {
    recordActivity({
      chats,
      mcqs,
      gamesPlayed: 0,
      activeSeconds: activeMinutes * 60,
    });
    setShowTestModal(false);
    triggerNotification(`Added test activity: ${chats} chat, ${mcqs} MCQs, ${activeMinutes}m active!`);
  };

  if (!mounted) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-[#0A1322]/90 p-8">
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          Loading learning activity...
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#0B1528]/95 via-[#0A1322]/95 to-[#080F1C] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 md:p-8">
      {/* Background ambient glowing gradient */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

      {/* Header Section */}
      <div className="relative flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-cyan-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <CalendarIcon size={19} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                Learning Activity Heatmap
              </h3>

            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">




        </div>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-300">
          <CheckCircle2 size={15} />
          {statusNotification}
        </div>
      )}

      {/* Quick Stats Banner */}
      <div className="relative my-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-blue-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock3 size={14} className="text-blue-400" />
            <span>Active Time</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">
            {stats.totalActiveHours > 0
              ? `${stats.totalActiveHours} hrs`
              : `${stats.totalActiveMinutes} mins`}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">Excludes idle time</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-cyan-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Target size={14} className="text-cyan-400" />
            <span>MCQs Solved</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{stats.totalMcqs}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">2 pts each</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-purple-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Gamepad2 size={14} className="text-purple-400" />
            <span>Games Played</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{stats.totalGamesPlayed}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">3 pts each</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-indigo-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BrainCircuit size={14} className="text-indigo-400" />
            <span>AI Chats</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{stats.totalChats}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">1 pt each</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-amber-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Flame size={14} className="text-orange-400" />
            <span>Current Streak</span>
          </div>
          <p className="mt-2 text-xl font-bold text-orange-300">
            {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">Daily consistency</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-yellow-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap size={14} className="text-yellow-400" />
            <span>Longest Streak</span>
          </div>
          <p className="mt-2 text-xl font-bold text-yellow-200">
            {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">Best run</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-cyan-400/25">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={14} className="text-cyan-300" />
            <span>Total Score</span>
          </div>
          <p className="mt-2 text-xl font-bold text-cyan-300">{stats.totalScore}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{stats.totalActiveDays} active days</p>
        </div>
      </div>

      {/* Heatmap Grid Section */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#091220]/80 p-4 md:p-6">
        <div
          ref={scrollContainerRef}
          className="relative max-w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-500/20"
        >
          <div className="min-w-[780px]">
            {/* Month Labels Header */}
            <div className="mb-2 flex text-[11px] font-semibold text-slate-400">
              <div className="w-8 shrink-0" /> {/* Spacer for weekday labels */}
              <div className="relative flex-1">
                <div className="flex">
                  {weeks.map((week, idx) => {
                    const header = monthHeaders.find((h) => h.colIndex === idx);
                    return (
                      <div
                        key={idx}
                        className="w-[14px] shrink-0 text-[10px] text-slate-400"
                        style={{ marginRight: "3px" }}
                      >
                        {header ? (
                          <span className="truncate">{header.month}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Calendar Rows: 7 Days (Sun to Sat) */}
            <div className="flex">
              {/* Weekday labels on left */}
              <div className="flex w-8 shrink-0 flex-col justify-between py-[1px] text-[9px] font-medium text-slate-500">
                <span className="h-[13px] leading-[13px]"></span>
                <span className="h-[13px] leading-[13px]">Mon</span>
                <span className="h-[13px] leading-[13px]"></span>
                <span className="h-[13px] leading-[13px]">Wed</span>
                <span className="h-[13px] leading-[13px]"></span>
                <span className="h-[13px] leading-[13px]">Fri</span>
                <span className="h-[13px] leading-[13px]"></span>
              </div>

              {/* Grid Columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week) => (
                  <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                    {week.days.map((cell, dIdx) => {
                      if (!cell) {
                        return (
                          <div
                            key={dIdx}
                            className="h-[13px] w-[13px] rounded-[3px] bg-transparent"
                          />
                        );
                      }

                      const shade = BLUE_INTENSITY_SHADES[cell.level];

                      return (
                        <div
                          key={cell.dateKey}
                          onMouseEnter={(e) => handleCellPosition(e, cell)}
                          onMouseMove={(e) => handleCellPosition(e, cell)}
                          onMouseLeave={handleCellMouseLeave}
                          className={`h-[13px] w-[13px] cursor-pointer rounded-[3px] border transition-all duration-150 ${cell.isFuture
                            ? "cursor-default border-white/[0.02] bg-white/[0.01]"
                            : shade.bgClass
                            } ${cell.isToday
                              ? "ring-1 ring-blue-400 ring-offset-1 ring-offset-[#080F1C]"
                              : ""
                            } hover:scale-125 hover:z-10`}
                          style={
                            !cell.isFuture && cell.level > 0
                              ? { boxShadow: shade.glow }
                              : undefined
                          }
                          aria-label={`${cell.dateKey}: ${cell.activity.score} pts`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend & Formula Footer */}
        <div className="mt-5 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-4 text-xs text-slate-400 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">

          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Less</span>
            <div className="flex items-center gap-1.5">
              {BLUE_INTENSITY_SHADES.map((shade) => (
                <div
                  key={shade.level}
                  className={`h-3.5 w-3.5 rounded-[3px] border ${shade.bgClass}`}
                  title={`${shade.label} (Level ${shade.level})`}
                  style={shade.level > 0 ? { boxShadow: shade.glow } : undefined}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">More</span>
          </div>
        </div>
      </div>

      {/* Floating Interactive Hover Tooltip - Centered strictly above the cursor via Portal */}
      {mounted &&
        hoveredCell &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[99999] -translate-x-1/2 -translate-y-full pb-2"
            style={{
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y - 12}px`,
            }}
          >
            <div className="rounded-2xl border border-blue-400/30 bg-[#0C192E]/95 p-3.5 text-xs text-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(37,99,235,0.25)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                <span className="font-semibold text-white">
                  {hoveredCell.cell.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${hoveredCell.cell.level === 4
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                    : hoveredCell.cell.level === 3
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                      : hoveredCell.cell.level === 2
                        ? "bg-blue-700/20 text-blue-300 border border-blue-600/35"
                        : hoveredCell.cell.level === 1
                          ? "bg-blue-900/30 text-blue-400 border border-blue-800/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                >
                  {BLUE_INTENSITY_SHADES[hoveredCell.cell.level].label}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <BrainCircuit size={13} className="text-blue-400" />
                    AI Chats
                  </span>
                  <span className="font-semibold text-white">
                    {hoveredCell.cell.activity.chats}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Target size={13} className="text-cyan-400" />
                    MCQs Solved
                  </span>
                  <span className="font-semibold text-white">
                    {hoveredCell.cell.activity.mcqs}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock3 size={13} className="text-indigo-400" />
                    Active Time
                  </span>
                  <span className="font-semibold text-white">
                    {hoveredCell.cell.activity.activeMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Gamepad2 size={13} className="text-purple-400" />
                    Games Completed
                  </span>
                  <span className="font-semibold text-white">
                    {hoveredCell.cell.activity.gamesPlayed || 0}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-1.5">
                  <span className="font-medium text-cyan-300">Activity Score</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {hoveredCell.cell.activity.score}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-rose-500/30 bg-[#0E1726] p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Clear Activity History?</h4>
            <p className="mt-2 text-sm text-slate-300">
              This will reset all your daily streaks, completed chats, MCQs solved, and active time records from localStorage. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Quick Add Modal for instant testing */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-blue-400/30 bg-[#0E1726] p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Log Activity for Today</h4>
            <p className="mt-1 text-xs text-slate-400">
              Quickly test the heatmap intensity updates in real time.
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => handleAddTestActivity(1, 0, 5)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/10"
              >
                <span>+1 AI Chat & 5m Active</span>
                <span className="font-semibold text-blue-300">+2.0 pts</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTestActivity(0, 5, 10)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
              >
                <span>+5 MCQs & 10m Active</span>
                <span className="font-semibold text-cyan-300">+12.0 pts</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTestActivity(3, 10, 30)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10"
              >
                <span>+3 Chats, 10 MCQs, 30m Active</span>
                <span className="font-semibold text-indigo-300">+29.0 pts</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
