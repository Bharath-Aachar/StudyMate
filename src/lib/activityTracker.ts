// Activity Tracking Service for StudyMate
// Daily score formula: 2 * MCQs + chats + activeMinutes / 5

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  chats: number;
  mcqs: number;
  activeSeconds: number; // Stored in seconds for accuracy
  activeMinutes: number; // Computed active minutes
  score: number;
  lastUpdated?: string;
}

export const STORAGE_KEY = "studymate_learning_activity_v1";
export const ACTIVITY_CHANGE_EVENT = "studymate_activity_changed";

/**
 * Format Date object to YYYY-MM-DD local date string
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the daily activity score
 * Formula: 2 * MCQs + chats + activeMinutes / 5
 */
export function calculateDailyScore(chats: number, mcqs: number, activeMinutes: number): number {
  const score = 2 * mcqs + chats + activeMinutes / 5;
  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine the 5-level blue shade intensity (0 to 4)
 * 0: No activity
 * 1: Low (0 < score <= 3)
 * 2: Medium (3 < score <= 8)
 * 3: High (8 < score <= 16)
 * 4: Intense (score > 16)
 */
export function getIntensityLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (!score || score <= 0) return 0;
  if (score <= 3) return 1;
  if (score <= 8) return 2;
  if (score <= 16) return 3;
  return 4;
}

/**
 * Color metadata for the 5 shades of blue
 */
export const BLUE_INTENSITY_SHADES = [
  {
    level: 0,
    label: "No activity",
    bgClass: "bg-[#0b1322] border-white/[0.06]",
    color: "#0b1322",
    glow: "none",
  },
  {
    level: 1,
    label: "Light activity",
    bgClass: "bg-[#1d4ed8]/25 border-blue-800/30",
    color: "#1d4ed8",
    glow: "0 0 6px rgba(29,78,216,0.2)",
  },
  {
    level: 2,
    label: "Moderate activity",
    bgClass: "bg-[#1d4ed8]/50 border-blue-600/40",
    color: "#1d4ed8",
    glow: "0 0 8px rgba(29,78,216,0.3)",
  },
  {
    level: 3,
    label: "High activity",
    bgClass: "bg-[#2563eb]/75 border-blue-500/50",
    color: "#2563eb",
    glow: "0 0 10px rgba(37,99,235,0.35)",
  },
  {
    level: 4,
    label: "Intense activity",
    bgClass: "bg-[#2563eb] border-blue-400/60 shadow-[0_0_12px_rgba(37,99,235,0.4)]",
    color: "#2563eb",
    glow: "0 0 12px rgba(37,99,235,0.4)",
  },
] as const;

/**
 * Get all stored daily activity records
 */
export function getAllActivity(): Record<string, DailyActivityRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Save all records to localStorage and dispatch update event
 */
export function saveAllActivity(records: Record<string, DailyActivityRecord>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGE_EVENT, { detail: records }));
  } catch (err) {
    console.error("Failed to save activity data to localStorage:", err);
  }
}

/**
 * Get activity for a specific date
 */
export function getActivityForDate(dateKey: string = formatDateKey()): DailyActivityRecord {
  const all = getAllActivity();
  if (all[dateKey]) {
    const rec = all[dateKey];
    const activeMinutes = Math.round(((rec.activeSeconds || 0) / 60) * 10) / 10;
    const score = calculateDailyScore(rec.chats || 0, rec.mcqs || 0, activeMinutes);
    return {
      date: dateKey,
      chats: rec.chats || 0,
      mcqs: rec.mcqs || 0,
      activeSeconds: rec.activeSeconds || 0,
      activeMinutes,
      score,
      lastUpdated: rec.lastUpdated,
    };
  }
  return {
    date: dateKey,
    chats: 0,
    mcqs: 0,
    activeSeconds: 0,
    activeMinutes: 0,
    score: 0,
  };
}

/**
 * Increment activity metrics for today (or specified date)
 */
