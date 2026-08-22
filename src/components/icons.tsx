import type { FC, ReactNode } from 'react';

/**
 * 内联 SVG 图标集（替代 @iconify/react 运行时请求）。
 *
 * 渲染与 @iconify/react v6 默认 Icon 一致：
 * svg[aria-hidden, role=img, viewBox, width/height=1em, style.display=inline-block] + fill=currentColor，
 * 因此尺寸继承父元素 font-size、颜色继承 currentColor，视觉零差异。
 * SVG body 取自 api.iconify.design 的 .svg 端点（与运行时拉取的数据同源）。
 */

interface IconProps {
  className?: string;
}

function Svg({
  viewBox,
  className,
  children,
}: {
  viewBox: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      viewBox={viewBox}
      width="1em"
      height="1em"
      style={{ display: 'inline-block' }}
      className={className}
    >
      {children}
    </svg>
  );
}

export function MailRoundedIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm8.263-7.212q.137-.038.262-.113L19.6 8.25q.2-.125.3-.312t.1-.413q0-.5-.425-.75T18.7 6.8L12 11L5.3 6.8q-.45-.275-.875-.012T4 7.525q0 .25.1.438t.3.287l7.075 4.425q.125.075.263.113t.262.037t.263-.037"
      />
    </Svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 640 640" className={className}>
      <path
        fill="currentColor"
        d="M320 72C183 72 72 183 72 320s111 248 248 248s248-111 248-248S457 72 320 72m115 168.7c-3.7 39.2-19.9 134.4-28.1 178.3c-3.5 18.6-10.3 24.8-16.9 25.4c-14.4 1.3-25.3-9.5-39.3-18.7c-21.8-14.3-34.2-23.2-55.3-37.2c-24.5-16.1-8.6-25 5.3-39.5c3.7-3.8 67.1-61.5 68.3-66.7c.2-.7.3-3.1-1.2-4.4s-3.6-.8-5.1-.5c-2.2.5-37.1 23.5-104.6 69.1c-9.9 6.8-18.9 10.1-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1c-15.5-5-27.9-7.7-26.8-16.3c.6-4.5 6.7-9 18.4-13.7c72.3-31.5 120.5-52.3 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8c2.1 0 6.6.5 9.6 2.9c2 1.7 3.2 4.1 3.5 6.7c.5 3.2.6 6.5.4 9.8z"
      />
    </Svg>
  );
}

export function ComputerIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M4 18q-.825 0-1.412-.587T2 16V5q0-.825.588-1.412T4 3h16q.825 0 1.413.588T22 5v11q0 .825-.587 1.413T20 18zm-3 3v-2h22v2z"
      />
    </Svg>
  );
}

export function SunnyIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M11 5V1h2v4zm6.65 2.75l-1.375-1.375l2.8-2.875l1.4 1.425zM19 13v-2h4v2zm-8 10v-4h2v4zM6.35 7.7L3.5 4.925l1.425-1.4L7.75 6.35zm12.7 12.8l-2.775-2.875l1.35-1.35l2.85 2.75zM1 13v-2h4v2zm3.925 7.5l-1.4-1.425l2.8-2.8l.725.675l.725.7zm2.825-4.25Q6 14.5 6 12t1.75-4.25T12 6t4.25 1.75T18 12t-1.75 4.25T12 18t-4.25-1.75"
      />
    </Svg>
  );
}

export function DarkModeIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21"
      />
    </Svg>
  );
}

export function AndroidContactsIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M6.4 20q-1 0-1.7-.7T4 17.6v-1.175q0-.95.688-1.763q.687-.812 1.812-1.4q1.125-.587 2.538-.925Q10.45 12 11.9 12q1.45 0 2.9.337q1.45.338 2.6.938q1.15.6 1.875 1.413Q20 15.5 20 16.45v1.15q0 1-.7 1.7t-1.7.7Zm5.5-9q-1.45 0-2.475-1.025Q8.4 8.95 8.4 7.5q0-1.45 1.025-2.475Q10.45 4 11.9 4q1.475 0 2.487 1.025Q15.4 6.05 15.4 7.5q0 1.45-1.025 2.475Q13.35 11 11.9 11Z"
      />
    </Svg>
  );
}

