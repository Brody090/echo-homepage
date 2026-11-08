import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * 把构建时注入的壁纸 URL（public/wallpaper.json）写进 index.html 的 preload，
 * 让壁纸图在 HTML 解析阶段即开始并行下载，并通过 imagesrcset/imagesizes
 * 选择 1280 / 1920 / UHD，避免移动端预载桌面大图。与实际 <img> 同为高优先级，
 * 确保浏览器复用预载请求，缩短 LCP 关键路径。
 */
function wallpaperPreload(): Plugin {
  return {
    name: 'wallpaper-preload',
    apply: 'build',
    transformIndexHtml() {
      try {
        const data = JSON.parse(readFileSync('public/wallpaper.json', 'utf8')) as {
          url?: string;
          srcSet?: string;
        };
        if (data?.url) {
          return [
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'image',
                href: data.url,
                fetchpriority: 'high',
                ...(data.srcSet
                  ? {
                      imagesrcset: data.srcSet,
                      imagesizes: '(max-width: 480px) and (orientation: portrait) 178vh, (max-width: 480px) 100vw, 100vw',
                    }
                  : {}),
              },
              injectTo: 'head-prepend',
            },
          ];
        }
      } catch {
        /* wallpaper.json 不存在时静默跳过（离线构建） */
      }
      return [];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), wallpaperPreload()],
});
