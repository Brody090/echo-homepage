# Echo's Homepage

[![License](https://img.shields.io/github/license/Brody090/echo-homepage)](LICENSE)
![Tech Stack](https://img.shields.io/badge/tech-React%20%2B%20TypeScript%20%2B%20Tailwind%20CSS-blue)

🔗 **线上地址：[https://010912.top](https://010912.top)**

我的个人主页，基于 React + TypeScript + Tailwind CSS 构建，Apple 毛玻璃风格，支持暗黑模式。

## 特性

- **Bing 每日壁纸** — 启动时自动获取当日 Bing 壁纸作为首屏背景
- **打字机效果** — 名字（Echo / LoveEcho / 菠萝）逐字打印并循环轮换
- **共享头像过渡** — 滚动时头像从首屏平滑过渡到第二屏
- **Apple 毛玻璃风格** — `backdrop-filter` 模糊 + 半透明背景
- **暗黑 / 明亮 / 自动** — 三态主题切换，`localStorage` 持久化偏好
- **响应式** — 桌面 / 平板 / 手机三档适配

## 技术栈

Vite + React 19 + TypeScript + Tailwind CSS v4

## 项目结构

```
src/
├─ main.tsx            # React 入口
├─ App.tsx             # 组装两屏与共享头像
├─ index.css           # Tailwind v4 主题令牌 + 毛玻璃基础类
├─ data/site.ts        # 名字、联系方式、项目链接等常量
├─ hooks/              # useTheme / useTypewriter / useWallpaper / useScrollProgress
└─ components/         # 两屏与各 UI 组件
```

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 产物构建（dist/）
npm run preview  # 预览构建产物
```

## 部署

静态构建产物，输出目录为 `dist/`。Cloudflare Pages 配置：

- 构建命令：`npm run build`
- 输出目录：`dist`

## License

[MIT](LICENSE) © Echo
