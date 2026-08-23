// Cloudflare Pages Functions: GET /api/wallpaper-image/<imageId>
// 代理 Bing 图片本体(硬编码拼接 https://www.bing.com/th?id=<id>)流式回传,
// 使图片最终同源加载(浏览器不跨域直连 bing.com)。
//
// 路由说明:Pages Functions 文件路由只保证支持 [[path]] 通配捕获
// (单括号 [param] 命名段不是 Pages 的文档化路由形态),因此用通配捕获 imageId
// 并在函数内白名单校验——URL 契约与设计文档一致:
//   /api/wallpaper-image/OHR.YellowstoneTrail_ZH-CN231234_1920x1080.jpg
//
// 防开放代理(安全关键):imageId 必须匹配 ^OHR\.[A-Za-z0-9_.\-]{1,160}$,
// 不通过直接 404;上游地址只能是指定的 bing 图地址,无 SSRF/任意内容代理面。
// 图片 URL 内容寻址(每日不同)→ 同 URL = 同图 = 永不变,可 immutable 缓存一年;
// 错误响应一律 no-store。_headers 对 Functions 响应不生效,安全头在此显式设置。

const UA = 'Mozilla/5.0 (echo-homepage edge)';
const ID_RE = /^OHR\.[A-Za-z0-9_.\-]{1,160}$/;
const TIMEOUT_MS = 15_000;

export async function onRequestGet(context) {
  const raw = context.params?.path;
  const imageId = Array.isArray(raw) ? raw.join('/') : String(raw ?? '');
  if (!ID_RE.test(imageId)) {
    return new Response('bad image id', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let upstream;
    try {
      upstream = await fetch('https://www.bing.com/th?id=' + imageId, {
        headers: { 'User-Agent': UA },
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!upstream.ok) throw new Error('bing image HTTP ' + upstream.status);
    const type = upstream.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) throw new Error('not an image: ' + type);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return new Response('image fetch failed', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
