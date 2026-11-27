/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 05: Oficina do Personagem & Motor do Percurso Dinâmico (Rubrica 4D + Ponte Opt-In)
 */

// -----------------------------------------------------------------------------
// 1. Oficina do Personagem (Aluno customiza próprio SketchAvatar + Título)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/profile/avatar",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["student"]);
    const body = e.requestInfo().body || {};
    const cfg = body.avatarConfig || {};
    const cleanTitle = String(body.roleTitle || "Aventureiro(a) Maker")
      .trim()
      .slice(0, 80);

    const safeConfig = {
      skinIndex: L.clamp(Number(cfg.skinIndex || 0), 0, 4),
      hairColorIndex: L.clamp(Number(cfg.hairColorIndex || 0), 0, 4),
      hairStyle: L.clamp(Number(cfg.hairStyle || 0), 0, 4),
      hasGlasses: Boolean(cfg.hasGlasses),
      hasHeadband: Boolean(cfg.hasHeadband),
      bigSmile: cfg.bigSmile !== false,
      bgColor: String(cfg.bgColor || "#FACC15").slice(0, 20),
    };

    $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById("users", auth.id);
      user.set("avatarConfig", safeConfig);
      user.set("avatarColor", safeConfig.bgColor);
      user.set("bio", cleanTitle);
      txApp.save(user);

      const stu = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
        uid: auth.id,
      });
      stu.set("avatarConfig", safeConfig);
      stu.set("avatarColor", safeConfig.bgColor);
      stu.set("roleTitle", cleanTitle);
      txApp.save(stu);
    });

    return e.json(200, { ok: true, avatarConfig: safeConfig, roleTitle: cleanTitle });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 2. Montagem de Equipes do Percurso Dinâmico (+ abertura opcional de Mesas)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/paths/{id}/teams",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    L.requireRoles(e, ["teacher", "coordinator", "admin"]);

    const pathId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};
    const teams = Array.isArray(body.teams) ? body.teams : [];
    const createStudyRooms = body.createStudyRooms !== false;

    if (!pathId || teams.length === 0) {
      throw new BadRequestError("Informe ao menos uma equipe para salvar.");
    }

    const palette = ["#FACC15", "#3B82F6", "#10B981", "#8B5CF6", "#FB923C"];

    $app.runInTransaction((txApp) => {
      const path = txApp.findRecordById("dynamic_paths", pathId);
      const oldTeams = txApp.findRecordsByFilter("path_teams", "path = {:pid}", {
        pid: pathId,
      });
      for (const old of oldTeams) {
        txApp.delete(old);
      }

      const teamsCol = txApp.findCollectionByNameOrId("path_teams");
      const roomsCol = txApp.findCollectionByNameOrId("study_rooms");

      teams.forEach((t, idx) => {
        const name = String(t.name || `Equipe ${idx + 1}`).trim().slice(0, 100);
        const memberIds = Array.isArray(t.memberIds) ? t.memberIds : [];
        const roles = t.roles && typeof t.roles === "object" ? t.roles : {};

        let roomId = "";
        if (createStudyRooms) {
          const room = new Record(roomsCol, {
            name: `${name} · Percurso`.slice(0, 100),
            topic: path.getString("title").slice(0, 240),
            maxSeats: L.clamp(memberIds.length + 1, 2, 20),
            accentColor: palette[idx % palette.length],
            participants: [],
            active: true,
          });
          txApp.save(room);
          roomId = room.id;
        }

        const teamRec = new Record(teamsCol, {
          path: pathId,
          name,
          members: memberIds,
          roles,
          studyRoom: roomId,
        });
        txApp.save(teamRec);
      });
    });

    return e.json(200, { ok: true, count: teams.length });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 3. Registro de Evidência em Etapa do Percurso Dinâmico (Nunca altera notas)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/paths/steps/{id}/submit",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["student"]);

    const stepId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};
    const content = String(body.content || "").trim().slice(0, 3000);
    const artifactFormat = String(body.artifactFormat || "").trim().slice(0, 120);
    const attachmentUrl = String(body.attachmentUrl || "").trim();
    const teamId = String(body.teamId || "").trim();

    if (content.length < 10) {
      throw new BadRequestError(
        "Escreva ao menos 10 caracteres explicando sua evidência ou raciocínio."
      );
    }

    let result = null;
    $app.runInTransaction((txApp) => {
      const step = txApp.findRecordById("path_steps", stepId);
      const path = txApp.findRecordById("dynamic_paths", step.getString("path"));
      const student = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
        uid: auth.id,
      });

      if (student.getString("class") !== path.getString("class")) {
        throw new ForbiddenError("Este Percurso Dinâmico não pertence à sua turma.");
      }

      let existing = null;
      try {
        existing = txApp.findFirstRecordByFilter(
          "path_submissions",
          "step = {:sid} && student = {:stu}",
          { sid: step.id, stu: student.id }
        );
      } catch {
        existing = null;
      }

      const isFirstSubmit = !existing;
      if (existing) {
        existing.set("content", content);
        existing.set("artifactFormat", artifactFormat);
        if (attachmentUrl) existing.set("attachmentUrl", attachmentUrl);
        existing.set("status", "enviado");
        txApp.save(existing);
      } else {
        const subCol = txApp.findCollectionByNameOrId("path_submissions");
        const rec = new Record(subCol, {
          path: path.id,
          step: step.id,
          student: student.id,
          team: teamId,
          artifactFormat,
          content,
          attachmentUrl,
          status: "enviado",
        });
        txApp.save(rec);
        existing = rec;
      }

      if (isFirstSubmit) {
        const prog = L.computeLevelProgress(
          student.getInt("xp"),
          student.getInt("level"),
          student.getInt("xpToNext"),
          35
        );
        const maxHp = Math.max(1, student.getInt("maxHp") || 100);
        const today = L.todayIsoDate();
        const shouldAdvanceStreak = student.getString("lastStreakDate") !== today;

        student.set("xp", prog.xp);
        student.set("level", prog.level);
        student.set("xpToNext", prog.xpToNext);
        student.set("gold", student.getInt("gold") + 15);
        student.set("hp", Math.min(maxHp, student.getInt("hp") + 5));
        student.set("deliveryRate", Math.min(100, student.getFloat("deliveryRate") + 2));
        if (shouldAdvanceStreak) {
          student.set("streakDays", student.getInt("streakDays") + 1);
          student.set("lastStreakDate", today);
        }
        L.boostBnccAttribute(student, step.getString("bnccAttr") || "con", 1, 1);
        L.syncAutoBadges(student, { submittedPath: true });
        txApp.save(student);
      }

      L.writeAuditLog(txApp, {
        actorId: auth.id,
        actorName: student.getString("name"),
        target: step.getString("title"),
        action: isFirstSubmit
          ? "Registrou evidência no Percurso Dinâmico"
          : "Atualizou evidência no Percurso Dinâmico",
        category: "percurso",
        deltaSummary: isFirstSubmit ? "+35 XP · +15 Ouro · +5 HP" : "Revisado",
      });

      result = { submissionId: existing.id, firstSubmit: isFirstSubmit };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 4. Avaliação Individual por Rubrica 4D + Ponte Opt-In para o Diário
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/paths/{id}/evaluate",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["teacher", "coordinator", "admin"]);

    const pathId = String(e.request.pathValue("id") || "").trim();
    const body = e.requestInfo().body || {};
    const studentId = String(body.studentId || "").trim();
    const rigorLevel = L.clamp(Number(body.rigorLevel || 2), 1, 4);
    const evidenceLevel = L.clamp(Number(body.evidenceLevel || 2), 1, 4);
    const authorshipLevel = L.clamp(Number(body.authorshipLevel || 2), 1, 4);
    const collaborationLevel = L.clamp(Number(body.collaborationLevel || 2), 1, 4);
    const qualitativeNote = String(body.qualitativeNote || "").trim().slice(0, 1200);
    const publishReq = body.publishToGradebook === true;

    if (!pathId || !studentId) {
      throw new BadRequestError("Informe pathId e studentId.");
    }

    const levelFloor = { 1: 4, 2: 9, 3: 14, 4: 18 };
    const suggestedScore = L.computeRubricScore(
      rigorLevel,
      evidenceLevel,
      authorshipLevel,
      collaborationLevel
    );

    let result = null;
    $app.runInTransaction((txApp) => {
      const path = txApp.findRecordById("dynamic_paths", pathId);
      const student = txApp.findRecordById("students", studentId);
      const mode = path.getString("gradingMode") || "formativo";
      const weight = path.getInt("gradeWeight") || 0;
      const shouldPublish = publishReq && mode !== "formativo";

      let evalRec = null;
      try {
        evalRec = txApp.findFirstRecordByFilter(
          "path_evaluations",
          "path = {:pid} && student = {:sid}",
          { pid: path.id, sid: student.id }
        );
      } catch {
        evalRec = null;
      }

      if (!evalRec) {
        const col = txApp.findCollectionByNameOrId("path_evaluations");
        evalRec = new Record(col, { path: path.id, student: student.id });
      }
      evalRec.set("rigorLevel", rigorLevel);
      evalRec.set("evidenceLevel", evidenceLevel);
      evalRec.set("authorshipLevel", authorshipLevel);
      evalRec.set("collaborationLevel", collaborationLevel);
      evalRec.set("suggestedScore", suggestedScore);
      evalRec.set("qualitativeNote", qualitativeNote);
      if (shouldPublish) {
        evalRec.set("publishedToGradebook", true);
        evalRec.set("publishedAt", new Date().toISOString());
      }
      txApp.save(evalRec);

      // Atualiza os 6 atributos BNCC (crescimento não-punitivo!)
      L.raiseBnccToFloor(student, "con", levelFloor[rigorLevel]);
      L.raiseBnccToFloor(student, "inv", levelFloor[evidenceLevel]);
      L.raiseBnccToFloor(student, "exp", levelFloor[authorshipLevel]);
      L.raiseBnccToFloor(student, "elo", levelFloor[collaborationLevel]);
      L.raiseBnccToFloor(
        student,
        "arg",
        Math.round((levelFloor[evidenceLevel] + levelFloor[collaborationLevel]) / 2)
      );
      L.syncAutoBadges(student);

      // Ponte Opt-In de Nota: só toca bimesterAverage com confirmação explícita do professor
      let nextAvg = student.getFloat("bimesterAverage");
      if (shouldPublish && weight > 0) {
        if (mode === "ponderado") {
          const w = L.clamp(weight, 1, 100) / 100;
          nextAvg = Number(
            L.clamp(nextAvg * (1 - w) + suggestedScore * w, 0, 10).toFixed(1)
          );
        } else if (mode === "bonus") {
          const maxBonus = weight / 10;
          const earned = Number(((suggestedScore / 10) * maxBonus).toFixed(1));
          nextAvg = Number(L.clamp(nextAvg + earned, 0, 10).toFixed(1));
        }
        student.set("bimesterAverage", nextAvg);

        const gcCol = txApp.findCollectionByNameOrId("grade_components");
        const gc = new Record(gcCol, {
          student: student.id,
          bimester: "3º Bimestre",
          sourceType: mode === "bonus" ? "bonus" : "percurso",
          sourceId: path.id,
          label: `Percurso: ${path.getString("title")}`.slice(0, 180),
          score: suggestedScore,
          weight,
        });
        txApp.save(gc);
      }

      txApp.save(student);

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: student.getString("name"),
        action: shouldPublish
          ? `Validou Rubrica 4D e lançou no Diário (${path.getString("title")})`
          : `Registrou Rubrica 4D formativa (${path.getString("title")})`,
        category: "avaliacao",
        deltaSummary: shouldPublish
          ? `Conceito ${suggestedScore.toFixed(1)} · Média ${nextAvg.toFixed(1)}`
          : `Formativo (${suggestedScore.toFixed(1)} · média intacta)`,
      });

      result = {
        evaluationId: evalRec.id,
        suggestedScore,
        publishedToGradebook: shouldPublish,
        bimesterAverage: nextAvg,
      };
    });

    return e.json(200, result);
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 5. Encerramento da Mostra Pública (Desbloqueia Título Disciplinar + Selo)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/paths/{id}/culminate",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["teacher", "coordinator", "admin"]);
    const pathId = String(e.request.pathValue("id") || "").trim();

    $app.runInTransaction((txApp) => {
      const path = txApp.findRecordById("dynamic_paths", pathId);
      path.set("currentCycle", "concluido");
      txApp.save(path);

      const discTitle = path.getString("disciplinaryTitle") || "Jovem Cientista";
      const classStudents = txApp.findRecordsByFilter("students", "class = {:cid}", {
        cid: path.getString("class"),
      });

      for (const stu of classStudents) {
        const rawTitles = stu.get("unlockedTitles");
        const titles = Array.isArray(rawTitles)
          ? rawTitles.filter((t) => typeof t === "string")
          : [];
        if (titles.indexOf(discTitle) === -1) titles.push(discTitle);
        stu.set("unlockedTitles", titles);
        L.syncAutoBadges(stu, { pathCompleted: true });
        txApp.save(stu);
      }

      L.writeAuditLog(txApp, {
        actorId: L.isSuperuser(auth) ? "" : auth.id,
        actorName: L.isSuperuser(auth) ? "Admin" : auth.getString("displayName"),
        target: path.getString("title"),
        action: `Concluiu Mostra Pública e liberou título "${discTitle}"`,
        category: "percurso",
        deltaSummary: `${classStudents.length} aluno(s)`,
      });
    });

    return e.json(200, { ok: true });
  },
  $apis.requireAuth()
);
