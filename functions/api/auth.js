export async function onRequestGet(context) {
  const { env, request } = context;
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID is not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/callback`;
  const authorizeUrl =
    "https://github.com/login/oauth/authorize" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + encodeURIComponent("repo,user");

  return Response.redirect(authorizeUrl, 302);
}