export function recordActivity(params: {
  date?: string;
  chats?: number;
  mcqs?: number;
  activeSeconds?: number;
}) {
  if (typeof window === "undefined") return;
  const dateKey = params.date || formatDateKey();
  const all = getAllActivity();
  const current = all[dateKey] || {
    date: dateKey,
    chats: 0,
    mcqs: 0,
    activeSeconds: 0,
    activeMinutes: 0,
    score: 0,
  };

  const newChats = Math.max(0, (current.chats || 0) + (params.chats || 0));
  const newMcqs = Math.max(0, (current.mcqs || 0) + (params.mcqs || 0));
  const newActiveSeconds = Math.max(0, (current.activeSeconds || 0) + (params.activeSeconds || 0));
  const newActiveMinutes = Math.round((newActiveSeconds / 60) * 10) / 10;
  const newScore = calculateDailyScore(newChats, newMcqs, newActiveMinutes);

  all[dateKey] = {
    date: dateKey,
    chats: newChats,
    mcqs: newMcqs,
    activeSeconds: newActiveSeconds,
    activeMinutes: newActiveMinutes,
    score: newScore,
    lastUpdated: new Date().toISOString(),
  };

  saveAllActivity(all);
}

/**
 * Record a successfully completed AI chat
 */
export function recordCompletedChat() {
  recordActivity({ chats: 1 });
}

/**
 * Record solved MCQs
 */
export function recordSolvedMCQs(count: number = 1) {
  if (count <= 0) return;
  recordActivity({ mcqs: count });
}

/**
 * Clear all learning activity history
 */
export function clearActivityHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGE_EVENT, { detail: {} }));
}

/**
 * Generate realistic sample data for the past 365 days
 * Great for instant preview and testing
 */
export function populateSampleActivityData() {
  const records: Record<string, DailyActivityRecord> = {};
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateKey = formatDateKey(d);

    // Give realistic probability distribution (some days off, active weekdays, weekend bursts)
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const probability = isWeekend ? 0.65 : 0.8;

    // Pseudo-random pattern seeded by day of year
    const seed = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % 100;

    if (Math.random() < probability || seed % 3 === 0) {
      let chats = 0;
      let mcqs = 0;
      let activeMinutes = 0;

      const intensityChoice = (seed + i) % 10;
      if (intensityChoice < 3) {
        // Light day
        chats = 1 + (seed % 2);
        mcqs = seed % 3;
        activeMinutes = 8 + (seed % 15);
      } else if (intensityChoice < 7) {
        // Moderate day
        chats = 2 + (seed % 4);
        mcqs = 3 + (seed % 6);
        activeMinutes = 25 + (seed % 35);
      } else if (intensityChoice < 9) {
        // High day
        chats = 4 + (seed % 5);
        mcqs = 8 + (seed % 10);
        activeMinutes = 50 + (seed % 40);
      } else {
        // Intense day
        chats = 6 + (seed % 8);
        mcqs = 15 + (seed % 15);
        activeMinutes = 90 + (seed % 60);
      }

      const activeSeconds = Math.round(activeMinutes * 60);
      const score = calculateDailyScore(chats, mcqs, activeMinutes);

      records[dateKey] = {
        date: dateKey,
        chats,
        mcqs,
        activeSeconds,
        activeMinutes,
        score,
        lastUpdated: d.toISOString(),
      };
    }
  }

  saveAllActivity(records);
}

/**
 * Calculate streak and summary statistics
 */
export function getActivityStats(records: Record<string, DailyActivityRecord>) {
  const dates = Object.keys(records).sort();
  let totalScore = 0;
  let totalChats = 0;
  let totalMcqs = 0;
  let totalActiveSeconds = 0;
  let totalActiveDays = 0;

  for (const dateKey of dates) {
    const item = records[dateKey];
    if (item && item.score > 0) {
      totalScore += item.score;
      totalChats += item.chats || 0;
      totalMcqs += item.mcqs || 0;
      totalActiveSeconds += item.activeSeconds || 0;
      totalActiveDays++;
    }
  }

  // Calculate current streak & longest streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // Check if active today or yesterday for current streak
  let checkDate = new Date();
  if (!records[todayKey] || records[todayKey].score <= 0) {
    // If today has no activity yet, check starting from yesterday
    checkDate = yesterday;
  }

  // Count backwards for current streak
  while (true) {
    const k = formatDateKey(checkDate);
    if (records[k] && records[k].score > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak by iterating through continuous calendar days
  if (dates.length > 0) {
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(todayKey);
    const curr = new Date(firstDate);

    while (curr <= lastDate) {
      const k = formatDateKey(curr);
      if (records[k] && records[k].score > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  const totalActiveMinutes = Math.round((totalActiveSeconds / 60) * 10) / 10;
  const totalActiveHours = Math.round((totalActiveMinutes / 60) * 10) / 10;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    totalChats,
    totalMcqs,
    totalActiveMinutes,
    totalActiveHours,
    totalActiveDays,
    currentStreak,
    longestStreak,
  };
}
