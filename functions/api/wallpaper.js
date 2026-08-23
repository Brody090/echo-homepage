// Cloudflare Pages Functions: GET /api/wallpaper
// 边缘代理 Bing HPImageArchive(服务端 fetch 不受浏览器 CORS 约束),返回与
// public/wallpaper.json 同构的当日壁纸元数据 {date,url,copyright};
// url 指向本站代理端点 /api/wallpaper-image/<imageId>(内容寻址:每日不同 → 可 immutable 缓存)。
//
// 缓存策略(见 WALLPAPER-DAILY-DESIGN.md §4.1):
// - s-maxage=1800:共享缓存 30 分钟,回源量 ≈ 每 PoP 每 30 分钟 1 次(免费额度内)
// - stale-while-revalidate=3600:Bing 抖动/超时期间边缘返回旧 JSON(旧日期被前端日期比较忽略,无害)
// - max-age=300:浏览器缓存 5 分钟
// - 错误响应一律 no-store,绝不污染缓存
//
// 注意:workerd 运行时禁用 AbortSignal.timeout(未捕获 DOMException,cloudflare/workerd#1020),
// 必须手动 AbortController + setTimeout 实现超时。

const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
const UA = 'Mozilla/5.0 (echo-homepage edge)';
const TIMEOUT_MS = 12_000;

export async function onRequestGet() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(BING_API, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('bing HTTP ' + res.status);
    const data = await res.json();
    const img = data?.images?.[0];
    if (!img?.startdate || (typeof img.url !== 'string' && typeof img.urlbase !== 'string'))
      throw new Error('unexpected payload');
    // 注意:必须优先从 url 提取完整 imageId——Bing 的 urlbase 字段可能不带分辨率后缀
    // (实测 2026-08-22:urlbase="/th?id=OHR.EndofHeatY26_ZH-CN8936468848",按它拼上游会 404;
    // url="/th?id=OHR.EndofHeatY26_ZH-CN8936468848_1920x1080.jpg&rf=...&pid=hp" 才是完整可用 id)。
    // 提取规则:在 "id=" 与下一个 "&" 之间取 imageId,并一步完成白名单校验
    const src = typeof img.url === 'string' && img.url ? img.url : img.urlbase;
    const m = /[?&]id=(OHR\.[A-Za-z0-9_.\-]{1,160})(?:&|$)/.exec(src);
    if (!m) throw new Error('bad image id: ' + src);
    // 清晰度:把 Bing 默认的 1920×1080 分辨率后缀升级为 UHD(3840×2160),大屏不再模糊;
    // 已带 UHD 后缀或 urlbase 无后缀时保持不变(维持原行为)
    const imageId = m[1].replace(/_\d+x\d+\.jpg$/, '_UHD.jpg');
    const date = `${img.startdate.slice(0, 4)}-${img.startdate.slice(4, 6)}-${img.startdate.slice(6, 8)}`;
    return Response.json(
      {
        date,
        url: `/api/wallpaper-image/${imageId}`,
        copyright: img.copyright || 'Bing 每日壁纸',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
