'use client';

import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
      <span className="theme-icon sun">☀️</span>
      <span className="theme-icon moon">🌙</span>
    </button>
  );
}
