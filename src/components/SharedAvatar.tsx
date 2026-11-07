import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { AVATAR_URL } from '../data/site';

interface SharedAvatarProps {
  progress: number;
  originRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
}

interface AvatarAnchors {
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
}

/** fixed 定位的共享头像，随滚动进度在第一屏占位与第二屏占位之间过渡 */
export function SharedAvatar({ progress, originRef, targetRef }: SharedAvatarProps) {
  const avatarRef = useRef<HTMLImageElement>(null);
  const anchorsRef = useRef<AvatarAnchors | null>(null);
  const progressRef = useRef(progress);
  const [isPositioned, setIsPositioned] = useState(false);
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  progressRef.current = progress;

  const applyPosition = useCallback(
    (anchors: AvatarAnchors, nextProgress: number) => {
      const avatar = avatarRef.current;
      if (!avatar) return;

      const ratio = reducedMotion ? Math.round(nextProgress) : nextProgress;
      const documentX = anchors.originX + (anchors.targetX - anchors.originX) * ratio;
      const documentY = anchors.originY + (anchors.targetY - anchors.originY) * ratio;
      const x = documentX - window.scrollX;
      const y = documentY - window.scrollY;
      avatar.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    },
    [reducedMotion],
  );

  // 用独立的布局测量处理首次挂载和尺寸变化，避免滚动时重复读取布局。
  useLayoutEffect(() => {
    let frame: number | null = null;
    let observer: ResizeObserver | null = null;

    const scheduleMeasure = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };

    const measure = () => {
      const origin = originRef.current;
      const target = targetRef.current;
      const avatar = avatarRef.current;
      if (!origin || !target || !avatar) {
        // 同级组件的 ref 尚未挂上时，下一帧重试；此期间头像保持隐藏。
        scheduleMeasure();
        return;
      }

      const originRect = origin.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const anchors = {
        originX: originRect.left + window.scrollX + originRect.width / 2,
        originY: originRect.top + window.scrollY + originRect.height / 2,
        targetX: targetRect.left + window.scrollX + targetRect.width / 2,
        targetY: targetRect.top + window.scrollY + targetRect.height / 2,
      };
      anchorsRef.current = anchors;
      applyPosition(anchors, progressRef.current);
      setIsPositioned(true);

      if (!observer) {
        observer = new ResizeObserver(scheduleMeasure);
        observer.observe(origin);
        observer.observe(target);
      }
    };

    measure();
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [applyPosition, originRef, targetRef]);

  // 滚动中只写合成层 transform，不触发布局测量。
  useLayoutEffect(() => {
    const anchors = anchorsRef.current;
    if (anchors) applyPosition(anchors, progress);
  }, [applyPosition, progress]);

  return (
    <img
      ref={avatarRef}
      src={AVATAR_URL}
      alt="Echo 的头像"
      width={130}
      height={130}
      decoding="async"
      fetchPriority="high"
      aria-hidden={!isPositioned}
      className={`pointer-events-none fixed left-0 top-0 z-[100] h-[80px] w-[80px] rounded-full object-cover shadow-glass-lg will-change-transform min-[481px]:h-[100px] min-[481px]:w-[100px] md:h-[130px] md:w-[130px] ${
        isPositioned ? 'visible' : 'invisible'
      }`}
    />
  );
}
