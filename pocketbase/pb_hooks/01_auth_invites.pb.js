/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 01: Autenticação Segura (Google OAuth2 + Link/Senha por Convite 1-para-1 + SMTP)
 *
 * Regras implementadas:
 * 1. Zero cadastro aberto: todo novo usuário (Aluno, Professor ou Coordenador) precisa de um
 *    convite ativo, não expirado, não utilizado e vinculado 1-para-1 ao seu e-mail.
 * 2. No primeiro acesso com convite, o usuário pode escolher:
 *    - Ativar via Google OAuth2 (`onRecordAuthWithOAuth2Request`, usando `e.oAuth2User`)
 *    - OU ativar criando sua própria senha com qualquer e-mail (`POST /api/loloverse/invites/accept`)
 * 3. Login por e-mail/senha na coleção `users` é permitido para contas com `allowPasswordLogin = true`
 *    (Admin escolar, contas institucionais e usuários que criaram senha via convite).
 * 4. Geração de convites (`POST /api/loloverse/invites/generate`) e reenvio (`/invites/{id}/resend`)
 *    enviam o link de primeiro acesso por e-mail via SMTP nativo do PocketBase quando configurado.
 */

// -----------------------------------------------------------------------------
// 1. Restringe login por e-mail/senha a contas ativas com allowPasswordLogin = true
// -----------------------------------------------------------------------------
onRecordAuthWithPasswordRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);

  if (!e.record) {
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
      // Ignora erro secundário de auditoria
    }
    throw new ForbiddenError(
      "Esta conta foi ativada apenas pelo Google. Clique em 'Continuar com Google'."
    );
  }

  e.next();
}, "users");

