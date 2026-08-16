export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    return new Response(
      "OAuth error: " + (tokenData.error_description || tokenData.error || "unknown"),
      { status: 400 }
    );
  }

  const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
  const message = "authorization:github:success:" + payload;

  const html =
    "<!DOCTYPE html><html><body><script>" +
    "(function(){" +
    "function receiveMessage(e){" +
    "window.opener.postMessage(" + JSON.stringify(message) + ", e.origin);" +
    "window.removeEventListener('message', receiveMessage, false);" +
    "}" +
    "window.addEventListener('message', receiveMessage, false);" +
    "window.opener.postMessage('authorizing:github', '*');" +
    "})();" +
    "</script></body></html>";

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
