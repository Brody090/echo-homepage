import type { RefObject } from 'react';
import {
  CONTACTS,
  OWNER_INTRO,
  OWNER_NAME,
  PROJECTS,
  SITE_NAME,
  SKILLS,
} from '../data/site';
import { LinkCard } from './LinkCard';
import { Reveal } from './Reveal';
import { SectionTitle } from './SectionTitle';

interface SecondScreenProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

export function SecondScreen({ targetRef }: SecondScreenProps) {
  return (
    <section className="screen-glass relative z-[2] min-h-screen bg-panel transition-colors duration-300">
      {/* 顶部装饰光晕（颜色走 CSS 变量，随主题切换） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background: 'radial-gradient(60% 100% at 50% 0%, var(--accent-glow), transparent 70%)',
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center px-[14px] pb-[60px] pt-10 min-[481px]:px-5 min-[481px]:pt-[60px] md:pb-20">
        {/* 头像目标位置占位（SharedAvatar 过渡终点，不可见、维持布局） */}
        <div
          ref={targetRef}
          aria-hidden="true"
          className="invisible mb-4 h-[80px] w-[80px] shrink-0 rounded-full min-[481px]:mb-5 min-[481px]:h-[100px] min-[481px]:w-[100px] md:mb-10 md:h-[130px] md:w-[130px]"
        />

        {/* 头部：问候徽章 + 名字 + 一句话介绍 + 技能标签 */}
        <Reveal className="flex flex-col items-center text-center">
          <p className="glass rounded-full px-4 py-1.5 text-[0.78rem] tracking-wide text-ink-soft min-[481px]:text-[0.85rem]">
            👋 嗨，我是
          </p>
          <h2 className="mt-4 text-[2rem] font-bold tracking-tight text-ink transition-colors duration-300 min-[481px]:text-[2.3rem] md:mt-5 md:text-[2.75rem]">
            {OWNER_NAME}
          </h2>
          <p className="mt-3 max-w-[480px] text-[0.85rem] leading-[1.8] text-ink-soft min-[481px]:text-[0.92rem] md:text-[0.95rem]">
            {OWNER_INTRO}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {SKILLS.map(skill => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-3 py-1 text-[0.72rem] font-medium text-ink-soft min-[481px]:text-[0.78rem]"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                {skill}
              </span>
            ))}
          </div>
        </Reveal>

        {/* 联系方式 */}
        <Reveal delay={90} className="mt-12 w-full max-w-[720px] md:mt-16">
          <SectionTitle icon="android-contacts">联系方式</SectionTitle>
          <div className="flex flex-col items-center gap-3 max-w-full md:flex-row md:flex-wrap md:gap-4">
            {CONTACTS.map(item => (
              <LinkCard key={item.label} item={item} />
            ))}
          </div>
        </Reveal>

        {/* 我的项目 */}
        <Reveal delay={180} className="mt-10 w-full max-w-[720px] md:mt-14">
          <SectionTitle icon="ibm-cloud-projects">我的项目</SectionTitle>
          <ul className="flex flex-col gap-[14px] max-[480px]:gap-[10px]">
            {PROJECTS.map(item => (
              <li key={item.label}>
                <LinkCard item={item} layout="list" />
              </li>
            ))}
          </ul>
        </Reveal>

        {/* 页脚 */}
        <Reveal delay={240} className="mt-auto w-full max-w-[720px] pt-14">
          <div
            aria-hidden="true"
            className="mb-6 h-px w-full bg-[linear-gradient(90deg,transparent,var(--divider),transparent)]"
          />
          <p className="text-center text-[0.75rem] tracking-wide text-ink-soft min-[481px]:text-[0.8rem]">
            © {new Date().getFullYear()} {SITE_NAME} · 以兴趣驱动开发
          </p>
        </Reveal>
      </div>
    </section>
  );
}
