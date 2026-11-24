/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 01: Autenticação Segura (Google OAuth2 + Convites 1-para-1 + Exceção Admin)
 *
 * Regras implementadas:
 * 1. Login por senha na coleção `users` SOMENTE é permitido se `allowPasswordLogin = true` e `active = true`.
 *    (Garante que a conta Admin escolar e exceções autorizadas funcionem fora do modo Google,
 *    enquanto alunos/professores/coordenadores comuns usam obrigatoriamente Google OAuth2.)
 * 2. Cadastro via Google OAuth2 (`!e.record`) exige um código de convite ativo, não expirado,
 *    não utilizado e vinculado EXATAMENTE ao e-mail verificado retornado pelo Google.
 * 3. `role` e `class` são sempre impostos pelo convite no servidor (impossível escalar privilégio pelo cliente).
 * 4. Ao cadastrar aluno via convite, a Ficha RPG inicial na coleção `students` é criada automaticamente.
 */

// -----------------------------------------------------------------------------
// 1. Restringe login por e-mail/senha apenas a contas com allowPasswordLogin = true
// -----------------------------------------------------------------------------
onRecordAuthWithPasswordRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);

  if (!e.record) {
    // Deixa o fluxo padrão retornar credenciais inválidas sem vazar existência do e-mail
    e.next();
    return;
  }

  if (!e.record.getBool("active")) {
    throw new ForbiddenError("Esta conta está desativada. Procure a coordenação.");
  }

  if (!e.record.getBool("allowPasswordLogin")) {
    try {
      L.writeAuditLog($app, {
        actorId: e.record.id,
        actorName: e.record.getString("displayName") || e.record.email(),
        target: e.record.email(),
        action: "Tentativa bloqueada de login por senha em conta exclusiva Google",
        category: "seguranca",
        deltaSummary: "Bloqueado",
      });
    } catch {
      // Não falhar a rejeição por erro de log
    }
    throw new ForbiddenError(
      "Esta conta utiliza acesso exclusivo pelo Google. Clique em 'Entrar com Google'."
    );
  }

  e.next();
}, "users");

// -----------------------------------------------------------------------------
// 2. Bloqueia criação direta na API de `users` fora do fluxo OAuth2 (defense-in-depth)
// -----------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const info = e.requestInfo();
  if (L.isSuperuser(info.auth)) {
    e.next();
    return;
  }
  throw new ForbiddenError(
    "Cadastro direto desativado. Utilize 'Entrar com Google' com um código de convite válido."
  );
}, "users");

