"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => {
        if (!mounted) {
          return;
        }
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      }}
    >
      {mounted ? (
        <>
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </>
      ) : (
        <Sun className="size-4" />
      )}
    </Button>
  );
}
