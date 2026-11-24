/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 00: Guarda de Perímetro & Cabeçalhos de Segurança
 *
 * 1. Bloqueia acesso ao painel administrativo Superuser (`/_/`) sempre que a
 *    requisição vier pela internet pública via proxy/tunnel (Cloudflare/Reverse Proxy),
 *    retornando 404. O painel `/_/` continua acessível somente via túnel SSH local.
 * 2. Injeta cabeçalhos HTTP de endurecimento em todas as respostas.
 */
routerUse((e) => {
  const path = e.request?.url?.path || "";
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
