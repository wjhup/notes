/**
 * 全站密码保护 —— Cloudflare Pages Functions 中间件
 *
 * 密码保存在 Cloudflare Pages 后台的环境变量 SITE_PASSWORD 中（加密存储），
 * 不写在代码里、也不会进 GitHub 仓库。改密码只需后台改环境变量后重新部署。
 *
 * 若未设置 SITE_PASSWORD 环境变量，站点将拒绝访问（fail closed）。
 */

const COOKIE_NAME = "site_auth"
const SESSION_DAYS = 30

async function sha256(text) {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function readCookie(header, name) {
  for (const part of (header || "").split(";")) {
    const [k, ...v] = part.trim().split("=")
    if (k === name) return v.join("=")
  }
  return null
}

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>需要密码 · wjhup.com</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #faf8f8; color: #2b2b2b; padding: 1.5rem;
  }
  @media (prefers-color-scheme: dark) { body { background: #161618; color: #ebebec; } }
  .card {
    width: 100%; max-width: 22rem; padding: 2rem; border-radius: 12px;
    background: #fff; border: 1px solid #e5e5e5; box-shadow: 0 8px 24px rgba(0,0,0,.06);
  }
  @media (prefers-color-scheme: dark) {
    .card { background: #1e1e20; border-color: #393639; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
  }
  h1 { margin: 0 0 .5rem; font-size: 1.25rem; font-weight: 600; }
  p { margin: 0 0 1.25rem; font-size: .9rem; opacity: .7; line-height: 1.6; }
  input {
    width: 100%; padding: .7rem .85rem; font-size: 1rem; border-radius: 8px;
    border: 1px solid #d8d8d8; background: transparent; color: inherit; outline: none;
  }
  @media (prefers-color-scheme: dark) { input { border-color: #4a4a4d; } }
  input:focus { border-color: #284b63; }
  button {
    width: 100%; margin-top: .85rem; padding: .7rem; font-size: 1rem; font-weight: 500;
    border: none; border-radius: 8px; cursor: pointer; background: #284b63; color: #fff;
  }
  button:hover { filter: brightness(1.1); }
  .error { color: #c0392b; font-size: .85rem; margin-top: .75rem; display: ${error ? "block" : "none"}; }
</style>
</head>
<body>
  <form class="card" method="POST" action="?__login=1">
    <h1>该站点受密码保护</h1>
    <p>请输入访问密码后继续浏览。</p>
    <input type="password" name="password" placeholder="访问密码" autofocus autocomplete="current-password" required>
    <button type="submit">进入站点</button>
    <div class="error">密码不正确，请重试。</div>
  </form>
</body>
</html>`
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const password = env.SITE_PASSWORD

  // 未配置密码：拒绝访问，避免防护被静默跳过
  if (!password) {
    return new Response(
      "站点未配置 SITE_PASSWORD 环境变量，访问保护已生效但无法校验。请在 Cloudflare Pages 后台设置该变量。",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    )
  }

  const token = await sha256(password)
  const isAuthed = readCookie(request.headers.get("Cookie"), COOKIE_NAME) === token

  // 处理登录提交
  if (url.searchParams.get("__login") === "1" && request.method === "POST") {
    if (isAuthed) {
      return next(url, context)
    }
    const form = await request.formData()
    const input = form.get("password") || ""
    if (input === password) {
      const target = new URL(request.url)
      target.searchParams.delete("__login")
      return new Response(null, {
        status: 303,
        headers: {
          Location: target.pathname + (target.search || ""),
          "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
          "Cache-Control": "no-store",
        },
      })
    }
    return new Response(loginPage(true), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  }

  if (isAuthed) return next(url, context)

  return new Response(loginPage(false), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })
}

async function next(url, context) {
  const res = await context.next()
  // 已登录状态下不缓存受保护内容
  const headers = new Headers(res.headers)
  headers.set("Cache-Control", "private, no-store")
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