export function IbmCloudProjectsIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" className={className}>
      <path
        fill="currentColor"
        d="M30 18H20v6.468a5.02 5.02 0 0 0 2.861 4.52L25 30l2.139-1.013A5.02 5.02 0 0 0 30 24.467zm-5 9.786l-1.283-.607A3.01 3.01 0 0 1 22 24.468V20h6v4.468a3.01 3.01 0 0 1-1.717 2.71zM17 18H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12v-2H5v-5h12zM27 4h-5a2 2 0 0 0-2 2v9h2V6h5v9h2V6a2 2 0 0 0-2-2M15 4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 13V6h10v7z"
      />
    </Svg>
  );
}

export function StackedEmailOutlineRoundedIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M7 17q-.825 0-1.412-.587T5 15V5q0-.825.588-1.412T7 3h14q.825 0 1.413.588T23 5v10q0 .825-.587 1.413T21 17zm6.425-5.1L7 7.425V15h14V7.425L14.575 11.9q-.275.2-.575.2t-.575-.2M14 9.85L21 5H7zM3 21q-.825 0-1.412-.587T1 19V7.5q0-.425.288-.712T2 6.5t.713.288T3 7.5V19h15.5q.425 0 .713.288T19.5 20t-.288.713T18.5 21zM21 7.35V5H7v2.35V5h14z"
      />
    </Svg>
  );
}

export function TimeRewindIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 14 14" className={className}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M.5 7A6.5 6.5 0 1 0 7 .5a7.23 7.23 0 0 0-5 2" />
        <path d="m2.5.5l-.5 2L4 3m3 .5v4L4.4 8.8" />
      </g>
    </Svg>
  );
}

export function BloggerBIcon({ className }: IconProps) {
  return (
    <Svg viewBox="0 0 640 640" className={className}>
      <path
        fill="currentColor"
        d="M542.6 286.7c-1.8-8-6.8-15.4-12.5-18.5c-1.8-1-13-2.2-25-2.7c-20.1-.9-22.3-1.3-28.7-5c-10.1-5.9-12.8-12.3-12.9-29.5c-.1-33-13.8-63.7-40.9-91.3c-19.3-19.7-40.9-33-65.5-40.5c-5.9-1.8-19.1-2.4-63.3-2.9c-69.4-.8-84.8.6-108.4 10c-43.5 17.2-74.7 53.8-86.1 100.6c-2.1 8.8-2.6 22.9-3.1 103.9c-.6 101.5.1 116.4 6.4 136.5c15.6 49.6 59.9 86.3 104.4 94.3c14.8 2.7 197.3 3.3 216 .8c32.5-4.4 58-17.5 81.9-41.9c17.3-17.7 28.1-36.8 35.2-62.1c4.9-17.6 4.5-142.8 2.5-151.7m-322.1-63.6c7.8-7.9 10-8.2 58.8-8.2c43.9 0 45.4.1 51.8 3.4c9.3 4.7 13.4 11.3 13.4 21.9c0 9.5-3.8 16.2-12.3 21.6c-4.6 2.9-7.3 3.1-50.3 3.3c-26.5.2-47.7-.4-50.8-1.2c-16.6-4.7-22.8-28.5-10.6-40.8m191.8 199.8l-14.9 2.4l-77.5.9c-68.1.8-87.3-.4-90.9-2c-7.1-3.1-13.8-11.7-14.9-19.4c-1.1-7.3 2.6-17.3 8.2-22.4c7.1-6.4 10.2-6.6 97.3-6.7c89.6-.1 89.1-.1 97.6 7.8c12.1 11.3 9.5 31.2-4.9 39.4"
      />
    </Svg>
  );
}

/** 图标名 -> 组件映射（数据文件用短名引用，避免字符串漂移） */
export type IconName =
  | 'mail'
  | 'telegram'
  | 'computer'
  | 'sunny'
  | 'dark-mode'
  | 'android-contacts'
  | 'ibm-cloud-projects'
  | 'stacked-email'
  | 'time-rewind'
  | 'blogger-b';

export const ICONS: Record<IconName, FC<IconProps>> = {
  mail: MailRoundedIcon,
  telegram: TelegramIcon,
  computer: ComputerIcon,
  sunny: SunnyIcon,
  'dark-mode': DarkModeIcon,
  'android-contacts': AndroidContactsIcon,
  'ibm-cloud-projects': IbmCloudProjectsIcon,
  'stacked-email': StackedEmailOutlineRoundedIcon,
  'time-rewind': TimeRewindIcon,
  'blogger-b': BloggerBIcon,
};
