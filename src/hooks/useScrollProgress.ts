import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** 首屏滚动进度 [0, 1]，rAF 节流；同时驱动头像过渡与首屏淡出 */
export function useScrollProgress(sectionRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number | null = null;
    const section = sectionRef.current;

    const update = () => {
      frame = null;
      const sectionHeight = section?.getBoundingClientRect().height ?? window.innerHeight;
      setProgress(clamp(window.scrollY / Math.max(1, sectionHeight), 0, 1));
    };

    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    const observer = section ? new ResizeObserver(onScroll) : null;
    if (section) observer?.observe(section);

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionRef]);

  return progress;
}
