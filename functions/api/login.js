export async function onRequestPost(context) {
  const { request, env } = context;
  let data;
  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const password = (data.password || "").trim();

  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "invalid password" }), { status: 401 });
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    "noaa_admin_session=" + encodeURIComponent(env.ADMIN_PASSWORD) +
    "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400"
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
