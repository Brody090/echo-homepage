import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { AVATAR_URL } from '../data/site';

interface SharedAvatarProps {
  progress: number;
  originRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
}

/** fixed 定位的共享头像，随滚动进度在第一屏占位与第二屏占位之间过渡 */
export function SharedAvatar({ progress, originRef, targetRef }: SharedAvatarProps) {
  const avatarRef = useRef<HTMLImageElement>(null);
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useLayoutEffect(() => {
    const origin = originRef.current;
    const target = targetRef.current;
    const avatar = avatarRef.current;
    if (!origin || !target || !avatar) return;

    const originRect = origin.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const startX = originRect.left + originRect.width / 2;
    const startY = originRect.top + originRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const nextProgress = reducedMotion ? Math.round(progress) : progress;
    const x = startX + (endX - startX) * nextProgress;
    const y = startY + (endY - startY) * nextProgress;

    // 只改 transform，避免 left/top 每帧触发布局，并保留自身的居中偏移。
    avatar.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }, [progress, originRef, targetRef, reducedMotion]);

  return (
    <img
      ref={avatarRef}
      src={AVATAR_URL}
      alt="Echo 的头像"
      width={130}
      height={130}
      decoding="async"
      fetchPriority="high"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[80px] w-[80px] rounded-full object-cover shadow-glass-lg will-change-transform min-[481px]:h-[100px] min-[481px]:w-[100px] md:h-[130px] md:w-[130px]"
    />
  );
}
