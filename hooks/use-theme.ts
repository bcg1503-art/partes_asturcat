'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { useClientMounted } from '@/hooks/use-client-mounted';

export function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useClientMounted();

  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [mounted, resolvedTheme, setTheme]);

  return {
    mounted,
    resolvedTheme,
    toggleTheme,
    isDark: mounted && resolvedTheme === 'dark'
  };
}
