import type { LinkItem } from '../data/site';
import { ICONS } from './icons';

interface LinkCardProps {
  item: LinkItem;
  layout?: 'row' | 'list';
}

export function LinkCard({ item, layout = 'row' }: LinkCardProps) {
  const IconComponent = ICONS[item.icon];
  const base =
    'glass group flex cursor-pointer items-center gap-[0.3em] py-5 pl-4 pr-4 text-[0.9rem] font-medium text-ink-glass no-underline transition-[transform,box-shadow,background] duration-300 hover:-translate-y-1 hover:bg-card-hover hover:shadow-glass-md min-[481px]:py-[22px] min-[481px]:text-[0.95rem]';

  const commonProps = {
    href: item.href,
    ...(item.external ? { target: '_blank', rel: 'noopener' } : {}),
  };

  if (layout === 'list') {
    return (
      <a {...commonProps} className={`${base} w-full justify-start pl-6`}>
        <IconComponent />
        <span>{item.label}</span>
        <span className="ml-auto text-[1.15rem] opacity-35 transition-[transform,opacity] duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          →
        </span>
      </a>
    );
  }

  return (
    <a
      {...commonProps}
      className={`${base} w-[92%] max-w-full justify-center md:w-auto md:min-w-0 md:flex-1`}
    >
      <IconComponent />
      <span>{item.label}</span>
    </a>
  );
}
