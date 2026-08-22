import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { AVATAR_URL } from '../data/site';

interface SharedAvatarProps {
  progress: number;
  originRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
}

/** fixed 定位的共享头像，随滚动进度在第一屏占位与第二屏占位之间线性过渡 */
export function SharedAvatar({ progress, originRef, targetRef }: SharedAvatarProps) {
  const avatarRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
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

    avatar.style.left = `${startX + (endX - startX) * progress}px`;
    avatar.style.top = `${startY + (endY - startY) * progress}px`;
  }, [progress, originRef, targetRef]);

  return (
    <img
      ref={avatarRef}
      src={AVATAR_URL}
      alt="头像"
      width={130}
      height={130}
      decoding="async"
      fetchPriority="high"
      className="pointer-events-none fixed z-[100] h-[80px] w-[80px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-glass-lg will-change-[left,top] min-[481px]:h-[100px] min-[481px]:w-[100px] md:h-[130px] md:w-[130px]"
    />
  );
}
