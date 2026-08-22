import type { ThemeMode } from '../hooks/useTheme';
import { useTheme } from '../hooks/useTheme';
import { ComputerIcon, DarkModeIcon, SunnyIcon } from './icons';

const NEXT_LABEL: Record<ThemeMode, string> = {
  auto: '暗黑',
  dark: '明亮',
  light: '跟随系统',
};

export function ThemeToggle() {
  const { mode, effective, cycle } = useTheme();
  const currentLabel = effective === 'dark' ? '暗黑模式' : '明亮模式';
  const title = `当前：${currentLabel}（${mode === 'auto' ? '跟随系统' : '手动'}） — 点击切换${NEXT_LABEL[mode]}`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="切换暗黑模式"
      title={title}
      data-mode={mode}
      className="fixed right-5 top-5 z-[200] flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border border-glass-border bg-glass p-0 text-[1.1rem] leading-none backdrop-blur-[12px] transition-transform duration-300 hover:scale-110 active:scale-95 max-[480px]:right-[14px] max-[480px]:top-[14px] max-[480px]:h-9 max-[480px]:w-9 max-[480px]:text-base [&[data-mode='auto']]:border-dashed"
    >
      {mode === 'auto' ? (
        <ComputerIcon />
      ) : effective === 'dark' ? (
        <SunnyIcon />
      ) : (
        <DarkModeIcon />
      )}
    </button>
  );
}
