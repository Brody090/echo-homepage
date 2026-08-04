import { useEffect, useState } from 'react';

const WALLPAPER_API = 'https://bing.biturl.top/?resolution=UHD&format=json&index=0&mkt=zh-CN';

export interface WallpaperState {
  src: string;
  alt: string;
  copyright: string;
  loaded: boolean;
}

/** 获取 Bing 每日壁纸与版权信息；失败时保留首屏底色并给出兜底文案 */
export function useWallpaper() {
  const [state, setState] = useState<WallpaperState>({
    src: '',
    alt: '',
    copyright: '加载中...',
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    fetch(WALLPAPER_API)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setState({
          src: data?.url ?? '',
          alt: data?.copyright || 'Bing 每日壁纸',
          copyright: data?.copyright || 'Bing 每日壁纸',
          loaded: true,
        });
      })
      .catch(err => {
        console.warn('壁纸获取失败:', err.message);
        if (cancelled) return;
        setState(prev => ({ ...prev, copyright: 'Bing 每日壁纸', loaded: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
