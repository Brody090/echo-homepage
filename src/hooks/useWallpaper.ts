import { useEffect, useState } from 'react';

export interface WallpaperData {
  date: string;
  url: string;
  srcSet?: string;
  copyright: string;
}

const CACHE_KEY = 'echo-homepage-wallpaper';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeData(value: unknown): WallpaperData | null {
  if (!isRecord(value) || typeof value.date !== 'string' || typeof value.url !== 'string') return null;
  if (!value.date || !value.url) return null;
  const srcSet = typeof value.srcSet === 'string' && value.srcSet.trim() ? value.srcSet : undefined;
  return {
    date: value.date,
    url: value.url,
    copyright: typeof value.copyright === 'string' && value.copyright ? value.copyright : 'Bing 每日壁纸',
    ...(srcSet ? { srcSet } : {}),
  };
}

function readCache(): WallpaperData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeCache(data: WallpaperData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // 隐私模式 / 存储满时静默降级
  }
}

async function fetchSnapshot(signal: AbortSignal): Promise<WallpaperData | null> {
  const res = await fetch('/wallpaper.json', { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
  return normalizeData(await res.json());
}

async function fetchApi(signal: AbortSignal): Promise<WallpaperData | null> {
  const res = await fetch('/api/wallpaper', { signal });
  if (!res.ok) throw new Error(`api HTTP ${res.status}`);
  return normalizeData(await res.json());
}

/**
 * 三段式壁纸加载：localStorage 缓存 → 静态快照 → API 当日更新。
 * 缓存、快照与 API 均带 srcSet，由 <img> 按设备宽度选择资源。
 * 元数据请求可取消；图片加载状态由 Wallpaper 按资源键管理，避免切换时闪烁或卡在失败态。
 */
export function useWallpaper() {
  // 只在挂载时读取一次，避免滚动引发父组件渲染时重复访问 localStorage。
  const [cached] = useState(readCache);
  const [current, setCurrent] = useState<WallpaperData | null>(cached);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const boot = async () => {
      try {
        const snap = await fetchSnapshot(controller.signal);
        if (cancelled) return;
        if (snap) setCurrent(snap);

        // 快照与缓存完全一致时不重复请求 API；旧缓存缺少 srcSet 时仍升级。
        if (cached && snap && cached.date === snap.date && cached.srcSet === snap.srcSet) return;

        const fresh = await fetchApi(controller.signal);
        if (cancelled || !fresh) return;
        // 同一天已有响应式快照时继续用本地图，避免首屏快照与边缘图重复下载。
        if (snap?.srcSet && fresh.date === snap.date) {
          writeCache(snap);
          return;
        }
        setCurrent(fresh);
        writeCache(fresh);
      } catch {
        // 保留缓存或纯色背景；图片自身加载失败由 Wallpaper 降级。
      }
    };
    void boot();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cached]);

  return { data: current };
}
