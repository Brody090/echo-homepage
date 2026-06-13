# Echo's Homepage

[![License](https://img.shields.io/github/license/Brody090/echo-homepage)](LICENSE)
![Tech Stack](https://img.shields.io/badge/tech-HTML%20%2B%20CSS%20%2B%20JS-orange)

🔗 **线上地址：[https://010912.top](https://010912.top)**

我的个人主页，纯原生三件套搭建，毛玻璃风格，支持暗黑模式。

## 特性

- **Bing 每日壁纸** — 启动时自动获取当日 Bing 壁纸作为首屏背景
- **打字机效果** — 名字（Echo / LoveEcho / 菠萝）逐字打印并循环轮换
- **共享头像过渡** — 滚动时头像从首屏平滑过渡到第二屏
- **Apple 毛玻璃风格** — `backdrop-filter` 模糊 + 半透明背景
- **暗黑 / 明亮 / 自动** — 三态主题切换，`localStorage` 持久化偏好
- **响应式** — 桌面 / 平板 / 手机三档适配

## 技术栈

HTML + CSS + JavaScript，零依赖，无框架，无构建步骤。

## 项目结构

```
index.html   — 页面结构 + SEO / Open Graph / 结构化数据
style.css    — 样式（CSS 变量主题系统，四组主题色）
script.js    — 交互逻辑（壁纸获取、打字机、头像过渡、主题切换）
logo.png     — 网站图标
```

## 部署

纯静态文件，直接部署到任意静态托管服务即可：

```bash
# 示例：用任意 HTTP 服务器本地预览
npx serve .
```

## License

[MIT](LICENSE) © Echo
