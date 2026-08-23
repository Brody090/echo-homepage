import type { ReactNode } from 'react';
import { ICONS, type IconName } from './icons';

interface SectionTitleProps {
  icon: IconName;
  children: ReactNode;
}

export function SectionTitle({ icon, children }: SectionTitleProps) {
  const IconComponent = ICONS[icon];

  return (
    <div className="mb-5 flex items-center gap-3 transition-colors duration-300 max-[767px]:justify-center md:mb-7">
      {/* 彩色图标徽章 */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[1rem] text-accent md:h-10 md:w-10 md:text-[1.1rem]">
        <IconComponent />
      </span>
      <h3 className="text-[1rem] font-semibold tracking-wide text-ink md:text-[1.1rem]">
        {children}
      </h3>
      {/* 右侧发丝分隔线（移动端居中布局时隐藏） */}
      <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-divider max-[767px]:hidden" />
    </div>
  );
}
