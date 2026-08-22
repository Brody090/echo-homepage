import type { RefObject } from 'react';
import { CONTACTS, PROJECTS } from '../data/site';
import { LinkCard } from './LinkCard';
import { SectionTitle } from './SectionTitle';

interface SecondScreenProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

export function SecondScreen({ targetRef }: SecondScreenProps) {
  return (
    <section className="relative z-[2] min-h-screen bg-panel backdrop-blur-[20px] transition-colors duration-300">
      <div className="flex min-h-screen flex-col items-center px-[14px] pb-[60px] pt-10 min-[481px]:px-5 min-[481px]:pt-[60px] md:pb-20">
        {/* 头像目标位置占位 */}
        <div
          ref={targetRef}
          aria-hidden="true"
          className="invisible mb-4 h-[80px] w-[80px] shrink-0 rounded-full min-[481px]:mb-5 min-[481px]:h-[100px] min-[481px]:w-[100px] md:mb-10 md:h-[130px] md:w-[130px]"
        />

        {/* 联系方式 */}
        <div className="mb-[22px] w-full max-w-[720px] last:mb-0 min-[481px]:mb-7 md:mb-9">
          <SectionTitle icon="android-contacts">联系方式</SectionTitle>
          <div className="flex flex-col items-center gap-3 max-w-full md:flex-row md:flex-wrap md:gap-4 max-[480px]:gap-3">
            {CONTACTS.map(item => (
              <LinkCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* 我的项目 */}
        <div className="mb-[22px] w-full max-w-[720px] last:mb-0 min-[481px]:mb-7 md:mb-9">
          <SectionTitle icon="ibm-cloud-projects">我的项目</SectionTitle>
          <ul className="flex flex-col gap-[14px] max-[480px]:gap-[10px]">
            {PROJECTS.map(item => (
              <li key={item.label}>
                <LinkCard item={item} layout="list" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
