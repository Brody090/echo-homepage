import { memo } from 'react';
import { TYPEWRITER_NAMES } from '../data/site';
import { useTypewriter } from '../hooks/useTypewriter';

export const Typewriter = memo(function Typewriter() {
  const text = useTypewriter(TYPEWRITER_NAMES);

  return (
    <h1 className="hero-item-enter mt-[22px] min-h-[2.2rem] text-center text-[1.2rem] font-semibold leading-[1.3] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] min-[481px]:mt-[26px] min-[481px]:min-h-[2.6rem] min-[481px]:text-[1.45rem] md:mt-8 md:text-[2rem]">
      <span>Hi, I'm </span>
      <span>{text}</span>
      <span aria-hidden="true" className="inline-block animate-[cursorBlink_0.8s_step-end_infinite] font-light motion-reduce:animate-none">|</span>
    </h1>
  );
});
