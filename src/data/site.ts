import type { IconName } from '../components/icons';

export const SITE_NAME = "Echo's Homepage";

export const DESCRIPTION =
  'Echo 的个人主页 — 一名高一编程爱好者，主攻 TypeScript 和 Python，以兴趣驱动开发。';

/** 第二屏头部展示的主人名字与一句话介绍 */
export const OWNER_NAME = 'Echo';
export const OWNER_INTRO =
  '一名高一编程爱好者，主攻 TypeScript 和 Python，以兴趣驱动开发。';

/** 第二屏头部技能标签 */
export const SKILLS = ['TypeScript', 'Python'];

/** 头像本地化（构建时静态资源，同源 + 可缓存，替代 115KB 的第三方图床请求） */
export const AVATAR_URL = '/avatar.webp';

/** 打字机轮换的名字 */
export const TYPEWRITER_NAMES = ['Echo', 'LoveEcho', '菠萝'];

export interface LinkItem {
  icon: IconName;
  label: string;
  href: string;
  external?: boolean;
  /** 卡片上的辅助说明（联系方式写具体地址/账号，项目写一句话简介） */
  description?: string;
  /** 项目技术/性质标签（仅项目列表布局展示） */
  tags?: string[];
}

export const CONTACTS: LinkItem[] = [
  {
    icon: 'mail',
    label: '邮箱',
    href: 'mailto:janemlewisa29@gmail.com',
    description: 'janemlewisa29@gmail.com',
  },
  {
    icon: 'telegram',
    label: '电报联系地址',
    href: 'https://t.me/FastTalker_bot',
    external: true,
    description: 'FastTalker_bot',
  },
];

export const PROJECTS: LinkItem[] = [
  {
    icon: 'blogger-b',
    label: '个人博客',
    href: 'https://010912.top',
    external: true,
    description: '记录学习过程与生活碎片的自留地。',
    tags: ['随笔', '技术'],
  },
  {
    icon: 'stacked-email',
    label: '临时邮箱',
    href: 'https://email.010912.top',
    external: true,
    description: '即开即用的临时邮箱小工具。',
    tags: ['在线工具'],
  },
  {
    icon: 'time-rewind',
    label: '新年倒计时网站',
    href: 'https://newyear.010912.top',
    external: true,
    description: '跨年倒计时活动页，TypeScript 开发。',
    tags: ['TypeScript', '活动页'],
  },
];
