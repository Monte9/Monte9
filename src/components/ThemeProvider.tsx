"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  isTheme,
  REDUCE_MOTION_KEY,
  THEME_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (isTheme(attr)) return attr;
  }
  return "light";
}

function readReduceMotion(): boolean {
  if (typeof document !== "undefined") {
    return document.documentElement.getAttribute("data-reduce-motion") === "true";
  }
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The no-FOUC head script already set the attributes before paint; mirror
  // them into React state on mount.
  const [theme, setThemeState] = useState<Theme>("light");
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    setThemeState(readTheme());
    setReduceMotionState(readReduceMotion());
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };

  const setReduceMotion = (v: boolean) => {
    setReduceMotionState(v);
    document.documentElement.setAttribute("data-reduce-motion", String(v));
    try {
      localStorage.setItem(REDUCE_MOTION_KEY, String(v));
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, reduceMotion, setReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
