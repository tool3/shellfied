import { useEffect } from 'react';
import { useStore, useColorMode } from '@/store';

export function useTheme() {
  const colorMode = useColorMode();
  const setColorMode = useStore((s) => s.setColorMode);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode);
  }, [colorMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no user preference is stored
      const stored = localStorage.getItem('shellfied-storage');
      if (!stored) {
        setColorMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setColorMode]);

  return { colorMode };
}
