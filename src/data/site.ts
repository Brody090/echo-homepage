import type { IconName } from '../components/icons';

export const SITE_NAME = "Echo's Homepage";

export const DESCRIPTION =
  'Echo 的个人主页 — 一名高一编程爱好者，主攻 TypeScript 和 Python，以兴趣驱动开发。';

/** 头像本地化（构建时静态资源，同源 + 可缓存，替代 115KB 的第三方图床请求） */
export const AVATAR_URL = '/avatar.webp';

/** 打字机轮换的名字 */
export const TYPEWRITER_NAMES = ['Echo', 'LoveEcho', '菠萝'];

export interface LinkItem {
  icon: IconName;
  label: string;
  href: string;
  external?: boolean;
}

export const CONTACTS: LinkItem[] = [
  { icon: 'mail', label: '邮箱', href: 'mailto:janemlewisa29@gmail.com' },
  {
    icon: 'telegram',
    label: '电报联系地址',
    href: 'https://t.me/FastTalker_bot',
    external: true,
  },
];

export const PROJECTS: LinkItem[] = [
  {
    icon: 'blogger-b',
    label: '个人博客',
    href: 'https://010912.top',
    external: true,
  },
  {
    icon: 'stacked-email',
    label: '临时邮箱',
    href: 'https://email.010912.top',
    external: true,
  },
  {
    icon: 'time-rewind',
    label: '新年倒计时网站',
    href: 'https://newyear.010912.top',
    external: true,
  },
];
