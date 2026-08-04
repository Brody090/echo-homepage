import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  icon: string;
  children: ReactNode;
}

export function SectionTitle({ icon, children }: SectionTitleProps) {
  return (
    <h3 className="mb-4 pl-1 text-[0.95rem] font-semibold text-ink transition-colors duration-300 max-[768px]:mb-5 max-[768px]:pl-0 max-[768px]:text-center min-[481px]:text-[1rem] md:text-[1.1rem]">
      <Icon icon={icon} className="mr-[0.3em] inline-block" />
      {children}
    </h3>
  );
}
