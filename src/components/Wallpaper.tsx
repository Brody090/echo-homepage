import { useEffect, useState } from 'react';

interface WallpaperProps {
  src: string;
  alt: string;
}

/**
 * 全屏壁纸。loaded 只在 <img> 真正解码完成时置 true（而不是 URL 拿到时），
 * 保证 800ms 渐显发生在图片可用之后，不再出现「先空白后闪出」；
 * 加载失败时优雅退回首屏底色（不显示破碎图）并输出警告。
 * 低优先级 + 异步解码，把网络预算让给文字与头像。
 */
export function Wallpaper({ src, alt }: WallpaperProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      fetchPriority="low"
      onLoad={() => setLoaded(true)}
      onError={() => {
        console.warn('壁纸图片加载失败，回退为纯色背景:', src);
        setFailed(true);
      }}
      className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[800ms] ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
