import { useEffect, useState } from 'react';

interface WallpaperData {
  date: string;
  url: string;
  copyright: string;
}

export interface WallpaperState {
  src: string;
  alt: string;
  copyright: string;
}

const CACHE_KEY = 'echo-homepage-wallpaper';
const FALLBACK_COPYRIGHT = 'Bing 每日壁纸';

/**
 * 壁纸来源改为「构建时注入」：读同源 /wallpaper.json（scripts/fetch-wallpaper.mjs 在构建时
 * 从 Bing 官方 API 抓取当日 1920×1080 壁纸，vite 构建时把 URL 注入 index.html preload），
 * 运行时不再依赖 11.6s 的第三方代理 API。JSON 请求失败时用 localStorage 当日缓存兜底；
 * 全部失败则首屏保持纯底色。图片本身是否加载完成由 Wallpaper 组件的 onLoad 判定。
 */
export function useWallpaper() {
  const [state, setState] = useState<WallpaperState>({
    src: '',
    alt: '',
    copyright: '加载中...',
  });

  useEffect(() => {
    let cancelled = false;

    const apply = (data: WallpaperData) => {
      if (cancelled) return;
      setState({
        src: data.url,
        alt: data.copyright || FALLBACK_COPYRIGHT,
        copyright: data.copyright || FALLBACK_COPYRIGHT,
      });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        /* 隐私模式等场景 localStorage 不可用，忽略 */
      }
    };

    const fromCache = (): WallpaperData | null => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as Partial<WallpaperData>;
        if (typeof data.url === 'string' && data.url) {
          return {
            date: data.date ?? '',
            url: data.url,
            copyright: data.copyright ?? FALLBACK_COPYRIGHT,
          };
        }
      } catch {
        /* 损坏的缓存直接忽略 */
      }
      return null;
    };

    fetch('/wallpaper.json', { cache: 'default' })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json() as Promise<Partial<WallpaperData>>;
      })
      .then(data => {
        if (!data || typeof data.url !== 'string' || !data.url) {
          throw new Error('no wallpaper url');
        }
        apply({
          date: data.date ?? '',
          url: data.url,
          copyright: data.copyright ?? FALLBACK_COPYRIGHT,
        });
      })
      .catch(err => {
        console.warn('壁纸获取失败，使用本地缓存兜底:', err?.message ?? err);
        if (cancelled) return;
        const cached = fromCache();
        setState({
          src: cached?.url ?? '',
          alt: cached?.copyright ?? FALLBACK_COPYRIGHT,
          copyright: cached?.copyright ?? FALLBACK_COPYRIGHT,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