// -----------------------------------------------------------------------------
// 2. Bloqueia criação direta na API de `users` fora dos fluxos controlados
// -----------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const info = e.requestInfo();
  if (L.isSuperuser(info.auth)) {
    e.next();
    return;
  }
  throw new ForbiddenError(
    "Cadastro direto desativado. Utilize seu link ou código de convite escolar."
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

  // PocketBase v0.23–v0.40 expõe `e.oAuth2User` (com 'A' maiúsculo em types.d.ts)
  const oauthUser = e.oAuth2User || e.oauth2User || null;
  const googleEmail = String(
    oauthUser?.email || oauthUser?.rawUser?.email || ""
  )
    .trim()
    .toLowerCase();

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
        throw new ForbiddenError(
          "Este código de convite expirou. Solicite um novo à coordenação."
        );
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

    invite.set("usedCount", usedCount + 1);
    if (usedCount + 1 >= maxUses) {
      invite.set("active", false);
    }
    txApp.save(invite);
    reservedInviteId = invite.id;
  });

  const displayName = String(
    (e.createData && e.createData["displayName"]) ||
      oauthUser?.name ||
      oauthUser?.rawUser?.name ||
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
      error: "Informe seu e-mail e o código de convite.",
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
// 5. Endpoint: Primeiro Acesso por Link + Criação de Senha (qualquer e-mail convidado!)
// -----------------------------------------------------------------------------
routerAdd("POST", "/api/loloverse/invites/accept", (e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const body = e.requestInfo().body || {};

  const code = String(body.code || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim().slice(0, 120);
  const password = String(body.password || "");

  if (!code || !email) {
    throw new BadRequestError("Informe o e-mail e o código de convite.");
  }
  if (displayName.length < 2) {
    throw new BadRequestError("Informe seu nome completo.");
  }
  if (password.length < 8) {
    throw new BadRequestError("Crie uma senha com pelo menos 8 caracteres.");
  }

  let createdInfo = null;

  $app.runInTransaction((txApp) => {
    let invite = null;
    try {
      invite = txApp.findFirstRecordByFilter("invites", "code = {:code}", { code });
    } catch {
      invite = null;
    }

    if (!invite || !invite.getBool("active")) {
      throw new ForbiddenError("Código de convite inválido, revogado ou já utilizado.");
    }

    const usedCount = invite.getInt("usedCount");
    const maxUses = Math.max(1, invite.getInt("maxUses") || 1);
    if (usedCount >= maxUses) {
      throw new ForbiddenError("Este código de convite já foi utilizado.");
    }

    const expiresAtRaw = invite.getString("expiresAt");
    if (expiresAtRaw) {
      const expDate = new Date(expiresAtRaw.replace(" ", "T"));
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        throw new ForbiddenError("Este código de convite expirou. Solicite um novo à coordenação.");
      }
    }

    const inviteEmail = invite.getString("email").trim().toLowerCase();
    if (inviteEmail !== email) {
      throw new ForbiddenError("Este código de convite não pertence a este e-mail.");
    }

    // Verifica se o e-mail já está cadastrado
    let existing = null;
    try {
      existing = txApp.findFirstRecordByFilter("users", "email = {:email}", { email });
    } catch {
      existing = null;
    }
    if (existing) {
      throw new BadRequestError("Este e-mail já possui conta ativa. Faça login normalmente.");
    }

    const inviteRole = invite.getString("role") || "student";
    const inviteClassId = invite.getString("class") || "";
    const inviteCodeClean = invite.getString("code");

    const baseUsername = L.sanitizeUsername(email.split("@")[0]);
    let finalUsername = baseUsername;
    try {
      txApp.findFirstRecordByFilter("users", "username = {:u}", { u: finalUsername });
      finalUsername =
        baseUsername.slice(0, 22) +
        "." +
        $security.randomStringWithAlphabet(4, "abcdefghijklmnopqrstuvwxyz0123456789");
    } catch {
      // Disponível
    }

    const seed = Math.floor(Math.random() * 20) + 1;
    const color = L.AVATAR_PALETTE[seed % L.AVATAR_PALETTE.length];
    const defaultBio =
      inviteRole === "teacher"
        ? "Docente Loloverse"
        : inviteRole === "coordinator"
        ? "Coordenação Pedagógica"
        : "Aventureiro(a) Maker";

    const usersCol = txApp.findCollectionByNameOrId("users");
    const user = new Record(usersCol);
    user.setEmail(email);
    user.setPassword(password);
    user.setVerified(true);
    user.set("username", finalUsername);
    user.set("displayName", displayName);
    user.set("role", inviteRole);
    user.set("class", inviteRole === "coordinator" ? "" : inviteClassId);
    user.set("avatarSeed", seed);
    user.set("avatarColor", color);
    user.set("bio", defaultBio);
    user.set("allowPasswordLogin", true);
    user.set("active", true);
    user.set("emailVisibility", false);
    user.set("inviteCodeUsed", inviteCodeClean);
    txApp.save(user);

    invite.set("usedCount", usedCount + 1);
    if (usedCount + 1 >= maxUses) {
      invite.set("active", false);
    }
    invite.set("usedBy", user.id);
    invite.set("usedAt", new Date().toISOString());
    txApp.save(invite);

    if (inviteRole === "student") {
      let targetClassId = inviteClassId;
      if (!targetClassId) {
        const firstClass = txApp.findFirstRecordByFilter("classes", "active = true");
        targetClassId = firstClass.id;
      }

      const studentsCol = txApp.findCollectionByNameOrId("students");
      const stu = new Record(studentsCol, {
        user: user.id,
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
      actorId: user.id,
      actorName: displayName,
      target: email,
      action: `Primeiro acesso concluído via convite + senha (${inviteRole})`,
      category: "conta",
      deltaSummary: inviteRole === "student" ? "Ficha RPG Nv.1" : "Acesso liberado",
      metadata: { inviteCode: inviteCodeClean, role: inviteRole },
    });

    createdInfo = {
      id: user.id,
      email: user.email(),
      role: inviteRole,
      displayName,
    };
  });

  return e.json(201, { ok: true, user: createdInfo });
});

// -----------------------------------------------------------------------------
// 6. Endpoint: Geração unitária ou em lote de convites + envio opcional por e-mail
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/invites/generate",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["coordinator", "admin"]);

    const body = e.requestInfo().body || {};
    const items = Array.isArray(body.invites) ? body.invites : [body];
    const sendEmail = body.sendEmail === true;
    const appUrl = String(body.appUrl || "https://loloverse.diogolabs.dev.br")
      .trim()
      .replace(/\/+$/, "");

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

        let className = "";
        if (classId) {
          const cls = txApp.findRecordById("classes", classId);
          className = cls.getString("name");
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
          className,
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

    let emailsSent = 0;
    let emailError = "";

    if (sendEmail) {
      const senderAddress = $app.settings().meta.senderAddress || "noreply@loloverse.diogolabs.dev.br";
      const senderName = $app.settings().meta.senderName || "Loloverse";
      const rolePt = (r) =>
        r === "teacher" ? "Professor(a)" : r === "coordinator" ? "Coordenador(a)" : "Estudante";

      for (const inv of created) {
        try {
          const link = `${appUrl}/?convite=${encodeURIComponent(inv.code)}&email=${encodeURIComponent(inv.email)}`;
          const message = new MailerMessage({
            from: { address: senderAddress, name: senderName },
            to: [{ address: inv.email }],
            subject: `Seu convite de acesso ao Loloverse (${rolePt(inv.role)})`,
            html: `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#FAF8F5;border:2px solid #18181B;border-radius:16px;color:#18181B;">
                <div style="display:inline-block;background:#FACC15;border:2px solid #18181B;border-radius:8px;padding:4px 12px;font-weight:800;font-size:12px;">LOLOVERSE</div>
                <h2 style="margin:14px 0 6px;">Bem-vindo(a) ao Loloverse!</h2>
                <p style="font-size:14px;color:#3F3F46;line-height:1.5;">
                  Você recebeu um convite exclusivo para entrar como <strong>${rolePt(inv.role)}</strong>${inv.className ? ` na turma <strong>${inv.className}</strong>` : ""}.
                </p>
                <div style="background:#FFFFFF;border:2px solid #18181B;border-radius:12px;padding:14px;margin:16px 0;text-align:center;">
                  <div style="font-size:11px;text-transform:uppercase;font-weight:800;color:#71717A;">Sua chave de acesso</div>
                  <div style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:2px;margin-top:4px;">${inv.code}</div>
                </div>
                <p style="text-align:center;margin:20px 0;">
                  <a href="${link}" style="display:inline-block;background:#10B981;color:#18181B;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:12px;border:2px solid #18181B;">
                    Ativar minha conta agora
                  </a>
                </p>
                <p style="font-size:12px;color:#71717A;">
                  No primeiro acesso, você pode criar sua senha própria ou entrar com sua conta Google vinculada a <strong>${inv.email}</strong>.
                </p>
              </div>
            `,
          });
          $app.newMailClient().send(message);
          emailsSent += 1;
        } catch (mailErr) {
          emailError = String(mailErr || "SMTP não configurado em Settings > Mail settings.");
          break;
        }
      }
    }

    return e.json(201, { created, emailsSent, emailError });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 7. Endpoint: Reenviar e-mail de um convite ativo (Admin / Coordenador)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/invites/{id}/resend",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    L.requireRoles(e, ["coordinator", "admin"]);

    const inviteId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};
    const appUrl = String(body.appUrl || "https://loloverse.diogolabs.dev.br")
      .trim()
      .replace(/\/+$/, "");

    const inv = $app.findRecordById("invites", inviteId);
    if (!inv.getBool("active") || inv.getInt("usedCount") > 0) {
      throw new BadRequestError("Este convite não está mais ativo.");
    }

    const email = inv.getString("email");
    const code = inv.getString("code");
    const role = inv.getString("role");
    const rolePt =
      role === "teacher" ? "Professor(a)" : role === "coordinator" ? "Coordenador(a)" : "Estudante";
    const link = `${appUrl}/?convite=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;

    const senderAddress = $app.settings().meta.senderAddress || "noreply@loloverse.diogolabs.dev.br";
    const senderName = $app.settings().meta.senderName || "Loloverse";

    const message = new MailerMessage({
      from: { address: senderAddress, name: senderName },
      to: [{ address: email }],
      subject: `Seu convite de acesso ao Loloverse (${rolePt})`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#FAF8F5;border:2px solid #18181B;border-radius:16px;color:#18181B;">
          <div style="display:inline-block;background:#FACC15;border:2px solid #18181B;border-radius:8px;padding:4px 12px;font-weight:800;font-size:12px;">LOLOVERSE</div>
          <h2 style="margin:14px 0 6px;">Seu convite para o Loloverse</h2>
          <p style="font-size:14px;color:#3F3F46;line-height:1.5;">
            Chave de acesso para <strong>${rolePt}</strong>: <strong style="font-family:monospace;">${code}</strong>
          </p>
          <p style="text-align:center;margin:20px 0;">
            <a href="${link}" style="display:inline-block;background:#10B981;color:#18181B;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:12px;border:2px solid #18181B;">
              Ativar minha conta agora
            </a>
          </p>
        </div>
      `,
    });

    try {
      $app.newMailClient().send(message);
    } catch {
      throw new BadRequestError(
        "SMTP ainda não configurado no PocketBase (Settings → Mail settings). Use o botão Copiar Link."
      );
    }

    return e.json(200, { ok: true, email });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 8. Endpoint: Criação de conta com login por e-mail/senha fora do Google (Admin only)
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
        "Contas administrativas exigem senha forte com no mínimo 12 caracteres."
      );
    }
    if (displayName.length < 2) {
      throw new BadRequestError("Informe o nome de exibição.");
    }
    if (["admin", "coordinator", "teacher"].indexOf(role) === -1) {
      throw new BadRequestError(
        "Cargo inválido para criação direta (use convite para alunos)."
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
