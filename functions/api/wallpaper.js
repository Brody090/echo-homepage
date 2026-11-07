// Cloudflare Pages Functions: GET /api/wallpaper
// 边缘代理 Bing HPImageArchive，返回当日元数据与同源响应式 srcSet。
// JSON 短缓存，错误响应 no-store；前端只比较更新日期，旧缓存可安全续用。
const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
const UA = 'Mozilla/5.0 (echo-homepage edge)';
const TIMEOUT_MS = 12_000;
const VARIANTS = [
  { resolution: '1280x720', width: 1280 },
  { resolution: '1920x1080', width: 1920 },
  { resolution: 'UHD', width: 3840 },
];

export async function onRequestGet() {
  try {
    // workerd 需手动 AbortController，不能依赖 AbortSignal.timeout。
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

    // 优先从 url 提取完整 imageId；urlbase 可能缺少分辨率后缀。
    const src = typeof img.url === 'string' && img.url ? img.url : img.urlbase;
    const m = /[?&]id=(OHR\.[A-Za-z0-9_.\-]{1,160})(?:&|$)/.exec(src);
    if (!m) throw new Error('bad image id: ' + src);
    const baseImageId = m[1].replace(/\.jpg$/, '').replace(/_(?:UHD|\d+x\d+)$/, '');
    const imageUrl = resolution => `/api/wallpaper-image/${baseImageId}_${resolution}.jpg`;
    const srcSet = VARIANTS.map(variant => `${imageUrl(variant.resolution)} ${variant.width}w`).join(', ');
    const date = `${img.startdate.slice(0, 4)}-${img.startdate.slice(4, 6)}-${img.startdate.slice(6, 8)}`;

    return Response.json(
      {
        date,
        url: imageUrl('UHD'),
        srcSet,
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
