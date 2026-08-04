export const SITE_NAME = "Echo's Homepage";

export const DESCRIPTION =
  'Echo 的个人主页 — 一名高一编程爱好者，主攻 TypeScript 和 Python，以兴趣驱动开发。';

export const AVATAR_URL =
  'https://img.010912.top/file/网站相关/1784033194646_Github头像.webp';

/** 打字机轮换的名字 */
export const TYPEWRITER_NAMES = ['Echo', 'LoveEcho', '菠萝'];

export interface LinkItem {
  icon: string;
  label: string;
  href: string;
  external?: boolean;
}

export const CONTACTS: LinkItem[] = [
  { icon: 'material-symbols:mail-rounded', label: '邮箱', href: 'mailto:janemlewisa29@gmail.com' },
  {
    icon: 'fa7-brands:telegram',
    label: '电报联系地址',
    href: 'https://t.me/FastTalker_bot',
    external: true,
  },
];

export const PROJECTS: LinkItem[] = [
  {
    icon: 'fa7-brands:blogger-b',
    label: '个人博客',
    href: 'https://010912.top',
    external: true,
  },
  {
    icon: 'material-symbols:stacked-email-outline-rounded',
    label: '临时邮箱',
    href: 'https://email.010912.top',
    external: true,
  },
  {
    icon: 'streamline:interface-time-rewind-back-return-clock-timer-countdown',
    label: '新年倒计时网站',
    href: 'https://newyear.010912.top',
    external: true,
  },
];