// -----------------------------------------------------------------------------
// 3. Google OAuth2 + Validação Atômica de Código de Convite Vinculado ao E-mail
// -----------------------------------------------------------------------------
onRecordAuthWithOAuth2Request((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);

  if (e.providerName !== "google") {
    throw new ForbiddenError("Apenas autenticação via Google é permitida no Loloverse.");
  }

  // Usuário já cadastrado -> valida apenas se está ativo
  if (e.record) {
    if (!e.record.getBool("active")) {
      throw new ForbiddenError("Sua conta está desativada. Procure a coordenação escolar.");
    }
    e.next();
    return;
  }

  // Novo cadastro via Google -> exige convite válido vinculado ao e-mail Google
  const googleEmail = String(e.oauth2User?.email || "").trim().toLowerCase();
  if (!googleEmail) {
    throw new ForbiddenError(
      "Não foi possível confirmar seu e-mail pela conta Google. Tente novamente."
    );
  }

  const bodyCreateData = e.requestInfo()?.body?.createData || {};
  const rawCode =
    (e.createData && e.createData["inviteCode"]) ||
    bodyCreateData.inviteCode ||
    "";
  const inviteCode = String(rawCode).trim().toUpperCase();

  if (!inviteCode) {
    throw new ForbiddenError(
      "Cadastro restrito: informe seu código de convite escolar antes de continuar com o Google."
    );
  }

  let reservedInviteId = null;
  let inviteRole = "student";
  let inviteClassId = "";
  let inviteCodeClean = "";

  // Reserva atômica do convite dentro de transação (elimina race condition)
  $app.runInTransaction((txApp) => {
    let invite = null;
    try {
      invite = txApp.findFirstRecordByFilter("invites", "code = {:code}", {
        code: inviteCode,
      });
    } catch {
      invite = null;
    }

    if (!invite) {
      throw new ForbiddenError("Código de convite inválido ou não encontrado.");
    }

    if (!invite.getBool("active")) {
      throw new ForbiddenError("Este código de convite já foi utilizado ou revogado.");
    }

    const usedCount = invite.getInt("usedCount");
    const maxUses = Math.max(1, invite.getInt("maxUses") || 1);
    if (usedCount >= maxUses) {
      throw new ForbiddenError("Este código de convite já atingiu o limite de uso.");
    }

    const expiresAtRaw = invite.getString("expiresAt");
    if (expiresAtRaw) {
      const expDate = new Date(expiresAtRaw.replace(" ", "T"));
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        throw new ForbiddenError("Este código de convite expirou. Solicite um novo à coordenação.");
      }
    }

    const inviteEmail = invite.getString("email").trim().toLowerCase();
    if (inviteEmail !== googleEmail) {
      throw new ForbiddenError(
        "Este código de convite não pertence ao e-mail Google selecionado."
      );
    }

    inviteRole = invite.getString("role") || "student";
    inviteClassId = invite.getString("class") || "";
    inviteCodeClean = invite.getString("code");

    // Reserva o convite imediatamente
    invite.set("usedCount", usedCount + 1);
    if (usedCount + 1 >= maxUses) {
      invite.set("active", false);
    }
    txApp.save(invite);
    reservedInviteId = invite.id;
  });

  // Constrói payload 100% controlado pelo servidor (bloqueia privilege escalation)
  const displayName = String(
    (e.createData && e.createData["displayName"]) ||
      e.oauth2User?.name ||
      googleEmail.split("@")[0]
  )
    .trim()
    .slice(0, 120);

  const baseUsername = L.sanitizeUsername(googleEmail.split("@")[0]);
  let finalUsername = baseUsername;
  try {
    $app.findFirstRecordByFilter("users", "username = {:u}", { u: finalUsername });
    finalUsername =
      baseUsername.slice(0, 22) +
      "." +
      $security.randomStringWithAlphabet(4, "abcdefghijklmnopqrstuvwxyz0123456789");
  } catch {
    // Username disponível
  }

  const seed = Math.floor(Math.random() * 20) + 1;
  const color = L.AVATAR_PALETTE[seed % L.AVATAR_PALETTE.length];
  const defaultBio =
    inviteRole === "teacher"
      ? "Docente Loloverse"
      : inviteRole === "coordinator"
      ? "Coordenação Pedagógica"
      : "Aventureiro(a) Maker";

  // Sobrescreve/limpa chaves manipuláveis pelo cliente
  e.createData = {
    username: finalUsername,
    displayName: displayName,
    role: inviteRole,
    class: inviteRole === "coordinator" ? "" : inviteClassId,
    avatarSeed: seed,
    avatarColor: color,
    bio: defaultBio,
    allowPasswordLogin: false,
    active: true,
    emailVisibility: false,
    inviteCodeUsed: inviteCodeClean,
  };

  try {
    e.next();
  } catch (err) {
    // Rollback da reserva de convite caso a criação OAuth2 falhe
    if (reservedInviteId) {
      try {
        $app.runInTransaction((txApp) => {
          const inv = txApp.findRecordById("invites", reservedInviteId);
          inv.set("usedCount", Math.max(0, inv.getInt("usedCount") - 1));
          inv.set("active", true);
          txApp.save(inv);
        });
      } catch {
        // Ignora erro secundário
      }
    }
    throw err;
  }

  // Pós-criação: vincula convite ao usuário + cria Ficha RPG inicial para alunos + auditoria
  if (e.record && reservedInviteId) {
    $app.runInTransaction((txApp) => {
      const inv = txApp.findRecordById("invites", reservedInviteId);
      inv.set("usedBy", e.record.id);
      inv.set("usedAt", new Date().toISOString());
      txApp.save(inv);

      if (inviteRole === "student") {
        let targetClassId = inviteClassId;
        if (!targetClassId) {
          const firstClass = txApp.findFirstRecordByFilter("classes", "active = true");
          targetClassId = firstClass.id;
        }

        const studentsCol = txApp.findCollectionByNameOrId("students");
        const stu = new Record(studentsCol, {
          user: e.record.id,
          class: targetClassId,
          name: displayName,
          avatarSeed: seed,
          avatarColor: color,
          roleTitle: "Aventureiro(a) Maker",
          level: 1,
          xp: 40,
          xpToNext: 200,
          hp: 100,
          maxHp: 100,
          gold: 50,
          attendanceToday: "presente",
          attendanceRate: 100,
          bimesterAverage: 8.0,
          previousAverage: 8.0,
          deliveryRate: 100,
          streakDays: 1,
          onlineStatus: "online",
          studyActivity: "Explorando o Loloverse!",
          pillarProposito: 60,
          pillarMaestria: 60,
          pillarCriatividade: 65,
          pillarSocial: 60,
          badges: ["Novo no Loloverse"],
          interventionsCount: 0,
        });
        txApp.save(stu);
      }

      L.writeAuditLog(txApp, {
        actorId: e.record.id,
        actorName: displayName,
        target: googleEmail,
        action: `Cadastro Google concluído via convite (${inviteRole})`,
        category: "conta",
        deltaSummary: inviteRole === "student" ? "Ficha RPG Nv.1" : "Acesso liberado",
        metadata: { inviteCode: inviteCodeClean, role: inviteRole },
      });
    });
  }
}, "users");

