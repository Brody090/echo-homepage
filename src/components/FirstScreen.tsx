import type { RefObject } from 'react';
import { useWallpaper } from '../hooks/useWallpaper';
import { DescriptionCard } from './DescriptionCard';
import { Typewriter } from './Typewriter';
import { Wallpaper } from './Wallpaper';

interface FirstScreenProps {
  progress: number;
  originRef: RefObject<HTMLDivElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
}

export function FirstScreen({ progress, originRef, sectionRef }: FirstScreenProps) {
  const wallpaper = useWallpaper();

  return (
    <section ref={sectionRef} className="hero-screen relative h-[100svh] min-h-[560px] overflow-hidden bg-first transition-colors duration-300 motion-reduce:transition-none">
      <Wallpaper data={wallpaper.data} />
      <div aria-hidden="true" className="wallpaper-shade pointer-events-none absolute inset-0 z-[1]" />

      {/* 随滚动淡出层 */}
      <div
        className="hero-content absolute inset-0 z-[2] flex flex-col items-center justify-center"
        style={{ opacity: 1 - progress }}
      >
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* 头像占位（不可见，仅维持 flex 布局空间） */}
          <div
            ref={originRef}
            aria-hidden="true"
            className="invisible h-[80px] w-[80px] shrink-0 rounded-full min-[481px]:h-[100px] min-[481px]:w-[100px] md:h-[130px] md:w-[130px]"
          />
          <Typewriter />
          <DescriptionCard />
        </div>

        {/* 版权信息（毛玻璃小框，底部角落；移动端居中换行） */}
        {wallpaper.data && (
          <div className="wallpaper-credit glass absolute bottom-6 right-6 max-w-[min(70vw,720px)] whitespace-normal break-words px-5 py-2.5 text-right text-[0.85rem] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.45)] max-[480px]:bottom-4 max-[480px]:left-1/2 max-[480px]:max-w-[90vw] max-[480px]:-translate-x-1/2 max-[480px]:px-[14px] max-[480px]:py-2 max-[480px]:text-[0.72rem] max-[480px]:text-center">
            {wallpaper.data.copyright}
          </div>
        )}
      </div>
    </section>
  );
}
