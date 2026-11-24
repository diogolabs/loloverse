/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 02: Motor Transacional RPG & Economia (100% Server-Side / Anti-Cheat)
 *
 * Como `students`, `quest_completions`, `redemptions` e `activity_logs` bloqueiam escrita direta
 * do cliente, todas as regras de XP, Nível, HP, Ouro, Frequência, Intervenções e Resgates
 * executam em transações SQLite atômicas e auditadas no servidor.
 */

// -----------------------------------------------------------------------------
// 1. Pulso da Turma (Feedback comportamental positivo ou alerta) — Staff only
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/behavior-feedback",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["teacher", "coordinator", "admin"]);

    const body = e.requestInfo().body || {};
    const studentId = String(body.studentId || "").trim();
    const presetId = String(body.presetId || "").trim();

    const preset = L.BEHAVIOR_PRESETS[presetId];
    if (!studentId || !preset) {
      throw new BadRequestError("Informe studentId e um presetId válido.");
    }

    let result = null;
    $app.runInTransaction((txApp) => {
      const student = txApp.findRecordById("students", studentId);
      const prog = L.computeLevelProgress(
        student.getInt("xp"),
        student.getInt("level"),
        student.getInt("xpToNext"),
        preset.xpDelta
      );

      const maxHp = Math.max(1, student.getInt("maxHp") || 100);
      const nextHp = L.clamp(student.getInt("hp") + preset.hpDelta, 0, maxHp);
      const nextGold = Math.max(0, student.getInt("gold") + preset.goldDelta);

      const pillarField = L.PILLAR_FIELD_MAP[preset.pillar];
      const pillarDelta = preset.type === "positive" ? 3 : -2;
      const nextPillar = L.clamp(student.getInt(pillarField) + pillarDelta, 10, 100);

      student.set("xp", prog.xp);
      student.set("level", prog.level);
      student.set("xpToNext", prog.xpToNext);
      student.set("hp", nextHp);
      student.set("gold", nextGold);
      student.set(pillarField, nextPillar);
      txApp.save(student);

      const parts = [];
      if (preset.xpDelta !== 0) parts.push(`${preset.xpDelta > 0 ? "+" : ""}${preset.xpDelta} XP`);
      if (preset.goldDelta !== 0) parts.push(`${preset.goldDelta > 0 ? "+" : ""}${preset.goldDelta} Ouro`);
      if (preset.hpDelta !== 0) parts.push(`${preset.hpDelta > 0 ? "+" : ""}${preset.hpDelta} HP`);

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: student.getString("name"),
        action: `${preset.type === "positive" ? "Concedeu" : "Registrou alerta:"} ${preset.label}`,
        category: "comportamento",
        deltaSummary: parts.join(" · "),
        metadata: { studentId, presetId, leveledUp: prog.leveledUp, newLevel: prog.level },
      });

      result = {
        studentId: student.id,
        level: prog.level,
        leveledUp: prog.leveledUp,
        xp: prog.xp,
        xpToNext: prog.xpToNext,
        hp: nextHp,
        gold: nextGold,
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 2. Diário & Frequência — Staff only
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/attendance",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["teacher", "coordinator", "admin"]);

    const body = e.requestInfo().body || {};
    const studentId = String(body.studentId || "").trim();
    const status = String(body.status || "").trim();

    if (!studentId || ["presente", "falta", "atraso"].indexOf(status) === -1) {
      throw new BadRequestError("Informe studentId e status válido (presente | falta | atraso).");
    }

    let result = null;
    $app.runInTransaction((txApp) => {
      const student = txApp.findRecordById("students", studentId);
      const prevStatus = student.getString("attendanceToday") || "presente";
      const maxHp = Math.max(1, student.getInt("maxHp") || 100);

      let rateDelta = 0;
      if (prevStatus !== status) {
        if (status === "presente") rateDelta = prevStatus === "falta" ? 2 : 1;
        if (status === "falta") rateDelta = -2;
        if (status === "atraso") rateDelta = prevStatus === "falta" ? 1 : -1;
      }

      const nextRate = L.clamp(student.getFloat("attendanceRate") + rateDelta, 40, 100);
      let nextHp = student.getInt("hp");
      if (status === "falta" && prevStatus !== "falta") {
        nextHp = Math.max(10, nextHp - 5);
      } else if (status === "presente" && prevStatus === "falta") {
        nextHp = Math.min(maxHp, nextHp + 5);
      }

      student.set("attendanceToday", status);
      student.set("attendanceRate", nextRate);
      student.set("hp", nextHp);
      txApp.save(student);

      const statusLabel =
        status === "presente" ? "Presente" : status === "falta" ? "Falta" : "Atraso";

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: student.getString("name"),
        action: `Atualizou frequência para ${statusLabel}`,
        category: "frequencia",
        deltaSummary:
          status === "falta" ? "-5 HP" : status === "presente" ? "Presença OK" : "Atraso registrado",
      });

      result = {
        studentId: student.id,
        attendanceToday: status,
        attendanceRate: nextRate,
        hp: nextHp,
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 3. Conclusão de Missão (Central de Missões) — Aluno (própria turma) ou Staff
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/quests/{id}/complete",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireActiveUser(e);

    const questId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};
    const role = L.getRole(auth);

    let result = null;
    $app.runInTransaction((txApp) => {
      const quest = txApp.findRecordById("quests", questId);
      if (!quest.getBool("active")) {
        throw new BadRequestError("Esta missão está pausada no momento.");
      }

      let student = null;
      if (role === "student") {
        student = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
          uid: auth.id,
        });
      } else {
        const targetStudentId = String(body.studentId || "").trim();
        if (!targetStudentId) {
          throw new BadRequestError("Informe studentId para concluir a missão como staff.");
        }
        student = txApp.findRecordById("students", targetStudentId);
      }

      if (student.getString("class") !== quest.getString("class")) {
        throw new ForbiddenError("Esta missão não pertence à turma deste estudante.");
      }

      // Garante idempotência (além do índice único no banco)
      let alreadyDone = false;
      try {
        txApp.findFirstRecordByFilter(
          "quest_completions",
          "quest = {:q} && student = {:s}",
          { q: quest.id, s: student.id }
        );
        alreadyDone = true;
      } catch {
        alreadyDone = false;
      }
      if (alreadyDone) {
        throw new BadRequestError("Esta missão já foi concluída por este estudante.");
      }

      const xpReward = Math.max(0, quest.getInt("xpReward"));
      const goldReward = Math.max(0, quest.getInt("goldReward"));
      const prog = L.computeLevelProgress(
        student.getInt("xp"),
        student.getInt("level"),
        student.getInt("xpToNext"),
        xpReward
      );

      const maxHp = Math.max(1, student.getInt("maxHp") || 100);
      const pillarField = L.PILLAR_FIELD_MAP[quest.getString("pillar")] || "pillarMaestria";

      student.set("xp", prog.xp);
      student.set("level", prog.level);
      student.set("xpToNext", prog.xpToNext);
      student.set("gold", student.getInt("gold") + goldReward);
      student.set("hp", Math.min(maxHp, student.getInt("hp") + 4));
      student.set("deliveryRate", Math.min(100, student.getFloat("deliveryRate") + 2));
      student.set("streakDays", student.getInt("streakDays") + 1);
      student.set(pillarField, Math.min(100, student.getInt(pillarField) + 4));
      txApp.save(student);

      const qcCol = txApp.findCollectionByNameOrId("quest_completions");
      const qc = new Record(qcCol, {
        quest: quest.id,
        student: student.id,
        awardedXp: xpReward,
        awardedGold: goldReward,
      });
      txApp.save(qc);

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: student.getString("name"),
        target: quest.getString("title"),
        action: "Concluiu missão no Quadro RPG",
        category: "quest",
        deltaSummary: `+${xpReward} XP · +${goldReward} Ouro`,
      });

      result = {
        completionId: qc.id,
        questId: quest.id,
        studentId: student.id,
        level: prog.level,
        leveledUp: prog.leveledUp,
        xp: prog.xp,
        gold: student.getInt("gold"),
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 4. Resgate na Lojinha da Turma — Atômico (verifica saldo, aprovação e estoque)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/rewards/{id}/redeem",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["student"]);

    const rewardId = String(e.request.pathValue("id") || "").trim();
    let result = null;

    $app.runInTransaction((txApp) => {
      const reward = txApp.findRecordById("shop_rewards", rewardId);
      if (!reward.getBool("approved")) {
        throw new ForbiddenError("Esta recompensa está aguardando aprovação da coordenação.");
      }

      const redeemedCount = reward.getInt("redeemedCount");
      const stockLimit = reward.getInt("stockLimit");
      if (redeemedCount >= stockLimit) {
        throw new BadRequestError("Recompensa esgotada no lote atual.");
      }

      const student = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
        uid: auth.id,
      });

      const cost = reward.getInt("cost");
      const currentGold = student.getInt("gold");
      if (currentGold < cost) {
        throw new BadRequestError(
          `Ouro insuficiente: você tem ${currentGold} e precisa de ${cost} Ouro.`
        );
      }

      student.set("gold", currentGold - cost);
      txApp.save(student);

      reward.set("redeemedCount", redeemedCount + 1);
      txApp.save(reward);

      const redCol = txApp.findCollectionByNameOrId("redemptions");
      const voucher = new Record(redCol, {
        student: student.id,
        studentName: student.getString("name"),
        class: student.getString("class"),
        reward: reward.id,
        rewardTitle: reward.getString("title"),
        cost,
        status: "pendente",
      });
      txApp.save(voucher);

      L.writeAuditLog(txApp, {
        actorId: auth.id,
        actorName: student.getString("name"),
        target: "Lojinha da Turma",
        action: `Resgatou "${reward.getString("title")}"`,
        category: "loja",
        deltaSummary: `-${cost} Ouro`,
      });

      result = {
        voucherId: voucher.id,
        remainingGold: student.getInt("gold"),
        rewardTitle: reward.getString("title"),
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 5. Intervenção Pedagógica (Radar de Cuidado) — Coordenação / Admin only
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/interventions",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["coordinator", "admin"]);

    const body = e.requestInfo().body || {};
    const studentId = String(body.studentId || "").trim();
    const note = String(body.note || "Plano de acolhimento pedagógico iniciado.")
      .trim()
      .slice(0, 500);
    const restoreHp = L.clamp(Number(body.restoreHp ?? 15), 0, 40);

    if (!studentId) {
      throw new BadRequestError("Informe studentId.");
    }

    let result = null;
    $app.runInTransaction((txApp) => {
      const student = txApp.findRecordById("students", studentId);
      const maxHp = Math.max(1, student.getInt("maxHp") || 100);
      const nextHp = Math.min(maxHp, student.getInt("hp") + restoreHp);

      student.set("hp", nextHp);
      student.set("interventionsCount", student.getInt("interventionsCount") + 1);
      student.set("lastInterventionNote", note);
      txApp.save(student);

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: student.getString("name"),
        action: `Intervenção pedagógica: ${note.slice(0, 200)}`,
        category: "intervencao",
        deltaSummary: `+${restoreHp} HP de apoio`,
      });

      result = {
        studentId: student.id,
        hp: nextHp,
        interventionsCount: student.getInt("interventionsCount"),
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);