// -----------------------------------------------------------------------------
// 4. Endpoint: Pré-validação segura de convite (sem enumerar e-mails cadastrados)
// -----------------------------------------------------------------------------
routerAdd("POST", "/api/loloverse/invites/verify", (e) => {
  const body = e.requestInfo().body || {};
  const code = String(body.code || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();

  if (!code || !email) {
    return e.json(400, {
      valid: false,
      error: "Informe seu e-mail Google e o código de convite.",
    });
  }

  let invite = null;
  try {
    invite = $app.findFirstRecordByFilter(
      "invites",
      "code = {:code} && active = true",
      { code }
    );
  } catch {
    invite = null;
  }

  if (
    !invite ||
    invite.getString("email").trim().toLowerCase() !== email ||
    invite.getInt("usedCount") >= Math.max(1, invite.getInt("maxUses") || 1)
  ) {
    return e.json(200, {
      valid: false,
      error: "Código de convite inválido, expirado ou não corresponde a este e-mail.",
    });
  }

  const expiresAtRaw = invite.getString("expiresAt");
  if (expiresAtRaw) {
    const expDate = new Date(expiresAtRaw.replace(" ", "T"));
    if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
      return e.json(200, {
        valid: false,
        error: "Este código de convite expirou. Solicite um novo à coordenação.",
      });
    }
  }

  let className = "";
  const classId = invite.getString("class");
  if (classId) {
    try {
      const cls = $app.findRecordById("classes", classId);
      className = cls.getString("name");
    } catch {
      className = "";
    }
  }

  return e.json(200, {
    valid: true,
    role: invite.getString("role"),
    className,
  });
});

