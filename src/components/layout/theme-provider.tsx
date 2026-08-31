"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark" | undefined;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "theme";
const THEME_EVENT = "martflow-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage can throw in private mode
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function subscribe(onStoreChange: () => void) {
  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener(THEME_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onStoreChange);
  };
}

function getServerSnapshot(): Theme {
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storedTheme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const [mounted, setMounted] = useState(false);
  const theme = mounted ? storedTheme : "system";

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }
    applyTheme(theme);
  }, [mounted, theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private mode
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = theme === "system" ? undefined : theme;
    return { theme, resolvedTheme: resolved, setTheme };
  }, [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
