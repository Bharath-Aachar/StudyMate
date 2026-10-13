"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import {
  recordCompletedGame,
  getAllActivity,
  getActivityStats,
  ACTIVITY_CHANGE_EVENT,
} from "@/lib/activityTracker";
import {
  Gamepad2,
  Zap,
  Brain,
  Trophy,
  Flame,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Timer,
  Award,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Star,
  Swords,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Grid3X3,
  Eraser,
  Lightbulb,
  Undo2,
} from "lucide-react";

// Web Audio synthesizer for UI sound effects (pure client-side, no audio files required)
function playTone(type: "correct" | "wrong" | "click" | "win" | "match", soundEnabled: boolean) {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "correct" || type === "match") {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "wrong") {
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

// ----------------------------------------------------
// SPEED QUIZ DATA
// ----------------------------------------------------
interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const quizQuestions: Question[] = [
  {
    id: 1,
    subject: "Machine Learning",
    question: "Which algorithm optimizes parameters by calculating the gradient of the loss function?",
    options: ["K-Means Clustering", "Gradient Descent", "Random Forest", "DBSCAN"],
    correct: 1,
    explanation: "Gradient Descent iteratively steps toward the negative gradient of the loss function to minimize error.",
  },
  {
    id: 2,
    subject: "Calculus",
    question: "What is the derivative of f(x) = sin(x)?",
    options: ["-cos(x)", "tan(x)", "cos(x)", "sec(x)"],
    correct: 2,
    explanation: "The derivative of sin(x) with respect to x is cos(x).",
  },
  {
    id: 3,
    subject: "Computer Science",
    question: "What is the average time complexity of searching in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    correct: 2,
    explanation: "Because each step halves the remaining candidate nodes, a balanced BST search operates in O(log n) time.",
  },
  {
    id: 4,
    subject: "Neural Networks",
    question: "What issue causes gradient signals to shrink exponentially during deep network backpropagation?",
    options: ["Vanishing Gradient Problem", "Underfitting", "Dropout", "Batch Normalization"],
    correct: 0,
    explanation: "Repeated multiplication of small derivatives causes gradients to vanish as they propagate back.",
  },
  {
    id: 5,
    subject: "Data Science",
    question: "Which technique prevents overfitting by randomly disabling neurons during training?",
    options: ["Cross-Validation", "Dropout", "Bagging", "One-Hot Encoding"],
    correct: 1,
    explanation: "Dropout deactivates a random subset of neurons on each training step to prevent co-adaptation.",
  },
];

// ----------------------------------------------------
// MEMORY MATCH DATA (Pairs of concepts & definitions)
// ----------------------------------------------------
interface MemoryCard {
  id: string;
  pairId: number;
  text: string;
  isConcept: boolean;
}

const memoryPairs = [
  { id: 1, concept: "Gradient Descent", match: "Minimizes error function" },
  { id: 2, concept: "Overfitting", match: "High training, low test accuracy" },
  { id: 3, concept: "Derivative", match: "Instantaneous rate of change" },
  { id: 4, concept: "Binary Search", match: "O(log n) divide and conquer" },
  { id: 5, concept: "Neural Network", match: "Interconnected layers of weights" },
  { id: 6, concept: "Entropy", match: "Measure of disorder / uncertainty" },
];

// ----------------------------------------------------
// SUDOKU SEED PUZZLES & DYNAMIC RANDOMIZATION ENGINE
// ----------------------------------------------------
type Difficulty = "Easy" | "Medium" | "Hard";

interface SudokuTemplate {
  initial: number[][];
  solution: number[][];
}

const seedPuzzles: Record<Difficulty, SudokuTemplate[]> = {
  Easy: [
    {
      initial: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ],
    },
    {
      initial: [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0],
      ],
      solution: [
        [1, 2, 3, 6, 7, 8, 9, 4, 5],
        [5, 8, 4, 2, 3, 9, 7, 6, 1],
        [9, 6, 7, 1, 4, 5, 3, 2, 8],
        [3, 7, 2, 4, 6, 1, 5, 8, 9],
        [6, 9, 1, 5, 8, 3, 2, 7, 4],
        [4, 5, 8, 7, 9, 2, 6, 1, 3],
        [8, 3, 6, 9, 2, 4, 1, 5, 7],
        [2, 1, 9, 8, 5, 7, 4, 3, 6],
        [7, 4, 5, 3, 1, 6, 8, 9, 2],
      ],
    },
  ],
  Medium: [
    {
      initial: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
      ],
      solution: [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9],
      ],
    },
    {
      initial: [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0],
      ],
      solution: [
        [5, 8, 1, 6, 7, 2, 4, 3, 9],
        [7, 9, 2, 8, 4, 3, 6, 5, 1],
        [3, 6, 4, 5, 9, 1, 7, 8, 2],
        [4, 3, 8, 9, 5, 7, 2, 1, 6],
        [2, 5, 6, 1, 8, 4, 9, 7, 3],
        [1, 7, 9, 3, 2, 6, 8, 4, 5],
        [8, 4, 5, 2, 1, 9, 3, 6, 7],
        [9, 1, 3, 7, 6, 8, 5, 2, 4],
        [6, 2, 7, 4, 3, 5, 1, 9, 8],
      ],
    },
  ],
  Hard: [
    {
      initial: [
        [1, 0, 0, 4, 8, 9, 0, 0, 6],
        [7, 3, 0, 0, 0, 0, 0, 4, 0],
        [0, 0, 0, 0, 0, 1, 2, 9, 5],
        [0, 0, 7, 1, 2, 0, 6, 0, 0],
        [5, 0, 0, 7, 0, 3, 0, 0, 8],
        [0, 0, 6, 0, 9, 5, 7, 0, 0],
        [9, 1, 4, 6, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 3, 7],
        [8, 0, 0, 5, 1, 2, 0, 0, 4],
      ],
      solution: [
        [1, 5, 2, 4, 8, 9, 3, 7, 6],
        [7, 3, 9, 2, 5, 6, 8, 4, 1],
        [4, 6, 8, 3, 7, 1, 2, 9, 5],
        [3, 8, 7, 1, 2, 4, 6, 5, 9],
        [5, 9, 1, 7, 6, 3, 4, 2, 8],
        [2, 4, 6, 8, 9, 5, 7, 1, 3],
        [9, 1, 4, 6, 3, 7, 5, 8, 2],
        [6, 2, 5, 9, 4, 8, 1, 3, 7],
        [8, 7, 3, 5, 1, 2, 9, 6, 4],
      ],
    },
    {
      initial: [
        [8, 0, 0, 0, 5, 0, 3, 0, 0],
        [0, 6, 0, 0, 0, 7, 0, 4, 0],
        [3, 0, 0, 6, 0, 0, 7, 0, 0],
        [0, 0, 3, 0, 6, 0, 0, 7, 0],
        [4, 0, 0, 5, 0, 3, 0, 0, 9],
        [0, 1, 0, 0, 7, 0, 4, 0, 0],
        [0, 0, 6, 0, 0, 5, 0, 0, 4],
        [0, 5, 0, 7, 0, 0, 0, 2, 0],
        [0, 0, 9, 0, 4, 0, 0, 0, 7],
      ],
      solution: [
        [8, 2, 7, 1, 5, 4, 3, 9, 6],
        [9, 6, 5, 3, 2, 7, 1, 4, 8],
        [3, 4, 1, 6, 8, 9, 7, 5, 2],
        [5, 9, 3, 4, 6, 8, 2, 7, 1],
        [4, 7, 2, 5, 1, 3, 6, 8, 9],
        [6, 1, 8, 9, 7, 2, 4, 3, 5],
        [7, 8, 6, 2, 3, 5, 9, 1, 4],
        [1, 5, 4, 7, 9, 6, 8, 2, 3],
        [2, 3, 9, 8, 4, 1, 5, 6, 7],
      ],
    },
  ],
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Applies validity-preserving isomorphisms to guarantee fresh unique boards
function transformPuzzle(initial: number[][], solution: number[][]): SudokuTemplate {
  // 1. Bijective digit relabeling (1..9 -> random permutation)
  const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const mapDigit = (d: number) => (d === 0 ? 0 : digits[d - 1]);
  let init = initial.map((r) => r.map(mapDigit));
  let sol = solution.map((r) => r.map(mapDigit));

  // 2. Transpose (50% chance)
  if (Math.random() > 0.5) {
    init = init[0].map((_, c) => init.map((r) => r[c]));
    sol = sol[0].map((_, c) => sol.map((r) => r[c]));
  }

  // 3. Row swaps within 3x3 horizontal bands
  for (let b = 0; b < 3; b++) {
    const perm = shuffleArray([0, 1, 2]);
    const initBand = [init[b * 3], init[b * 3 + 1], init[b * 3 + 2]];
    const solBand = [sol[b * 3], sol[b * 3 + 1], sol[b * 3 + 2]];
    for (let r = 0; r < 3; r++) {
      init[b * 3 + r] = initBand[perm[r]];
      sol[b * 3 + r] = solBand[perm[r]];
    }
  }

  // 4. Column swaps within 3x3 vertical stacks
  for (let b = 0; b < 3; b++) {
    const perm = shuffleArray([0, 1, 2]);
    for (let r = 0; r < 9; r++) {
      const initCols = [init[r][b * 3], init[r][b * 3 + 1], init[r][b * 3 + 2]];
      const solCols = [sol[r][b * 3], sol[r][b * 3 + 1], sol[r][b * 3 + 2]];
      for (let c = 0; c < 3; c++) {
        init[r][b * 3 + c] = initCols[perm[c]];
        sol[r][b * 3 + c] = solCols[perm[c]];
      }
    }
  }

  // 5. Band swaps (entire 3-row blocks)
  const bandPerm = shuffleArray([0, 1, 2]);
  const newInit: number[][] = [];
  const newSol: number[][] = [];
  for (let b = 0; b < 3; b++) {
    const origB = bandPerm[b];
    for (let r = 0; r < 3; r++) {
      newInit.push(init[origB * 3 + r]);
      newSol.push(sol[origB * 3 + r]);
    }
  }

  return { initial: newInit, solution: newSol };
}

