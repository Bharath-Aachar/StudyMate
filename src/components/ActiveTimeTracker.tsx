"use client";

import { useEffect, useRef } from "react";
import { recordActivity } from "@/lib/activityTracker";

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds of no interaction = idle
const SYNC_INTERVAL_MS = 5 * 1000; // Flush accumulated seconds every 5 seconds

export function ActiveTimeTracker() {
  const accumulatedSecondsRef = useRef<number>(0);
  const isIdleRef = useRef<boolean>(false);
  const lastActivityTimeRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    lastActivityTimeRef.current = Date.now();
    // Initial tab visibility state
    if (typeof document !== "undefined") {
      isTabVisibleRef.current = !document.hidden;
    }

    // Flush buffered seconds to localStorage
    const flushActiveTime = () => {
      if (accumulatedSecondsRef.current > 0) {
        const secs = accumulatedSecondsRef.current;
        accumulatedSecondsRef.current = 0;
        recordActivity({ activeSeconds: secs });
      }
    };

    // User activity listener to reset idle timer
    const onUserInteraction = () => {
      lastActivityTimeRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
      }
    };

    // Visibility change handler (background tab detection)
    const onVisibilityChange = () => {
      if (document.hidden) {
        isTabVisibleRef.current = false;
        flushActiveTime();
      } else {
        isTabVisibleRef.current = true;
        lastActivityTimeRef.current = Date.now();
        isIdleRef.current = false;
      }
    };

    // Window blur/focus handler
    const onWindowBlur = () => {
      isTabVisibleRef.current = false;
      flushActiveTime();
    };

    const onWindowFocus = () => {
      isTabVisibleRef.current = true;
      lastActivityTimeRef.current = Date.now();
      isIdleRef.current = false;
    };

    // 1-second interval ticker
    const ticker = window.setInterval(() => {
      const now = Date.now();
      // Check if idle (> 60s without user interaction)
      if (now - lastActivityTimeRef.current > IDLE_TIMEOUT_MS) {
        isIdleRef.current = true;
      }

      // Only accumulate if tab is visible and user is NOT idle
      if (isTabVisibleRef.current && !isIdleRef.current) {
        accumulatedSecondsRef.current += 1;
      }
    }, 1000);

    // Periodic sync interval to localStorage
    const syncTicker = window.setInterval(() => {
      flushActiveTime();
    }, SYNC_INTERVAL_MS);

    // Interaction events to monitor
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"];
    events.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("beforeunload", flushActiveTime);
    window.addEventListener("pagehide", flushActiveTime);

    return () => {
      flushActiveTime();
      window.clearInterval(ticker);
      window.clearInterval(syncTicker);
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("beforeunload", flushActiveTime);
      window.removeEventListener("pagehide", flushActiveTime);
    };
  }, []);

  return null;
}
