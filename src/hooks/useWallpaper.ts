import { useEffect, useRef, useState } from 'react';

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
/** 边缘代理的当日壁纸接口(见 functions/api/wallpaper.js);本地 dev / preview 无 functions 环境时 404 → 静默降级 */
const API_URL = '/api/wallpaper';

/** date 均为 YYYY-MM-DD,ISO 字符串字典序 == 时间序 */
const isNewer = (next: string, current: string) => next !== '' && next > current;

function readCache(): WallpaperData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<WallpaperData>;
    if (typeof data.url === 'string' && data.url) {
      return {
        date: typeof data.date === 'string' ? data.date : '',
        url: data.url,
        copyright:
          typeof data.copyright === 'string' && data.copyright ? data.copyright : FALLBACK_COPYRIGHT,
      };
    }
  } catch {
    /* 隐私模式 localStorage 不可用 / 缓存损坏:直接忽略 */
  }
  return null;
}

/**
 * 壁纸三段式加载(WALLPAPER-DAILY-DESIGN.md §5):
 * ① 同步读 localStorage 缓存 → 有则立即渲染(0 等待占位)
 * ② fetch('/wallpaper.json') 同源快照(构建时注入,兜底 + preload 热图) → 仅日期更新时应用
 * ③ 后台 fetch('/api/wallpaper')(Cloudflare Pages Functions 边缘代理拿当日新图)
 *    仅当日期严格更新:探针预加载成功后才换图并写缓存;失败静默保持当前画面(绝不破图)
 *
 * 降级链:localStorage → 快照 → api 新图 → 保持现状,任何单点失败都不比历史行为更糟。
 * 所有第三方请求均经本站 functions,前端绝不直连 bing.com。
 */
export function useWallpaper() {
  // 阶段 ①:同步读缓存(useState 惰性初始化仅在首渲染执行一次)
  const [initialCache] = useState<WallpaperData | null>(readCache);
  const [state, setState] = useState<WallpaperState>(() => ({
    src: initialCache?.url ?? '',
    alt: initialCache?.copyright ?? '',
    copyright: initialCache?.copyright ?? '加载中...',
  }));
  /** 镜像当前 date,供异步回调做日期比较(避免闭包旧值) */
  const dateRef = useRef<string>(initialCache?.date ?? '');

  useEffect(() => {
    let cancelled = false;

    const apply = (data: WallpaperData) => {
      if (cancelled) return;
      dateRef.current = data.date;
      setState({
        src: data.url,
        alt: data.copyright,
        copyright: data.copyright,
      });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        /* 隐私模式等场景 localStorage 不可用,忽略 */
      }
    };

    // 快照/api 数据仅当日期严格更新才升级(同日期一律不换,避免白费一次换图)
    const applyIfNewer = (data: WallpaperData) => {
      if (isNewer(data.date, dateRef.current)) apply(data);
    };

    // 阶段 ②:同源快照(现有链路,保留原样,仅把 apply 改为带日期比较)
    fetch('/wallpaper.json', { cache: 'default' })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json() as Promise<Partial<WallpaperData>>;
      })
      .then(data => {
        if (!data || typeof data.url !== 'string' || !data.url) {
          throw new Error('no wallpaper url');
        }
        applyIfNewer({
          date: data.date ?? '',
          url: data.url,
          copyright: data.copyright ?? FALLBACK_COPYRIGHT,
        });
      })
      .catch(err => {
        console.warn('壁纸获取失败，使用本地缓存兜底:', err?.message ?? err);
        if (cancelled) return;
        // 缓存已在阶段 ① 应用;仅当画面仍为空(无缓存)时落回纯色占位
        setState(prev => (prev.src ? prev : { src: '', alt: FALLBACK_COPYRIGHT, copyright: FALLBACK_COPYRIGHT }));
      });

    // 阶段 ③:后台拿当日新鲜度(不阻塞首屏);标签页 hidden→visible 时重查(覆盖跨夜打开场景)
    const refreshFromApi = () => {
      fetch(API_URL, { cache: 'default' })
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json() as Promise<Partial<WallpaperData>>;
        })
        .then(data => {
          if (!data || typeof data.url !== 'string' || !data.url) {
            throw new Error('bad api payload');
          }
          if (cancelled) return;
          const next: WallpaperData = {
            date: data.date ?? '',
            url: data.url,
            copyright: data.copyright ?? FALLBACK_COPYRIGHT,
          };
          if (!isNewer(next.date, dateRef.current)) return; // 不比当前新 → 忽略,不换图不重复下载
          // 探针预加载:新 URL 真正加载成功才切换,失败静默保持当前画面(防纯色/破图)
          const probe = new Image();
          probe.onload = () => apply(next);
          probe.onerror = () => {
            /* 保持当前画面(快照/缓存),静默 */
          };
          probe.src = next.url;
        })
        .catch(err => {
          // 本地 dev / vite preview 无 functions(404),或线上 502/超时:静默保持快照画面
          if (import.meta.env.DEV) console.warn('api 壁纸刷新不可用，保持快照:', err?.message ?? err);
        });
    };
    refreshFromApi();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshFromApi();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return state;
}
