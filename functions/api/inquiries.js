function isAuthed(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/noaa_admin_session=([^;]+)/);
  if (!match) return false;
  return decodeURIComponent(match[1]) === env.ADMIN_PASSWORD;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthed(request, env)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "DB not configured" }), { status: 500 });
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM inquiries ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify({ items: results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isAuthed(request, env)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "DB not configured" }), { status: 500 });
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const id = data.id;
  const status = data.status;
  const note = data.note || "";

  if (!id || !status) {
    return new Response(JSON.stringify({ error: "invalid input" }), { status: 400 });
  }

  const respondedAt = status === "responded" ? new Date().toISOString() : null;

  await env.DB.prepare(
    "UPDATE inquiries SET status = ?, note = ?, responded_at = COALESCE(?, responded_at) WHERE id = ?"
  ).bind(status, note, respondedAt, id).run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
