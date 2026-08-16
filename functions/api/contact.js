export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const tel = (data.tel || "").trim();
  const mobile = (data.mobile || "").trim();
  const region = (data.region || "").trim();
  const message = (data.message || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !tel || !region || !message) {
    return new Response(JSON.stringify({ error: "invalid input" }), { status: 400 });
  }

  const bodyText =
    "氏名: " + name + "\n" +
    "メールアドレス: " + email + "\n" +
    "お電話番号: " + tel + "\n" +
    "携帯番号: " + (mobile || "（未入力）") + "\n" +
    "お住まい地域: " + region + "\n\n" +
    "メッセージ:\n" + message;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_ADDRESS,
        to: [env.CONTACT_TO_ADDRESS],
        reply_to: email,
        subject: "【noaa.jp】お問い合わせがありました",
        text: bodyText,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "send failed", detail: errText }), { status: 500 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "send failed" }), { status: 500 });
  }

  try {
    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO inquiries (created_at, name, email, tel, mobile, region, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')"
      ).bind(new Date().toISOString(), name, email, tel, mobile, region, message).run();
    }
  } catch (err) {
    // メール送信は既に成功しているため、DB保存の失敗はユーザーには通知しない
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
