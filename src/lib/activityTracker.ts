// Activity Tracking Service for StudyMate
// Daily score formula: 2 * MCQs + chats + 3 * games + activeMinutes / 5

export interface DailyActivityRecord {
  date: string;
  chats: number;
  mcqs: number;
  gamesPlayed: number;
  activeSeconds: number;
  activeMinutes: number;
  score: number;
  lastUpdated?: string;
}

export const STORAGE_KEY = "studymate_learning_activity_v1";
export const ACTIVITY_CHANGE_EVENT = "studymate_activity_changed";

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateDailyScore(
  chats: number,
  mcqs: number,
  activeMinutes: number,
  gamesPlayed: number = 0
): number {
  const score =
    2 * mcqs + chats + 3 * gamesPlayed + activeMinutes / 5;

  return Math.round(score * 10) / 10;
}

export function getIntensityLevel(
  score: number
): 0 | 1 | 2 | 3 | 4 {
  if (!score || score <= 0) return 0;
  if (score <= 3) return 1;
  if (score <= 8) return 2;
  if (score <= 16) return 3;

  return 4;
}

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
    bgClass:
      "bg-[#2563eb] border-blue-400/60 shadow-[0_0_12px_rgba(37,99,235,0.4)]",
    color: "#2563eb",
    glow: "0 0 12px rgba(37,99,235,0.4)",
  },
] as const;

export function getAllActivity(): Record<
  string,
  DailyActivityRecord
> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveAllActivity(
  records: Record<string, DailyActivityRecord>
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    // Notify listeners after the current synchronous work finishes.
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(ACTIVITY_CHANGE_EVENT, {
          detail: records,
        })
      );
    }, 0);
  } catch (err) {
    console.error(
      "Failed to save activity data to localStorage:",
      err
    );
  }
}

