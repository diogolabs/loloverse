/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 00: Guarda de Perímetro & Cabeçalhos de Segurança
 *
 * 1. Bloqueia na internet pública (via Cloudflare/proxy) TANTO o painel `/_/`
 *    QUANTO todas as APIs administrativas/Superuser, retornando 404:
 *      - /_ e /_/*
 *      - /api/collections/_superusers*
 *      - /api/settings*
 *      - /api/backups*
 *      - /api/logs*
 *      - /api/crons*
 *    O acesso administrativo continua funcionando SOMENTE via túnel SSH local.
 *    (O retorno do Google OAuth2 ocorre no próprio frontend Next.js em `/auth/callback`.)
 * 2. Injeta cabeçalhos HTTP de endurecimento em todas as respostas.
 */
routerUse((e) => {
  const path = e.request?.url?.path || "";

  const isBlockedPublicPath =
    path === "/_" ||
    path.startsWith("/_/") ||
    path === "/api/collections/_superusers" ||
    path.startsWith("/api/collections/_superusers/") ||
    path === "/api/settings" ||
    path.startsWith("/api/settings/") ||
    path === "/api/backups" ||
    path.startsWith("/api/backups/") ||
    path === "/api/logs" ||
    path.startsWith("/api/logs/") ||
    path === "/api/crons" ||
    path.startsWith("/api/crons/");

  if (isBlockedPublicPath) {
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
