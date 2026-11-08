import { memo, useState } from 'react';
import type { WallpaperData } from '../hooks/useWallpaper';

interface WallpaperProps {
  data: WallpaperData | null;
}

/**
 * 全屏响应式壁纸：srcSet/sizes 让浏览器按设备选择 1280 / 1920 / UHD。
 * 加载状态按资源键隔离，切换当日图片时不会被上一张的失败状态卡住。
 * 作为装饰背景对读屏隐藏，失败时回退首屏底色。
 */
export const Wallpaper = memo(function Wallpaper({ data }: WallpaperProps) {
  const sourceKey = data ? `${data.url}|${data.srcSet ?? ''}` : '';
  const [result, setResult] = useState<{ key: string; status: 'loaded' | 'failed' } | null>(null);
  const status = result?.key === sourceKey ? result.status : 'loading';

  if (!data || status === 'failed') return null;

  return (
    <img
      key={sourceKey}
      src={data.url}
      srcSet={data.srcSet}
      sizes={
        data.srcSet
          ? '(max-width: 480px) and (orientation: portrait) 178vh, (max-width: 480px) 100vw, 100vw'
          : undefined
      }
      alt=""
      aria-hidden="true"
      decoding="async"
      fetchPriority="high"
      onLoad={() => setResult({ key: sourceKey, status: 'loaded' })}
      onError={() => {
        console.warn('壁纸图片加载失败，回退为纯色背景:', data.url);
        setResult({ key: sourceKey, status: 'failed' });
      }}
      className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[800ms] motion-reduce:transition-none ${
        status === 'loaded' ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
});
