import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * 把构建时注入的壁纸 URL（public/wallpaper.json）写进 index.html 的 preload，
 * 让壁纸图在 HTML 解析阶段即开始并行下载——LCP 关键路径从
 * 「JS → 第三方 API → 大图下载」缩短为「HTML → 直接下载 UHD(3840×2160) 壁纸」。
 * 低优先级：不抢占 CSS/JS/头像的带宽。
 */
function wallpaperPreload(): Plugin {
  return {
    name: 'wallpaper-preload',
    apply: 'build',
    transformIndexHtml() {
      try {
        const data = JSON.parse(readFileSync('public/wallpaper.json', 'utf8')) as {
          url?: string;
        };
        if (data?.url) {
          return [
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'image',
                href: data.url,
                fetchpriority: 'low',
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