export function getActivityForDate(
  dateKey: string = formatDateKey()
): DailyActivityRecord {
  const all = getAllActivity();

  if (all[dateKey]) {
    const rec = all[dateKey];
    const activeMinutes =
      Math.round(((rec.activeSeconds || 0) / 60) * 10) / 10;
    const gamesPlayed = rec.gamesPlayed || 0;
    const score = calculateDailyScore(
      rec.chats || 0,
      rec.mcqs || 0,
      activeMinutes,
      gamesPlayed
    );

    return {
      date: dateKey,
      chats: rec.chats || 0,
      mcqs: rec.mcqs || 0,
      gamesPlayed,
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
    gamesPlayed: 0,
    activeSeconds: 0,
    activeMinutes: 0,
    score: 0,
  };
}

export function recordActivity(params: {
  date?: string;
  chats?: number;
  mcqs?: number;
  gamesPlayed?: number;
  activeSeconds?: number;
}) {
  if (typeof window === "undefined") return;

  const dateKey = params.date || formatDateKey();
  const all = getAllActivity();

  const current = all[dateKey] || {
    date: dateKey,
    chats: 0,
    mcqs: 0,
    gamesPlayed: 0,
    activeSeconds: 0,
    activeMinutes: 0,
    score: 0,
  };

  const newChats = Math.max(
    0,
    (current.chats || 0) + (params.chats || 0)
  );
  const newMcqs = Math.max(
    0,
    (current.mcqs || 0) + (params.mcqs || 0)
  );
  const newGamesPlayed = Math.max(
    0,
    (current.gamesPlayed || 0) + (params.gamesPlayed || 0)
  );
  const newActiveSeconds = Math.max(
    0,
    (current.activeSeconds || 0) + (params.activeSeconds || 0)
  );

  const newActiveMinutes =
    Math.round((newActiveSeconds / 60) * 10) / 10;

  const newScore = calculateDailyScore(
    newChats,
    newMcqs,
    newActiveMinutes,
    newGamesPlayed
  );

  all[dateKey] = {
    date: dateKey,
    chats: newChats,
    mcqs: newMcqs,
    gamesPlayed: newGamesPlayed,
    activeSeconds: newActiveSeconds,
    activeMinutes: newActiveMinutes,
    score: newScore,
    lastUpdated: new Date().toISOString(),
  };

  saveAllActivity(all);
}

export function recordCompletedChat() {
  recordActivity({ chats: 1 });
}

export function recordSolvedMCQs(count: number = 1) {
  if (count <= 0) return;

  recordActivity({ mcqs: count });
}

export function recordCompletedGame(count: number = 1) {
  if (count <= 0) return;

  recordActivity({ gamesPlayed: count });
}

export function clearActivityHistory() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent(ACTIVITY_CHANGE_EVENT, {
      detail: {},
    })
  );
}
export function populateSampleActivityData() {
  const records: Record<string, DailyActivityRecord> = {};
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const dateKey = formatDateKey(d);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const probability = isWeekend ? 0.65 : 0.8;

    const seed =
      (d.getFullYear() * 365 +
        d.getMonth() * 31 +
        d.getDate()) %
      100;

    if (Math.random() < probability || seed % 3 === 0) {
      let chats = 0;
      let mcqs = 0;
      let activeMinutes = 0;

      const intensityChoice = (seed + i) % 10;

      if (intensityChoice < 3) {
        chats = 1 + (seed % 2);
        mcqs = seed % 3;
        activeMinutes = 8 + (seed % 15);
      } else if (intensityChoice < 7) {
        chats = 2 + (seed % 4);
        mcqs = 3 + (seed % 6);
        activeMinutes = 25 + (seed % 35);
      } else if (intensityChoice < 9) {
        chats = 4 + (seed % 5);
        mcqs = 8 + (seed % 10);
        activeMinutes = 50 + (seed % 40);
      } else {
        chats = 6 + (seed % 8);
        mcqs = 15 + (seed % 15);
        activeMinutes = 90 + (seed % 60);
      }

      const activeSeconds = Math.round(activeMinutes * 60);
      const score = calculateDailyScore(
        chats,
        mcqs,
        activeMinutes
      );

      records[dateKey] = {
        date: dateKey,
        chats,
        mcqs,
        gamesPlayed: 0,
        activeSeconds,
        activeMinutes,
        score,
        lastUpdated: d.toISOString(),
      };
    }
  }

  saveAllActivity(records);
}

export function getActivityStats(
  records: Record<string, DailyActivityRecord>
) {
  const dates = Object.keys(records).sort();

  let totalScore = 0;
  let totalChats = 0;
  let totalMcqs = 0;
  let totalGamesPlayed = 0;
  let totalActiveSeconds = 0;
  let totalActiveDays = 0;

  for (const dateKey of dates) {
    const item = records[dateKey];

    if (item && item.score > 0) {
      totalScore += item.score;
      totalChats += item.chats || 0;
      totalMcqs += item.mcqs || 0;
      totalGamesPlayed += item.gamesPlayed || 0;
      totalActiveSeconds += item.activeSeconds || 0;
      totalActiveDays++;
    }
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const todayKey = formatDateKey(today);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let checkDate = new Date();

  if (!records[todayKey] || records[todayKey].score <= 0) {
    checkDate = yesterday;
  }

  while (true) {
    const key = formatDateKey(checkDate);

    if (records[key] && records[key].score > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (dates.length > 0) {
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(todayKey);
    const currentDate = new Date(firstDate);

    while (currentDate <= lastDate) {
      const key = formatDateKey(currentDate);

      if (records[key] && records[key].score > 0) {
        tempStreak++;

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const totalActiveMinutes =
    Math.round((totalActiveSeconds / 60) * 10) / 10;

  const totalActiveHours =
    Math.round((totalActiveMinutes / 60) * 10) / 10;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    totalChats,
    totalMcqs,
    totalGamesPlayed,
    totalActiveMinutes,
    totalActiveHours,
    totalActiveDays,
    currentStreak,
    longestStreak,
  };
}