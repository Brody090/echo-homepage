import type { LinkItem } from '../data/site';
import { ICONS } from './icons';

interface LinkCardProps {
  item: LinkItem;
  layout?: 'row' | 'list';
}

/** 图标徽章：accent-soft 圆角方块 + accent 图标色，hover 时轻微放大 */
function IconBadge({ item }: { item: LinkItem }) {
  const IconComponent = ICONS[item.icon];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[1.05rem] text-accent transition-transform duration-300 group-hover:scale-110 min-[481px]:h-11 min-[481px]:w-11 min-[481px]:text-[1.15rem]">
      <IconComponent />
    </span>
  );
}

export function LinkCard({ item, layout = 'row' }: LinkCardProps) {
  const commonProps = {
    href: item.href,
    ...(item.external ? { target: '_blank', rel: 'noopener' } : {}),
  };

  const base =
    'glass group flex cursor-pointer items-center gap-4 py-4 pl-4 pr-4 text-[0.9rem] font-medium text-ink-glass no-underline transition-[translate,box-shadow,background] duration-300 hover:-translate-y-1 hover:bg-card-hover hover:shadow-glass-md min-[481px]:py-5 min-[481px]:text-[0.95rem]';

  const meta = item.description ? (
    <span className="block truncate text-[0.72rem] font-normal leading-snug text-ink-soft min-[481px]:text-[0.78rem]">
      {item.description}
    </span>
  ) : null;

  if (layout === 'list') {
    return (
      <a {...commonProps} className={`${base} w-full min-[481px]:pl-5 min-[481px]:pr-5`}>
        <IconBadge item={item} />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span>{item.label}</span>
          {meta}
        </span>
        {item.tags && item.tags.length > 0 && (
          <span className="flex shrink-0 flex-wrap justify-end gap-1.5 max-[480px]:hidden">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-glass-border bg-glass-strong px-2.5 py-0.5 text-[0.68rem] font-normal text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
        <span
          aria-hidden="true"
          className="text-[1.15rem] opacity-35 transition-[transform,opacity] duration-300 group-hover:translate-x-1 group-hover:opacity-100"
        >
          →
        </span>
      </a>
    );
  }

  return (
    <a
      {...commonProps}
      className={`${base} w-[92%] max-w-[340px] justify-center md:w-auto md:min-w-0 md:flex-1`}
    >
      <IconBadge item={item} />
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        <span>{item.label}</span>
        {meta}
      </span>
    </a>
  );
}
