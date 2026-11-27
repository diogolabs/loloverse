/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 06: Governança Administrativa (Contas, Permissões & Escopo Segmento/Turno)
 */
routerAdd(
  "POST",
  "/api/loloverse/admin/users/{id}",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["admin"]);

    const targetId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};

    if (!targetId) {
      throw new BadRequestError("Informe o ID da conta.");
    }

    const validRoles = ["student", "teacher", "coordinator", "admin"];
    const validSegments = ["infantil", "fund1", "fund2", "em", "todos"];
    const validShifts = ["Manhã", "Tarde", "Noite", "Integral", "Todos"];

    let updated = null;
    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById("users", targetId);
      const isSelf = !L.isSuperuser(auth) && auth.id === user.id;

      if (body.role !== undefined && !isSelf) {
        const r = String(body.role).trim();
        if (validRoles.indexOf(r) === -1) {
          throw new BadRequestError("Cargo inválido.");
        }
        user.set("role", r);
      }

      if (body.segment !== undefined) {
        const seg = String(body.segment).trim();
        if (validSegments.indexOf(seg) === -1) {
          throw new BadRequestError("Segmento inválido.");
        }
        user.set("segment", seg);
      }

      if (body.workShift !== undefined) {
        const sh = String(body.workShift).trim();
        if (validShifts.indexOf(sh) === -1) {
          throw new BadRequestError("Turno inválido.");
        }
        user.set("workShift", sh);
      }

      if (body.classId !== undefined) {
        user.set("class", String(body.classId || "").trim());
      }

      if (body.active !== undefined && !isSelf) {
        user.set("active", Boolean(body.active));
      }

      if (body.allowPasswordLogin !== undefined && !isSelf) {
        user.set("allowPasswordLogin", Boolean(body.allowPasswordLogin));
      }

      txApp.save(user);

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: user.getString("displayName") || user.email(),
        action: "Atualizou permissões e escopo de atuação da conta",
        category: "seguranca",
        deltaSummary: `${user.getString("role")} · ${user.getString("segment") || "todos"} · ${user.getString("workShift") || "Todos"}`,
      });

      updated = {
        id: user.id,
        role: user.getString("role"),
        segment: user.getString("segment"),
        workShift: user.getString("workShift"),
        active: user.getBool("active"),
      };
    });

    return e.json(200, updated);
  },
  $apis.requireAuth()
);
