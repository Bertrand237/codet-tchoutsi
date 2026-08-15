'use client';

import { useState, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [rotating, setRotating] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setRotating(true);
    setTimeout(() => setRotating(false), 400);
  }, [theme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
      aria-label="Changer le thème"
    >
      <span
        className={`relative inline-flex h-5 w-5 items-center justify-center transition-transform duration-300 ${
          rotating ? 'rotate-180' : 'rotate-0'
        }`}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
}