function generateSudokuPuzzle(diff: Difficulty): SudokuTemplate {
  const seeds = seedPuzzles[diff];
  const chosenSeed = seeds[Math.floor(Math.random() * seeds.length)];
  return transformPuzzle(chosenSeed.initial, chosenSeed.solution);
}

// Generated once at module load — gives a fresh random pattern on every page refresh
const _initialEasyPuzzle = generateSudokuPuzzle("Easy");

function GamesContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "all";
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player stats — sourced from the real activity tracker
  const getTrackerStats = () => {
    const stats = getActivityStats(getAllActivity());
    return { xp: Math.round(stats.totalScore), streak: stats.currentStreak };
  };
  const [userXP, setUserXP] = useState(() => getTrackerStats().xp);
  const [userStreak, setUserStreak] = useState(() => getTrackerStats().streak);
  const [claimedQuests, setClaimedQuests] = useState<number[]>([]);

  // Keep XP & streak in sync when any activity is recorded
  useEffect(() => {
    const sync = () => {
      const { xp, streak } = getTrackerStats();
      setUserXP(xp);
      setUserStreak(streak);
    };
    window.addEventListener(ACTIVITY_CHANGE_EVENT, sync);
    return () => window.removeEventListener(ACTIVITY_CHANGE_EVENT, sync);
  }, []);

  // Per-game timer state (manual-on / auto-off)
  const [quizStarted, setQuizStarted] = useState(false); // Q1 only starts when user clicks START
  const [memoryTimerRunning, setMemoryTimerRunning] = useState(false);

  // ---------------------------------------------
  // SPEED QUIZ STATE
  // ---------------------------------------------
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [quizGameOver, setQuizGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------
  // MEMORY MATCH STATE
  // ---------------------------------------------
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryTimer, setMemoryTimer] = useState(0);
  const [memoryActive, setMemoryActive] = useState(false);
  const [memoryWon, setMemoryWon] = useState(false);

  // ---------------------------------------------
  // SUDOKU STATE (Dynamic Pattern & Manual Stopwatch)
  // ---------------------------------------------
  const [sudokuDifficulty, setSudokuDifficulty] = useState<Difficulty>("Easy");
  const [sudokuBoard, setSudokuBoard] = useState<number[][]>(() =>
    _initialEasyPuzzle.initial.map((row) => [...row])
  );
  const [initialSudoku, setInitialSudoku] = useState<number[][]>(() =>
    _initialEasyPuzzle.initial.map((row) => [...row])
  );
  const [currentSolution, setCurrentSolution] = useState<number[][]>(() =>
    _initialEasyPuzzle.solution.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [sudokuMistakes, setSudokuMistakes] = useState(0);
  const [sudokuTimer, setSudokuTimer] = useState(0);
  const [sudokuTimerRunning, setSudokuTimerRunning] = useState(false); // Manual on: starts paused
  const [sudokuSolved, setSudokuSolved] = useState(false);
  const [sudokuMoves, setSudokuMoves] = useState(0);
  const [sudokuHistory, setSudokuHistory] = useState<
    Array<{ row: number; col: number; prevVal: number }>
  >([]);

  // Update active tab when URL changes
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode) {
      setActiveTab(mode);
    }
  }, [searchParams]);

  // Initialize Memory Match Deck
  const initMemoryGame = () => {
    const deck: MemoryCard[] = [];
    memoryPairs.forEach((item) => {
      deck.push({ id: `c-${item.id}`, pairId: item.id, text: item.concept, isConcept: true });
      deck.push({ id: `m-${item.id}`, pairId: item.id, text: item.match, isConcept: false });
    });
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMemoryMoves(0);
    setMemoryTimer(0);
    setMemoryTimerRunning(false); // reset to stopped; user must press START
    setMemoryActive(true);
    setMemoryWon(false);
  };

  // Memory game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (memoryActive && !memoryWon && memoryTimerRunning) {
      interval = setInterval(() => { setMemoryTimer((p) => p + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [memoryActive, memoryWon, memoryTimerRunning]);


  // Sudoku Stopwatch (Manual On via button / first move, Auto Off on win / 3 mistakes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "sudoku" && sudokuTimerRunning && !sudokuSolved && sudokuMistakes < 3) {
      interval = setInterval(() => {
        setSudokuTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, sudokuTimerRunning, sudokuSolved, sudokuMistakes]);

  // Card Flip Handler
  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index)) return;
    const clickedCard = cards[index];
    if (matchedPairs.includes(clickedCard.pairId)) return;

    playTone("click", soundEnabled);
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          playTone("match", soundEnabled);
          setMatchedPairs((prev) => {
            const updated = [...prev, firstCard.pairId];
            if (updated.length === memoryPairs.length) {
              setMemoryWon(true);
              setMemoryActive(false);
              setMemoryTimerRunning(false); // Auto off on win
              playTone("win", soundEnabled);
              setUserXP((x) => x + 120);
              recordCompletedGame(); // Memory match completed → record to heatmap
            }
            return updated;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1100);
      }
    }
  };

  // Initialize a fresh randomized Sudoku puzzle (different pattern every time)
  const startSudokuPuzzle = (diff: Difficulty) => {
    const puzzle = generateSudokuPuzzle(diff);
    setSudokuDifficulty(diff);
    setInitialSudoku(puzzle.initial.map((r) => [...r]));
    setSudokuBoard(puzzle.initial.map((r) => [...r]));
    setCurrentSolution(puzzle.solution.map((r) => [...r]));
    setSelectedCell(null);
    setSudokuMistakes(0);
    setSudokuTimer(0);
    setSudokuTimerRunning(false); // Manual on: starts paused
    setSudokuSolved(false);
    setSudokuMoves(0);
    setSudokuHistory([]);
  };

  // Initialize memory game on mount
  useEffect(() => { initMemoryGame(); }, []);

  // Speed Quiz 10s per-question countdown
  // Gated on quizStarted — Q1 only starts after user clicks START;
  // Q2+ auto-start because quizStarted is already true when quizIndex changes.
  useEffect(() => {
    if (activeTab === "quiz" && !isAnswered && !quizGameOver && quizStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleQuizTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab, quizIndex, isAnswered, quizGameOver, quizStarted]);

  const handleQuizTimeout = () => {
    setIsAnswered(true);
    setSelectedAnswer(null);
    setQuizStreak(0);
    playTone("wrong", soundEnabled);
  };

  const handleSelectQuizAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(optionIdx);
    setIsAnswered(true);

    const currentQ = quizQuestions[quizIndex];
    if (optionIdx === currentQ.correct) {
      playTone("correct", soundEnabled);
      const streakBonus = quizStreak + 1;
      setQuizStreak(streakBonus);
      const earnedXP = 20 * streakBonus;
      setQuizScore((prev) => prev + earnedXP);
      setUserXP((prev) => prev + earnedXP);
    } else {
      playTone("wrong", soundEnabled);
      setQuizStreak(0);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(10);
    } else {
      setQuizGameOver(true);
      playTone("win", soundEnabled);
      recordCompletedGame(); // Quiz completed → record to heatmap
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizStreak(0);
    setTimeLeft(10);
    setQuizGameOver(false);
    setQuizStarted(false); // Return to START state
  };

  // ---------------------------------------------
  // SUDOKU LOGIC HANDLERS
  // ---------------------------------------------
  const handleSudokuInput = (num: number) => {
    if (!selectedCell || sudokuSolved || sudokuMistakes >= 3) return;
    const [row, col] = selectedCell;
    if (initialSudoku[row][col] !== 0) return; // Cannot edit initial given cell

    // Stopwatch is manual-on only — user must click the Play button to start it
    const solutionNum = currentSolution[row]?.[col] ?? 0;
    const prevVal = sudokuBoard[row][col];

    if (num === solutionNum) {
      playTone("correct", soundEnabled);
      const newBoard = sudokuBoard.map((r, rIdx) =>
        r.map((c, cIdx) => (rIdx === row && cIdx === col ? num : c))
      );
      setSudokuBoard(newBoard);
      setSudokuMoves((m) => m + 1);
      setSudokuHistory((h) => [...h, { row, col, prevVal }]);

      // Check win condition
      const isComplete = newBoard.every((r, rIdx) =>
        r.every((val, cIdx) => val === currentSolution[rIdx]?.[cIdx])
      );
      if (isComplete) {
        setSudokuSolved(true);
        setSudokuTimerRunning(false); // Auto off on win!
        playTone("win", soundEnabled);
        setUserXP((x) => x + 100);
        recordCompletedGame(); // Sudoku solved → record to heatmap
      }
    } else {
      playTone("wrong", soundEnabled);
      const nextMistakes = sudokuMistakes + 1;
      setSudokuMistakes(nextMistakes);
      if (nextMistakes >= 3) {
        setSudokuTimerRunning(false); // Auto off on game over!
      }
      const newBoard = sudokuBoard.map((r, rIdx) =>
        r.map((c, cIdx) => (rIdx === row && cIdx === col ? num : c))
      );
      setSudokuBoard(newBoard);
      setSudokuHistory((h) => [...h, { row, col, prevVal }]);
    }
  };

  const handleSudokuErase = () => {
    if (!selectedCell || sudokuSolved || sudokuMistakes >= 3) return;
    const [row, col] = selectedCell;
    if (initialSudoku[row][col] !== 0) return;
    if (sudokuBoard[row][col] === 0) return;

    playTone("click", soundEnabled);
    const prevVal = sudokuBoard[row][col];
    const newBoard = sudokuBoard.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? 0 : c))
    );
    setSudokuBoard(newBoard);
    setSudokuHistory((h) => [...h, { row, col, prevVal }]);
  };

  const handleSudokuHint = () => {
    if (!selectedCell || sudokuSolved || sudokuMistakes >= 3) return;
    const [row, col] = selectedCell;
    if (initialSudoku[row][col] !== 0) return;

    // Stopwatch is manual-on only — user must click the Play button to start it
    const solutionNum = currentSolution[row]?.[col] ?? 0;
    playTone("match", soundEnabled);
    const prevVal = sudokuBoard[row][col];
    const newBoard = sudokuBoard.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? solutionNum : c))
    );
    setSudokuBoard(newBoard);
    setSudokuMoves((m) => m + 1);
    setSudokuHistory((h) => [...h, { row, col, prevVal }]);

    const isComplete = newBoard.every((r, rIdx) =>
      r.every((val, cIdx) => val === currentSolution[rIdx]?.[cIdx])
    );
    if (isComplete) {
      setSudokuSolved(true);
      setSudokuTimerRunning(false); // Auto off on win!
      playTone("win", soundEnabled);
      setUserXP((x) => x + 100);
      recordCompletedGame(); // Sudoku solved via hint → record to heatmap
    }
  };

  const handleSudokuUndo = () => {
    if (sudokuHistory.length === 0 || sudokuSolved) return;
    playTone("click", soundEnabled);
    const last = sudokuHistory[sudokuHistory.length - 1];
    const newHistory = sudokuHistory.slice(0, -1);
    setSudokuHistory(newHistory);
    setSudokuBoard((board) =>
      board.map((r, rIdx) =>
        r.map((c, cIdx) => (rIdx === last.row && cIdx === last.col ? last.prevVal : c))
      )
    );
  };

  // Keyboard navigation and number entry
  useEffect(() => {
    if (activeTab !== "sudoku") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;

      if (e.key >= "1" && e.key <= "9") {
        handleSudokuInput(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleSudokuErase();
      } else if (e.key === "ArrowUp") {
        setSelectedCell([Math.max(0, r - 1), c]);
      } else if (e.key === "ArrowDown") {
        setSelectedCell([Math.min(8, r + 1), c]);
      } else if (e.key === "ArrowLeft") {
        setSelectedCell([r, Math.max(0, c - 1)]);
      } else if (e.key === "ArrowRight") {
        setSelectedCell([r, Math.min(8, c + 1)]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, selectedCell, sudokuBoard, initialSudoku, currentSolution, sudokuSolved, sudokuMistakes, sudokuTimerRunning]);

  const claimQuest = (questId: number, xpReward: number) => {
    if (claimedQuests.includes(questId)) return;
    playTone("win", soundEnabled);
    setClaimedQuests([...claimedQuests, questId]);
    setUserXP((x) => x + xpReward);
  };

  // Calculate number count frequency placed in Sudoku
  const getNumberCounts = () => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!currentSolution || currentSolution.length === 0) return counts;
    sudokuBoard.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell >= 1 && cell <= 9 && cell === currentSolution[rIdx]?.[cIdx]) {
          counts[cell]++;
        }
      });
    });
    return counts;
  };
  const numberCounts = getNumberCounts();

  return (
    <div className="min-h-screen bg-[#080F1C] text-slate-100 md:flex">
      {/* Sidebar with active indicator */}
      <Sidebar activeItem="Games" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Top Bar with Gamification Stats & Sound Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0A1322] p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Gamepad2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Study Arcade
                  </h1>

                </div>
                <p className="text-xs text-slate-400">
                  Turn study sessions into fast-paced memory drills & interactive challenges
                </p>
              </div>
            </div>

            {/* Live Stats Pills */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* XP Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/30 px-3 py-1.5 text-xs">
                <Sparkles size={15} className="text-purple-400" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total XP</span>
                  <span className="font-bold text-purple-200">{String(userXP).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} XP</span>
                </div>
              </div>

              {/* Streak Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 px-3 py-1.5 text-xs">
                <Flame size={16} className="fill-amber-400 text-amber-400 animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Streak</span>
                  <span className="font-bold text-amber-300">{userStreak} Days</span>
                </div>
              </div>

              {/* Weekly Rank */}

              {/* Sound Toggle */}

            </div>
          </div>

          {/* Game Section Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
            {[
              { id: "all", label: "Game Hub", icon: Gamepad2 },
              { id: "quiz", label: "Speed Quiz (10s)", icon: Zap },
              { id: "memory", label: "Card Flipper", icon: Brain },
              { id: "sudoku", label: "Sudoku Daily", icon: Grid3X3 },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    playTone("click", soundEnabled);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${active
                    ? "border border-purple-400/40 bg-gradient-to-r from-purple-500/30 to-indigo-500/20 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                    }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* TAB: ALL GAMES / OVERVIEW HUB */}
          {/* ========================================================= */}
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* Daily Quests Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-[#0E1528] to-blue-950/30 p-6 shadow-2xl">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        DAILY QUESTS
                      </span>
                      <span className="text-xs text-slate-400">Resets in 7h 12m</span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-white">Daily Brain Sprint Challenge</h2>
                    <p className="mt-1 text-xs text-slate-400 max-w-lg">
                      Complete fast learning drills today to maintain your 4-day streak and earn bonus multiplier XP!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center min-w-[90px]">
                      <div className="text-lg font-bold text-purple-300">2 / 3</div>
                      <div className="text-[10px] text-slate-400 uppercase">Quests Done</div>
                    </div>
                    <button
                      onClick={() => {
                        claimQuest(999, 100);
                      }}
                      disabled={claimedQuests.includes(999)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${claimedQuests.includes(999)
                        ? "border border-green-500/30 bg-green-500/10 text-green-300 cursor-default"
                        : "border border-purple-400/40 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105"
                        }`}
                    >
                      {claimedQuests.includes(999) ? (
                        <>
                          <CheckCircle2 size={16} />
                          Claimed +100 XP
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Claim Daily Chest (+100 XP)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quests checklist */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { id: 1, title: "Speed Blitz", desc: "Answer 3 questions in Speed Quiz", reward: 40, done: true },
                    { id: 2, title: "Card Flipper", desc: "Match all pairs in Memory Match", reward: 60, done: matchedPairs.length === memoryPairs.length },
                    { id: 3, title: "Sudoku Scholar", desc: "Place 5 numbers in Sudoku", reward: 50, done: sudokuSolved || sudokuMoves >= 5 },
                  ].map((q) => (
                    <div key={q.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{q.title}</span>
                        <span className="text-[10px] font-bold text-purple-300">+{q.reward} XP</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{q.desc}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${q.done ? "text-green-400" : "text-slate-500"}`}>
                          {q.done ? "Completed" : "In Progress"}
                        </span>
                        {q.done ? (
                          <button
                            onClick={() => claimQuest(q.id, q.reward)}
                            disabled={claimedQuests.includes(q.id)}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${claimedQuests.includes(q.id)
                              ? "bg-white/5 text-slate-500"
                              : "bg-purple-500 text-white hover:bg-purple-400"
                              }`}
                          >
                            {claimedQuests.includes(q.id) ? "Claimed" : "Claim"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* Game Card 1: Speed Quiz */}
                <div className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0A1322] p-5 transition-all duration-300 hover:border-amber-400/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                      </div>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        10 SECONDS
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      Speed Quiz Blitz
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Rapid-fire academic questions with strict 10-second timers. Build combo streaks to unlock massive XP bonuses.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">5 Questions</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">Streak Multipliers</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">Instant Hints</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("quiz");
                      playTone("click", soundEnabled);
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-200 transition-all hover:bg-amber-500 hover:text-black"
                  >
                    <Play size={14} className="fill-current" />
                    Launch Quiz Blitz
                  </button>
                </div>

                {/* Game Card 2: Memory Match */}
                <div className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0A1322] p-5 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 group-hover:scale-110 transition-transform">
                        <Brain size={24} />
                      </div>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        12 CARDS
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Concept Memory Match
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Flip and match key formulas, scientific laws, and computing concepts with their definitions in minimum moves.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">6 Pairs</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">Active Timer</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">+120 XP Win</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("memory");
                      playTone("click", soundEnabled);
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-2.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500 hover:text-black"
                  >
                    <Play size={14} className="fill-current" />
                    Play Memory Match
                  </button>
                </div>

                {/* Game Card 3: Sudoku Daily */}
                <div className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0A1322] p-5 transition-all duration-300 hover:border-purple-400/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 text-purple-300 group-hover:scale-110 transition-transform">
                        <Grid3X3 size={24} />
                      </div>
                      <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                        9x9 GRID
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      Sudoku Daily
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Test logical deduction and numerical focus. Solve fresh randomized 9x9 puzzles across Easy, Medium, and Hard tiers.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">Dynamic Patterns</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">Manual Stopwatch</span>
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1">+100 XP Win</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("sudoku");
                      playTone("click", soundEnabled);
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 py-2.5 text-xs font-semibold text-purple-200 transition-all hover:bg-purple-500 hover:text-white"
                  >
                    <Play size={14} className="fill-current" />
                    Play Sudoku
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SPEED QUIZ BLITZ */}
          {/* ========================================================= */}
          {activeTab === "quiz" && (
            <div className="space-y-4">
              {/* Navbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0A1322] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Speed Quiz Blitz</h2>
                    <p className="text-xs text-slate-400">
                      Question {quizIndex + 1} of {quizQuestions.length} • {quizQuestions[quizIndex]?.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {quizStreak > 1 && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 animate-pulse">
                      <Flame size={14} className="fill-amber-400" />
                      <span>{quizStreak}x STREAK</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Round Score</span>
                    <span className="text-sm font-bold text-amber-300">{quizScore} XP</span>
                  </div>

                  {/* Q1 START button — shown before quiz begins */}
                  {!quizStarted && !quizGameOver && (
                    <button
                      onClick={() => {
                        setQuizStarted(true);
                        playTone("click", soundEnabled);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform"
                    >
                      <Play size={13} className="fill-black" />
                      START
                    </button>
                  )}

                  {/* 10s per-question countdown — shown once quiz is running */}
                  {quizStarted && (
                    <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${timeLeft <= 3
                      ? "border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse"
                      : "border-white/10 bg-white/5 text-slate-200"
                      }`}>
                      <Timer size={15} />
                      <span>{timeLeft}s</span>
                    </div>
                  )}

                  <button
                    onClick={resetQuiz}
                    title="Restart Quiz"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw size={14} />
                    <span>New Quiz</span>
                  </button>
                </div>
              </div>

              {!quizGameOver ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A1322] p-6 shadow-xl">
                  <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full transition-all duration-1000 ${timeLeft <= 3
                        ? "bg-rose-500"
                        : timeLeft <= 6
                          ? "bg-amber-400"
                          : "bg-cyan-400"
                        }`}
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    />
                  </div>

                  <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                    {quizQuestions[quizIndex].subject}
                  </span>

                  <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl leading-relaxed">
                    {quizQuestions[quizIndex].question}
                  </h3>

                  <div className="mt-6 space-y-3">
                    {quizQuestions[quizIndex].options.map((option, idx) => {
                      const isCorrect = idx === quizQuestions[quizIndex].correct;
                      const isChosen = selectedAnswer === idx;

                      let btnStyle = "border-white/[0.08] bg-white/[0.02] text-slate-200 hover:border-white/20 hover:bg-white/[0.05]";
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = "border-green-500/50 bg-green-500/20 text-green-200 font-semibold shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                        } else if (isChosen) {
                          btnStyle = "border-rose-500/50 bg-rose-500/20 text-rose-200 font-semibold";
                        } else {
                          btnStyle = "border-white/[0.04] bg-white/[0.01] text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleSelectQuizAnswer(idx)}
                          className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-mono font-medium">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>

                          {isAnswered && isCorrect && (
                            <CheckCircle2 size={18} className="text-green-400" />
                          )}
                          {isAnswered && isChosen && !isCorrect && (
                            <XCircle size={18} className="text-rose-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <HelpCircle size={14} />
                        <span>Explanation</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {quizQuestions[quizIndex].explanation}
                      </p>

                      <button
                        onClick={handleNextQuizQuestion}
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500 px-5 py-2.5 text-xs font-bold text-black transition-transform hover:scale-102"
                      >
                        {quizIndex + 1 < quizQuestions.length ? "Next Question" : "Finish Round"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-[#0A1322] p-8 text-center shadow-2xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/15 text-amber-300">
                    <Trophy size={32} />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">Quiz Blitz Finished!</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Great reflexes! You conquered all 5 questions.
                  </p>

                  <div className="mx-auto mt-6 flex max-w-sm justify-around rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-amber-300">+{quizScore}</div>
                      <div className="text-[10px] text-slate-400 uppercase">XP Awarded</div>
                    </div>
                    <div className="border-r border-white/10" />
                    <div>
                      <div className="text-2xl font-bold text-cyan-300">{quizStreak}x</div>
                      <div className="text-[10px] text-slate-400 uppercase">Max Streak</div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={resetQuiz}
                      className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-400"
                    >
                      <RotateCcw size={14} />
                      Play Again
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      Back to Arcade
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: MEMORY MATCH */}

          {/* ========================================================= */}
          {activeTab === "memory" && (
            <div className="space-y-4">
              {/* Navbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0A1322] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Concept Memory Match</h2>
                    <p className="text-xs text-slate-400">
                      Match concepts to their meanings • {matchedPairs.length} / {memoryPairs.length} pairs found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Moves</span>
                    <span className="text-sm font-bold text-cyan-300">{memoryMoves}</span>
                  </div>
                  {/* Stopwatch — manual start, auto off on win */}
                  <button
                    onClick={() => {
                      if (!memoryWon) {
                        setMemoryTimerRunning((r) => !r);
                        playTone("click", soundEnabled);
                      }
                    }}
                    title={memoryTimerRunning ? "Pause stopwatch" : "Start stopwatch"}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${memoryTimerRunning
                      ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                      }`}
                  >
                    {memoryTimerRunning
                      ? <Pause size={13} className="text-cyan-300 fill-cyan-300" />
                      : <Play size={13} className="text-cyan-400 fill-cyan-400" />
                    }
                    <span>{String(Math.floor(memoryTimer / 60)).padStart(2, "0")}:{String(memoryTimer % 60).padStart(2, "0")}</span>
                    {!memoryTimerRunning && <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">START</span>}
                  </button>
                  <button
                    onClick={initMemoryGame}
                    title="New Deck"
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500 hover:text-black transition"
                  >
                    <RotateCcw size={14} />
                    <span>New Deck</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {cards.map((card, idx) => {
                  const isFlipped = flippedCards.includes(idx);
                  const isMatched = matchedPairs.includes(card.pairId);

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      disabled={isMatched || isFlipped}
                      className={`relative flex h-28 flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-300 ${isMatched
                        ? "border-green-500/40 bg-gradient-to-br from-green-500/15 to-emerald-950/20 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.1)] scale-98"
                        : isFlipped
                          ? "border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-950/40 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-102"
                          : "border-white/[0.08] bg-[#0A1322] hover:border-cyan-400/20 hover:bg-white/[0.03] text-slate-400"
                        }`}
                    >
                      {isFlipped || isMatched ? (
                        <>
                          <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${card.isConcept ? "text-cyan-400" : "text-purple-300"
                            }`}>
                            {card.isConcept ? "Concept" : "Definition"}
                          </span>
                          <p className="text-xs font-medium leading-tight text-white line-clamp-3">
                            {card.text}
                          </p>
                          {isMatched && (
                            <span className="absolute bottom-1.5 right-1.5 text-green-400">
                              <CheckCircle2 size={14} />
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                          <Brain size={20} className="text-slate-600" />
                          <span className="text-[10px] font-mono tracking-widest text-slate-600">FLIP</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {memoryWon && (
                <div className="rounded-2xl border border-cyan-400/30 bg-[#0A1322] p-8 text-center shadow-2xl animate-fadeIn">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/15 text-cyan-300">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">Board Cleared!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Completed in {memoryMoves} moves and {memoryTimer} seconds!
                  </p>
                  <div className="mx-auto mt-5 flex max-w-xs justify-around rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-cyan-300">+120</div>
                      <div className="text-[10px] text-slate-400 uppercase">XP Gained</div>
                    </div>
                    <div className="border-r border-white/10" />
                    <div>
                      <div className="text-xl font-bold text-purple-300">100%</div>
                      <div className="text-[10px] text-slate-400 uppercase">Accuracy</div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={initMemoryGame}
                      className="rounded-xl border border-cyan-400/40 bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-cyan-400"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                    >
                      Back to Hub
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SUDOKU DAILY (Dynamic Patterns & Manual Stopwatch) */}
          {/* ========================================================= */}
          {activeTab === "sudoku" && (
            <div className="space-y-4">
              {/* Sudoku Top Controls & Difficulties */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0A1322] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10 text-purple-300">
                    <Grid3X3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Sudoku Daily</h2>
                    <p className="text-xs text-slate-400">
                      Fill each row, column, and 3x3 box with digits 1 to 9
                    </p>
                  </div>
                </div>

                {/* Difficulty Selector Pills */}
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        startSudokuPuzzle(diff);
                        playTone("click", soundEnabled);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${sudokuDifficulty === diff
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Stats, Manual-On Stopwatch, & New Game */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Mistakes Counter */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Mistakes</span>
                    <span className={`text-sm font-bold ${sudokuMistakes >= 3 ? "text-rose-400" : "text-amber-300"}`}>
                      {sudokuMistakes} / 3
                    </span>
                  </div>

                  {/* Manual On / Auto Off Stopwatch Button */}
                  <button
                    onClick={() => {
                      if (!sudokuSolved && sudokuMistakes < 3) {
                        setSudokuTimerRunning(!sudokuTimerRunning);
                        playTone("click", soundEnabled);
                      }
                    }}
                    title={sudokuTimerRunning ? "Click to Pause Timer" : "Click to Start Timer"}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${sudokuTimerRunning
                      ? "border-purple-400/40 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300"
                      }`}
                  >
                    {sudokuTimerRunning ? (
                      <Pause size={13} className="text-purple-300 fill-purple-300" />
                    ) : (
                      <Play size={13} className="text-amber-400 fill-amber-400" />
                    )}
                    <span className="font-mono">
                      {Math.floor(sudokuTimer / 60)}:
                      {(sudokuTimer % 60).toString().padStart(2, "0")}
                    </span>
                    {!sudokuTimerRunning && !sudokuSolved && (
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-semibold text-amber-300">
                        {sudokuTimer === 0 ? "START" : "PAUSED"}
                      </span>
                    )}
                  </button>

                  {/* New Board / Restart button */}
                  <button
                    onClick={() => {
                      startSudokuPuzzle(sudokuDifficulty);
                      playTone("click", soundEnabled);
                    }}
                    title="Generate a new randomized puzzle pattern"
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">New Board</span>
                  </button>
                </div>
              </div>

              {/* Main Sudoku Play Area */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 rounded-2xl border border-white/[0.08] bg-[#0A1322] p-4 sm:p-6 shadow-xl">
                {/* 9x9 Board */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[420px] aspect-square rounded-2xl border-2 border-purple-500/30 bg-[#070D18] p-1.5 shadow-2xl">
                    <div className="grid grid-cols-9 h-full w-full">
                      {sudokuBoard.map((row, rIdx) =>
                        row.map((cellVal, cIdx) => {
                          const isGiven = initialSudoku[rIdx]?.[cIdx] !== 0;
                          const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
                          const isSameRowOrCol =
                            selectedCell !== null &&
                            (selectedCell[0] === rIdx || selectedCell[1] === cIdx);
                          const isSameBlock =
                            selectedCell !== null &&
                            Math.floor(selectedCell[0] / 3) === Math.floor(rIdx / 3) &&
                            Math.floor(selectedCell[1] / 3) === Math.floor(cIdx / 3);
                          const isSameValue =
                            selectedCell !== null &&
                            cellVal !== 0 &&
                            cellVal === sudokuBoard[selectedCell[0]][selectedCell[1]];

                          const solutionVal = currentSolution[rIdx]?.[cIdx] ?? 0;
                          const isError = !isGiven && cellVal !== 0 && cellVal !== solutionVal;

                          // 3x3 Subgrid border lines
                          const borderRight = cIdx === 2 || cIdx === 5 ? "border-r-2 border-r-purple-500/40" : "border-r border-r-white/[0.06]";
                          const borderBottom = rIdx === 2 || rIdx === 5 ? "border-b-2 border-b-purple-500/40" : "border-b border-b-white/[0.06]";

                          let bgClass = "bg-transparent";
                          if (isSelected) {
                            bgClass = "bg-purple-500/35 ring-2 ring-purple-400 ring-inset shadow-[0_0_15px_rgba(168,85,247,0.4)]";
                          } else if (isSameValue) {
                            bgClass = "bg-cyan-500/25";
                          } else if (isSameRowOrCol || isSameBlock) {
                            bgClass = "bg-white/[0.035]";
                          }

                          let textClass = "text-slate-100 font-bold";
                          if (isError) {
                            textClass = "text-rose-400 font-bold bg-rose-500/20";
                          } else if (!isGiven && cellVal !== 0) {
                            textClass = "text-purple-300 font-semibold";
                          }

                          return (
                            <button
                              key={`${rIdx}-${cIdx}`}
                              onClick={() => {
                                setSelectedCell([rIdx, cIdx]);
                                playTone("click", soundEnabled);
                              }}
                              className={`flex items-center justify-center text-base sm:text-lg select-none transition-colors duration-150 ${borderRight} ${borderBottom} ${bgClass} ${textClass}`}
                            >
                              {cellVal !== 0 ? cellVal : ""}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls & Numpad */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  {/* Action Buttons: Undo, Erase, Hint */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Quick Actions
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleSudokuUndo}
                        disabled={sudokuHistory.length === 0}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-slate-300 hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-40 transition"
                      >
                        <Undo2 size={16} />
                        <span>Undo</span>
                      </button>

                      <button
                        onClick={handleSudokuErase}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-slate-300 hover:border-white/20 hover:bg-white/[0.06] transition"
                      >
                        <Eraser size={16} />
                        <span>Erase</span>
                      </button>

                      <button
                        onClick={handleSudokuHint}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        <Lightbulb size={16} />
                        <span>Hint</span>
                      </button>
                    </div>
                  </div>

                  {/* Number Pad (1 - 9) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Input Digits (or type 1-9)
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">Arrow keys to move</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const count = numberCounts[num] || 0;
                        const isMaxed = count >= 9;

                        return (
                          <button
                            key={num}
                            onClick={() => handleSudokuInput(num)}
                            disabled={isMaxed || sudokuSolved || sudokuMistakes >= 3}
                            className={`relative flex h-14 flex-col items-center justify-center rounded-xl border text-lg font-bold transition-all active:scale-95 ${isMaxed
                              ? "border-white/[0.04] bg-white/[0.01] text-slate-600 cursor-not-allowed"
                              : "border-purple-400/30 bg-purple-500/15 text-purple-200 hover:border-purple-400/60 hover:bg-purple-500/30 hover:scale-102 shadow-sm"
                              }`}
                          >
                            <span>{num}</span>
                            <span className="text-[9px] font-mono text-slate-400 font-normal">
                              {count}/9
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keyboard Tips */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Keyboard Shortcuts:</span>
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">1-9</kbd> to place digits, <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Backspace</kbd> to erase, and arrow keys to navigate cells.
                  </div>
                </div>
              </div>

              {/* Game Over Modal (3 Mistakes) */}
              {sudokuMistakes >= 3 && !sudokuSolved && (
                <div className="rounded-2xl border border-rose-500/40 bg-[#0A1322] p-8 text-center shadow-2xl animate-fadeIn">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/15 text-rose-300">
                    <XCircle size={32} />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">3 Mistakes Reached</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Don&apos;t worry! Practice makes perfect. Try again with a fresh pattern.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => startSudokuPuzzle(sudokuDifficulty)}
                      className="rounded-xl border border-rose-400/40 bg-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-400 transition"
                    >
                      Try Again (New Pattern)
                    </button>
                  </div>
                </div>
              )}

              {/* Victory Celebration Modal (Auto Off Stopwatch stopped) */}
              {sudokuSolved && (
                <div className="rounded-2xl border border-purple-400/40 bg-[#0A1322] p-8 text-center shadow-2xl animate-fadeIn">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-400/30 bg-purple-400/15 text-purple-300">
                    <Trophy size={32} />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">Sudoku Solved!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    You completed the {sudokuDifficulty} puzzle in {Math.floor(sudokuTimer / 60)}m {sudokuTimer % 60}s with {sudokuMistakes} mistakes!
                  </p>

                  <div className="mx-auto mt-5 flex max-w-xs justify-around rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-purple-300">+100</div>
                      <div className="text-[10px] text-slate-400 uppercase">XP Awarded</div>
                    </div>
                    <div className="border-r border-white/10" />
                    <div>
                      <div className="text-xl font-bold text-cyan-300">{sudokuDifficulty}</div>
                      <div className="text-[10px] text-slate-400 uppercase">Tier Mastered</div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        const nextTier: Difficulty =
                          sudokuDifficulty === "Easy" ? "Medium" : sudokuDifficulty === "Medium" ? "Hard" : "Easy";
                        startSudokuPuzzle(nextTier);
                      }}
                      className="rounded-xl border border-purple-400/40 bg-purple-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-400 transition"
                    >
                      Play Next Pattern
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                    >
                      Back to Arcade
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}






        </div>
      </main>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080F1C] text-slate-100">
          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-[#0A1322] px-6 py-4 shadow-xl">
            <Gamepad2 size={24} className="animate-spin text-purple-400" />
            <span className="text-sm font-semibold text-purple-200">Loading Study Arcade...</span>
          </div>
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  );
}
