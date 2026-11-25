/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 00: Guarda de Perímetro & Cabeçalhos de Segurança
 *
 * 1. Intercepta `/api/oauth2-redirect` após o envio do evento Realtime (`@oauth2`)
 *    para exibir um card HTML amigável do Loloverse que fecha o popup automaticamente,
 *    sem redirecionar para `/_/#/auth/oauth2-redirect-success` (evitando erro 404).
 * 2. Bloqueia acesso ao painel administrativo Superuser (`/_/`) sempre que a
 *    requisição vier pela internet pública via proxy/tunnel (Cloudflare/Reverse Proxy),
 *    retornando 404. O painel `/_/` continua acessível somente via túnel SSH local.
 * 3. Injeta cabeçalhos HTTP de endurecimento em todas as respostas.
 */
routerUse((e) => {
  const path = e.request?.url?.path || "";

  if (path === "/api/oauth2-redirect") {
    const res = e.next();
    const loc = e.response.header().get("Location") || "";
    if (loc.indexOf("oauth2-redirect-") !== -1) {
      const isOk = loc.indexOf("oauth2-redirect-success") !== -1;
      e.response.header().del("Location");
      const title = isOk
        ? "Autenticação Google Concluída!"
        : "Não foi possível concluir o acesso";
      const subtitle = isOk
        ? "Estamos conectando sua conta ao Loloverse. Esta janela fechará automaticamente..."
        : "Feche esta janela e tente novamente na aba do Loloverse.";
      const badgeColor = isOk ? "#10B981" : "#F43F5E";
      return e.html(
        200,
        `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Loloverse · Autenticação Google</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FAF8F5;
      font-family: system-ui, -apple-system, sans-serif;
      color: #18181B;
      padding: 16px;
    }
    .card {
      max-width: 380px;
      width: 100%;
      background: #FFFFFF;
      border: 2px solid #18181B;
      border-radius: 16px;
      box-shadow: 4px 4px 0px 0px #18181B;
      padding: 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 8px;
      border: 2px solid #18181B;
      background: ${badgeColor};
      color: ${isOk ? "#18181B" : "#FFFFFF"};
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 13px;
      color: #52525B;
      margin: 0 0 18px 0;
      line-height: 1.45;
    }
    button {
      background: #FACC15;
      color: #18181B;
      border: 2px solid #18181B;
      border-radius: 12px;
      box-shadow: 2px 2px 0px 0px #18181B;
      padding: 10px 18px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Loloverse</div>
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <button type="button" onclick="window.close()">Fechar janela</button>
  </div>
  <script>
    setTimeout(function () {
      try { window.close(); } catch (e) {}
    }, 350);
  </script>
</body>
</html>`
      );
    }
    return res;
  }

  const isAdminUi = path === "/_" || path.startsWith("/_/");

  if (isAdminUi) {
    const cfRay = e.request.header.get("CF-Ray");
    const cfIp = e.request.header.get("CF-Connecting-IP");
    const xff = e.request.header.get("X-Forwarded-For");
    if (cfRay || cfIp || xff) {
      throw new NotFoundError("Not found.");
    }
  }

  const hdr = e.response.header();
  hdr.set("X-Content-Type-Options", "nosniff");
  hdr.set("X-Frame-Options", "DENY");
  hdr.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return e.next();
});
