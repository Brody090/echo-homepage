import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'dark' | 'light';

const THEME_KEY = 'echo-homepage-theme';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'light' || saved === 'auto' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

function applyMode(mode: ThemeMode) {
  const effective = mode === 'auto' ? getSystemTheme() : mode;
  const root = document.documentElement;
  root.classList.toggle('dark', effective === 'dark');
  root.setAttribute('data-theme', mode);
}

/**
 * 三态主题（auto / dark / light）：
 * - 用户选择持久化到 localStorage（键与旧版一致：echo-homepage-theme）
 * - auto 模式跟随系统偏好，系统主题变化时同步更新 <html> 上的 .dark class
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readSavedMode);

  useEffect(() => {
    applyMode(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode(m => (m === 'auto' ? 'dark' : m === 'dark' ? 'light' : 'auto'));
  }, []);

  const effective: 'dark' | 'light' = mode === 'auto' ? getSystemTheme() : mode;

  return { mode, effective, cycle };
}
