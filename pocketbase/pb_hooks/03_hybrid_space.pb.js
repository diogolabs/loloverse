/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 03: Espaço Híbrido (Anti-Spoofing de Mensagens, Tópicos, Mesas & Presença)
 */

// -----------------------------------------------------------------------------
// 1. Anti-Spoofing na criação de mensagens (carimba autor e cargo pelo token)
// -----------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const info = e.requestInfo();
  if (L.isSuperuser(info.auth)) {
    e.next();
    return;
  }

  const auth = info.auth;
  if (!auth || !auth.getBool("active")) {
    throw new UnauthorizedError("Autenticação obrigatória.");
  }

  const topicId = e.record.getString("topic");
  const topic = $app.findRecordById("channel_topics", topicId);

  // Garante consistência entre tópico e canal
  e.record.set("channel", topic.getString("channel"));
  e.record.set("author", auth.id);
  e.record.set("authorName", auth.getString("displayName") || auth.getString("username"));
  e.record.set("authorRole", L.mapRoleToAuthorRole(auth.getString("role")));
  e.record.set("avatarSeed", auth.getInt("avatarSeed") || 1);
  e.record.set("avatarColor", auth.getString("avatarColor") || "#3B82F6");
  e.record.set("reactions", {});

  if (L.getRole(auth) === "student") {
    e.record.set("pinned", false);
  }

  e.next();

  // Participação construtiva no Espaço Híbrido recupera HP (teto +8 HP/dia) e desbloqueia selo
  if (L.getRole(auth) === "student") {
    try {
      const stu = $app.findFirstRecordByFilter("students", "user = {:uid}", {
        uid: auth.id,
      });
      const today = L.todayIsoDate();
      const usedToday = stu.getString("hybridHpDate") === today ? stu.getInt("hybridHpToday") : 0;
      const maxHp = Math.max(1, stu.getInt("maxHp") || 100);
      if (usedToday < 8) {
        stu.set("hp", Math.min(maxHp, stu.getInt("hp") + 2));
        stu.set("hybridHpDate", today);
        stu.set("hybridHpToday", usedToday + 2);
        if (usedToday === 0) {
          L.boostBnccAttribute(stu, "elo", 1, 1);
        }
      }
      L.syncAutoBadges(stu, { hybridActive: true });
      $app.save(stu);
    } catch {
      // Ignora caso não exista ficha vinculada
    }
  }
}, "chat_messages");

// -----------------------------------------------------------------------------
// 2. Anti-Spoofing na criação de tópicos guiados
// -----------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const info = e.requestInfo();
  if (L.isSuperuser(info.auth)) {
    e.next();
    return;
  }

  const auth = info.auth;
  if (!auth || !auth.getBool("active")) {
    throw new UnauthorizedError("Autenticação obrigatória.");
  }

  const channelId = e.record.getString("channel");
  const channel = $app.findRecordById("chat_channels", channelId);
  const role = L.getRole(auth);

  if (role === "student" && channel.getBool("staffOnlyTopics")) {
    throw new ForbiddenError("Apenas professores e coordenação podem abrir tópicos neste canal.");
  }

  e.record.set("author", auth.id);
  e.record.set("createdByName", auth.getString("displayName") || auth.getString("username"));
  if (role === "student") {
    e.record.set("pinned", false);
  }

  e.next();
}, "channel_topics");