// -----------------------------------------------------------------------------
// 5. Endpoint: Geração unitária ou em lote de convites (Admin / Coordenador)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/invites/generate",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["coordinator", "admin"]);

    const body = e.requestInfo().body || {};
    const items = Array.isArray(body.invites) ? body.invites : [body];
    if (items.length === 0 || items.length > 100) {
      throw new BadRequestError("Envie entre 1 e 100 convites por lote.");
    }

    const validRoles = ["student", "teacher", "coordinator"];
    const created = [];

    $app.runInTransaction((txApp) => {
      const invitesCol = txApp.findCollectionByNameOrId("invites");

      for (const item of items) {
        const email = String(item.email || "").trim().toLowerCase();
        const role = String(item.role || "student").trim();
        const classId = String(item.classId || "").trim();
        const expiresInDays = L.clamp(Number(item.expiresInDays || 14), 1, 180);
        const note = String(item.note || "").trim().slice(0, 200);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new BadRequestError(`E-mail inválido no convite: "${email}"`);
        }
        if (validRoles.indexOf(role) === -1) {
          throw new BadRequestError(`Cargo inválido: "${role}"`);
        }
        if (role === "student" && !classId) {
          throw new BadRequestError(`Convite de aluno (${email}) exige uma turma (classId).`);
        }
        if (classId) {
          txApp.findRecordById("classes", classId);
        }

        const prefix =
          role === "teacher" ? "PROF" : role === "coordinator" ? "COORD" : "LOLO";
        const code = L.generateInviteCode(prefix);
        const expiresAt = new Date(
          Date.now() + expiresInDays * 24 * 60 * 60 * 1000
        ).toISOString();

        const rec = new Record(invitesCol, {
          code,
          email,
          role,
          class: classId || "",
          expiresAt,
          maxUses: 1,
          usedCount: 0,
          active: true,
          createdBy: L.isSuperuser(auth) ? "" : auth.id,
          note,
        });
        txApp.save(rec);

        created.push({
          id: rec.id,
          code,
          email,
          role,
          classId,
          expiresAt,
        });
      }

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Superuser" : auth.getString("displayName"),
        target: `${created.length} convite(s)`,
        action: `Gerou ${created.length} código(s) de convite vinculados por e-mail`,
        category: "seguranca",
        deltaSummary: `${created.length} novo(s)`,
      });
    });

    return e.json(201, { created });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 6. Endpoint: Criação de conta com login por e-mail/senha fora do Google (Admin only)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/admin/accounts",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["admin"]);

    const body = e.requestInfo().body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    const role = String(body.role || "admin").trim();
    const classId = String(body.classId || "").trim();
    const allowPasswordLogin = body.allowPasswordLogin !== false;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError("Informe um e-mail válido.");
    }
    if (password.length < 12) {
      throw new BadRequestError(
        "Contas com login por senha exigem senha forte com no mínimo 12 caracteres."
      );
    }
    if (displayName.length < 2) {
      throw new BadRequestError("Informe o nome de exibição.");
    }
    if (["admin", "coordinator", "teacher"].indexOf(role) === -1) {
      throw new BadRequestError(
        "Cargo inválido para criação direta (use convite Google para alunos)."
      );
    }

    let createdUser = null;
    $app.runInTransaction((txApp) => {
      const usersCol = txApp.findCollectionByNameOrId("users");
      const user = new Record(usersCol);
      user.setEmail(email);
      user.setPassword(password);
      user.setVerified(true);
      user.set("username", L.sanitizeUsername(body.username || email.split("@")[0]));
      user.set("displayName", displayName.slice(0, 120));
      user.set("role", role);
      user.set("class", classId);
      user.set("avatarSeed", Math.floor(Math.random() * 20) + 1);
      user.set("avatarColor", "#8B5CF6");
      user.set("bio", String(body.bio || "Conta Institucional Loloverse").slice(0, 240));
      user.set("allowPasswordLogin", allowPasswordLogin);
      user.set("active", true);
      user.set("emailVisibility", false);
      txApp.save(user);
      createdUser = user;

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Superuser" : auth.getString("displayName"),
        target: email,
        action: `Criou conta institucional (${role}) com login fora do Google: ${allowPasswordLogin ? "sim" : "não"}`,
        category: "seguranca",
        deltaSummary: role,
      });
    });

    return e.json(201, {
      id: createdUser.id,
      email: createdUser.email(),
      role: createdUser.getString("role"),
      allowPasswordLogin: createdUser.getBool("allowPasswordLogin"),
    });
  },
  $apis.requireAuth()
);