// -----------------------------------------------------------------------------
// 3. Reação em mensagem (1 voto por usuário por emoji, sem alterar o conteúdo)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/messages/{id}/react",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireActiveUser(e);

    const messageId = String(e.request.pathValue("id") || "").trim();
    const emoji = String(e.requestInfo().body?.emoji || "").trim();
    if (!emoji || emoji.length > 12) {
      throw new BadRequestError("Emoji inválido.");
    }

    let nextReactions = {};
    $app.runInTransaction((txApp) => {
      const msg = txApp.findRecordById("chat_messages", messageId);
      const raw = msg.get("reactions");
      const reactions = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const list = Array.isArray(reactions[emoji]) ? reactions[emoji].slice() : [];

      const idx = list.indexOf(auth.id);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(auth.id);
      }

      if (list.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = list;
      }

      msg.set("reactions", reactions);
      txApp.save(msg);
      nextReactions = reactions;
    });

    return e.json(200, { messageId, reactions: nextReactions });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 4. Entrar em Mesa de Estudo ao Vivo (respeita limite de vagas + atualiza status)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/study-rooms/{id}/join",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireActiveUser(e);
    const roomId = String(e.request.pathValue("id") || "").trim();

    let joinedRoomName = "";
    $app.runInTransaction((txApp) => {
      const targetRoom = txApp.findRecordById("study_rooms", roomId);
      if (!targetRoom.getBool("active")) {
        throw new BadRequestError("Esta mesa de estudo não está ativa.");
      }

      const allRooms = txApp.findRecordsByFilter("study_rooms", "id != ''");
      for (const room of allRooms) {
        const current = room.getStringSlice("participants") || [];
        const withoutMe = current.filter((uid) => uid !== auth.id);

        if (room.id === roomId) {
          const maxSeats = Math.max(2, room.getInt("maxSeats") || 6);
          if (withoutMe.length >= maxSeats) {
            throw new BadRequestError("Esta mesa de estudo já está com todas as vagas ocupadas.");
          }
          room.set("participants", [...withoutMe, auth.id]);
          txApp.save(room);
          joinedRoomName = room.getString("name");
        } else if (withoutMe.length !== current.length) {
          room.set("participants", withoutMe);
          txApp.save(room);
        }
      }

      // Atualiza presença do estudante, se existir ficha vinculada
      try {
        const stu = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
          uid: auth.id,
        });
        stu.set("onlineStatus", "em-grupo");
        stu.set("studyActivity", `Na mesa: ${joinedRoomName}`.slice(0, 200));
        txApp.save(stu);
      } catch {
        // Docentes/coordenadores não possuem registro em `students`
      }
    });

    return e.json(200, { roomId, roomName: joinedRoomName });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 5. Sair de todas as Mesas de Estudo
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/study-rooms/leave",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireActiveUser(e);

    $app.runInTransaction((txApp) => {
      const allRooms = txApp.findRecordsByFilter("study_rooms", "id != ''");
      for (const room of allRooms) {
        const current = room.getStringSlice("participants") || [];
        const withoutMe = current.filter((uid) => uid !== auth.id);
        if (withoutMe.length !== current.length) {
          room.set("participants", withoutMe);
          txApp.save(room);
        }
      }

      try {
        const stu = txApp.findFirstRecordByFilter("students", "user = {:uid}", {
          uid: auth.id,
        });
        stu.set("onlineStatus", "online");
        stu.set("studyActivity", "Disponível no Espaço Híbrido");
        txApp.save(stu);
      } catch {
        // Ignora para staff
      }
    });

    return e.json(200, { ok: true });
  },
  $apis.requireAuth()
);

// -----------------------------------------------------------------------------
// 6. Atualizar própria presença/status de estudo (somente o próprio aluno)
// -----------------------------------------------------------------------------
routerAdd(
  "POST",
  "/api/loloverse/presence",
  (e) => {
    const L = require(`${__hooks}/lib/loloverse.js`);
    const auth = L.requireRoles(e, ["student"]);

    const body = e.requestInfo().body || {};
    const onlineStatus = String(body.onlineStatus || "online").trim();
    const studyActivity = String(body.studyActivity || "Estudando no Loloverse")
      .trim()
      .slice(0, 200);

    if (["online", "estudando", "em-grupo", "offline"].indexOf(onlineStatus) === -1) {
      throw new BadRequestError("Status de presença inválido.");
    }

    const stu = $app.findFirstRecordByFilter("students", "user = {:uid}", {
      uid: auth.id,
    });
    stu.set("onlineStatus", onlineStatus);
    stu.set("studyActivity", studyActivity);
    $app.save(stu);

    return e.json(200, { onlineStatus, studyActivity });
  },
  $apis.requireAuth()
);
