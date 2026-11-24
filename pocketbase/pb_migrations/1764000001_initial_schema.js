/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Migration 001: Schema Relacional + RBAC (PocketBase v0.23+)
 *
 * Princípios de segurança:
 * 1. Cadastro público de usuários permitido APENAS via Google OAuth2 (`@request.context = "oauth2"`)
 *    e validado pelo hook `01_auth_invites.pb.js` contra um código de convite exclusivo por e-mail.
 * 2. Login com senha (fora do Google) restrito a contas com `allowPasswordLogin = true`
 *    (ex: conta de Admin escolar segura e exceções explicitamente autorizadas).
 * 3. Contas desativadas (`active = false`) são bloqueadas no `authRule` em todos os fluxos.
 * 4. Mutações de RPG (XP, Ouro, HP, Nível, Frequência, Resgates, Conclusão de Missões)
 *    são bloqueadas para escrita direta do cliente (`createRule/updateRule = null`) e passam
 *    exclusivamente pelos endpoints transacionais server-side em `pb_hooks/02_rpg_economy.pb.js`.
 * 5. Trilha de auditoria (`activity_logs`) é 100% imutável pelo cliente (append-only server-side).
 */
migrate(
  (app) => {
    const AUTH_ONLY = '@request.auth.id != "" && @request.auth.active = true';
    const STAFF_ONLY =
      '@request.auth.id != "" && @request.auth.active = true && (@request.auth.role = "teacher" || @request.auth.role = "coordinator" || @request.auth.role = "admin")';
    const COORD_OR_ADMIN =
      '@request.auth.id != "" && @request.auth.active = true && (@request.auth.role = "coordinator" || @request.auth.role = "admin")';

    const addTimestamps = (col) => {
      col.fields.add(
        new AutodateField({ name: "created", onCreate: true, onUpdate: false })
      );
      col.fields.add(
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
      );
    };

    // -------------------------------------------------------------------------
    // 1. CLASSES (Turmas)
    // -------------------------------------------------------------------------
    const classes = new Collection({
      type: "base",
      name: "classes",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: COORD_OR_ADMIN,
      updateRule: COORD_OR_ADMIN,
      deleteRule: '@request.auth.id != "" && @request.auth.active = true && @request.auth.role = "admin"',
      indexes: ["CREATE UNIQUE INDEX idx_classes_code ON classes (code)"],
    });

    classes.fields.add(new TextField({ name: "code", required: true, max: 32, pattern: "^[a-z0-9-]+$" }));
    classes.fields.add(new TextField({ name: "name", required: true, max: 120 }));
    classes.fields.add(new TextField({ name: "grade", required: true, max: 40 }));
    classes.fields.add(new TextField({ name: "teacherName", max: 120 }));
    classes.fields.add(
      new SelectField({
        name: "period",
        required: true,
        maxSelect: 1,
        values: ["Manhã", "Tarde", "Noite", "Integral"],
      })
    );
    classes.fields.add(new TextField({ name: "room", max: 80 }));
    classes.fields.add(new BoolField({ name: "active" }));
    addTimestamps(classes);
    app.save(classes);

    // -------------------------------------------------------------------------
    // 2. USERS (Auth collection nativa estendida com RBAC + controle de login)
    // -------------------------------------------------------------------------
    const users = app.findCollectionByNameOrId("users");

    users.authRule = "active = true";
    users.listRule = AUTH_ONLY + " && active = true";
    users.viewRule = AUTH_ONLY + " && active = true";
    // Permite apenas fluxo OAuth2 chegar ao hook de convites (superusers ignoram regras).
    // Bloqueia POST direto /api/collections/users/records por usuários anônimos.
    users.createRule = '@request.context = "oauth2"';
    // Usuário pode alterar apenas campos cosméticos do próprio perfil; nunca role/flags/turma.
    users.updateRule =
      '@request.auth.id = id && @request.auth.active = true && @request.body.role:isset = false && @request.body.allowPasswordLogin:isset = false && @request.body.active:isset = false && @request.body.class:isset = false && @request.body.inviteCodeUsed:isset = false && @request.body.email:isset = false';
    users.deleteRule = null;

    if (!users.fields.getByName("username")) {
      users.fields.add(
        new TextField({
          name: "username",
          min: 3,
          max: 40,
          pattern: "^[a-z0-9._-]+$",
        })
      );
    }
    if (!users.fields.getByName("displayName")) {
      users.fields.add(new TextField({ name: "displayName", max: 120 }));
    }
    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["student", "teacher", "coordinator", "admin"],
        })
      );
    }
    if (!users.fields.getByName("class")) {
      users.fields.add(
        new RelationField({
          name: "class",
          collectionId: classes.id,
          maxSelect: 1,
          cascadeDelete: false,
        })
      );
    }
    if (!users.fields.getByName("avatarSeed")) {
      users.fields.add(new NumberField({ name: "avatarSeed", min: 1, max: 999, onlyInt: true }));
    }
    if (!users.fields.getByName("avatarColor")) {
      users.fields.add(new TextField({ name: "avatarColor", max: 20 }));
    }
    if (!users.fields.getByName("bio")) {
      users.fields.add(new TextField({ name: "bio", max: 240 }));
    }
    if (!users.fields.getByName("allowPasswordLogin")) {
      users.fields.add(new BoolField({ name: "allowPasswordLogin" }));
    }
    if (!users.fields.getByName("active")) {
      users.fields.add(new BoolField({ name: "active" }));
    }
    if (!users.fields.getByName("inviteCodeUsed")) {
      users.fields.add(new TextField({ name: "inviteCodeUsed", max: 64 }));
    }

    // Política de senha forte para contas com login fora do Google (ex: Admin)
    const passwordField = users.fields.getByName("password");
    if (passwordField) {
      passwordField.min = 12;
    }

    users.passwordAuth.enabled = true;
    users.passwordAuth.identityFields = ["email", "username"];
    users.oauth2.enabled = true;

    users.indexes = [
      ...(users.indexes || []),
      "CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE username != ''",
      "CREATE INDEX idx_users_role ON users (role)",
    ];
    app.save(users);

    // Adiciona relação de docente titular em classes agora que users existe
    classes.fields.add(
      new RelationField({
        name: "teacher",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    app.save(classes);

    // -------------------------------------------------------------------------
    // 3. INVITES (Convites vinculados 1-para-1 a e-mail + código)
    // -------------------------------------------------------------------------
    const invites = new Collection({
      type: "base",
      name: "invites",
      listRule: COORD_OR_ADMIN,
      viewRule: COORD_OR_ADMIN,
      createRule: COORD_OR_ADMIN,
      updateRule: COORD_OR_ADMIN,
      deleteRule: COORD_OR_ADMIN,
      indexes: [
        "CREATE UNIQUE INDEX idx_invites_code ON invites (code)",
        "CREATE INDEX idx_invites_email ON invites (email)",
      ],
    });

    invites.fields.add(
      new TextField({
        name: "code",
        required: true,
        min: 8,
        max: 40,
        pattern: "^[A-Z0-9-]+$",
      })
    );
    invites.fields.add(new EmailField({ name: "email", required: true }));
    invites.fields.add(
      new SelectField({
        name: "role",
        required: true,
        maxSelect: 1,
        values: ["student", "teacher", "coordinator"],
      })
    );
    invites.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    invites.fields.add(new DateField({ name: "expiresAt" }));
    invites.fields.add(new NumberField({ name: "maxUses", required: true, min: 1, max: 1, onlyInt: true }));
    invites.fields.add(new NumberField({ name: "usedCount", min: 0, max: 1, onlyInt: true }));
    invites.fields.add(new BoolField({ name: "active" }));
    invites.fields.add(
      new RelationField({
        name: "createdBy",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    invites.fields.add(
      new RelationField({
        name: "usedBy",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    invites.fields.add(new DateField({ name: "usedAt" }));
    invites.fields.add(new TextField({ name: "note", max: 200 }));
    addTimestamps(invites);
    app.save(invites);

    // -------------------------------------------------------------------------
    // 4. STUDENTS (Ficha RPG + Indicadores Pedagógicos — escrita 100% server-side)
    // -------------------------------------------------------------------------
    const students = new Collection({
      type: "base",
      name: "students",
      // Staff vê todos; aluno vê a si mesmo e colegas da mesma turma (campos sensíveis ocultados via onRecordEnrich!)
      listRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && (user = @request.auth.id || class = @request.auth.class))',
      viewRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && (user = @request.auth.id || class = @request.auth.class))',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [
        "CREATE UNIQUE INDEX idx_students_user ON students (user) WHERE user != ''",
        "CREATE INDEX idx_students_class ON students (class)",
      ],
    });

    students.fields.add(
      new RelationField({
        name: "user",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    students.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    students.fields.add(new TextField({ name: "name", required: true, max: 120 }));
    students.fields.add(new NumberField({ name: "avatarSeed", min: 1, max: 999, onlyInt: true }));
    students.fields.add(new TextField({ name: "avatarColor", max: 20 }));
    students.fields.add(new TextField({ name: "roleTitle", max: 80 }));
    students.fields.add(new NumberField({ name: "level", min: 1, max: 999, onlyInt: true }));
    students.fields.add(new NumberField({ name: "xp", min: 0, onlyInt: true }));
    students.fields.add(new NumberField({ name: "xpToNext", min: 50, onlyInt: true }));
    students.fields.add(new NumberField({ name: "hp", min: 0, max: 200, onlyInt: true }));
    students.fields.add(new NumberField({ name: "maxHp", min: 1, max: 200, onlyInt: true }));
    students.fields.add(new NumberField({ name: "gold", min: 0, onlyInt: true }));
    students.fields.add(
      new SelectField({
        name: "attendanceToday",
        maxSelect: 1,
        values: ["presente", "falta", "atraso"],
      })
    );
    students.fields.add(new NumberField({ name: "attendanceRate", min: 0, max: 100 }));
    students.fields.add(new NumberField({ name: "bimesterAverage", min: 0, max: 10 }));
    students.fields.add(new NumberField({ name: "previousAverage", min: 0, max: 10 }));
    students.fields.add(new NumberField({ name: "deliveryRate", min: 0, max: 100 }));
    students.fields.add(new NumberField({ name: "streakDays", min: 0, onlyInt: true }));
    students.fields.add(
      new SelectField({
        name: "onlineStatus",
        maxSelect: 1,
        values: ["online", "estudando", "em-grupo", "offline"],
      })
    );
    students.fields.add(new TextField({ name: "studyActivity", max: 200 }));
    students.fields.add(new NumberField({ name: "pillarProposito", min: 0, max: 100, onlyInt: true }));
    students.fields.add(new NumberField({ name: "pillarMaestria", min: 0, max: 100, onlyInt: true }));
    students.fields.add(new NumberField({ name: "pillarCriatividade", min: 0, max: 100, onlyInt: true }));
    students.fields.add(new NumberField({ name: "pillarSocial", min: 0, max: 100, onlyInt: true }));
    students.fields.add(new JSONField({ name: "badges", maxSize: 16384 }));
    students.fields.add(new NumberField({ name: "interventionsCount", min: 0, onlyInt: true }));
    students.fields.add(new TextField({ name: "lastInterventionNote", max: 500 }));
    addTimestamps(students);
    app.save(students);

    // -------------------------------------------------------------------------
    // 5. QUESTS (Central de Missões)
    // -------------------------------------------------------------------------
    const quests = new Collection({
      type: "base",
      name: "quests",
      listRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && class = @request.auth.class)',
      viewRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && class = @request.auth.class)',
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE INDEX idx_quests_class_active ON quests (class, active)"],
    });

    quests.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    quests.fields.add(new TextField({ name: "title", required: true, max: 160 }));
    quests.fields.add(new TextField({ name: "description", max: 1000 }));
    quests.fields.add(
      new SelectField({
        name: "type",
        required: true,
        maxSelect: 1,
        values: ["diaria", "tarefa", "boss"],
      })
    );
    quests.fields.add(new NumberField({ name: "xpReward", min: 0, max: 1000, onlyInt: true }));
    quests.fields.add(new NumberField({ name: "goldReward", min: 0, max: 1000, onlyInt: true }));
    quests.fields.add(
      new SelectField({
        name: "pillar",
        required: true,
        maxSelect: 1,
        values: ["proposito", "maestria", "criatividade", "social"],
      })
    );
    quests.fields.add(new TextField({ name: "dueDate", max: 80 }));
    quests.fields.add(new BoolField({ name: "active" }));
    quests.fields.add(new NumberField({ name: "bossTargetPercent", min: 1, max: 100, onlyInt: true }));
    quests.fields.add(
      new RelationField({
        name: "createdBy",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    addTimestamps(quests);
    app.save(quests);

    // -------------------------------------------------------------------------
    // 6. QUEST_COMPLETIONS (Conclusões imutáveis com unicidade no banco)
    // -------------------------------------------------------------------------
    const questCompletions = new Collection({
      type: "base",
      name: "quest_completions",
      listRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && quest.class = @request.auth.class)',
      viewRule:
        STAFF_ONLY +
        ' || (@request.auth.id != "" && @request.auth.active = true && quest.class = @request.auth.class)',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [
        "CREATE UNIQUE INDEX idx_qc_unique_quest_student ON quest_completions (quest, student)",
      ],
    });

    questCompletions.fields.add(
      new RelationField({
        name: "quest",
        collectionId: quests.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    questCompletions.fields.add(
      new RelationField({
        name: "student",
        collectionId: students.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    questCompletions.fields.add(new NumberField({ name: "awardedXp", min: 0, onlyInt: true }));
    questCompletions.fields.add(new NumberField({ name: "awardedGold", min: 0, onlyInt: true }));
    addTimestamps(questCompletions);
    app.save(questCompletions);

    // -------------------------------------------------------------------------
    // 7. SHOP_REWARDS (Lojinha da Turma — governança Coordenação/Admin)
    // -------------------------------------------------------------------------
    const shopRewards = new Collection({
      type: "base",
      name: "shop_rewards",
      listRule: STAFF_ONLY + ' || (' + AUTH_ONLY + " && approved = true)",
      viewRule: STAFF_ONLY + ' || (' + AUTH_ONLY + " && approved = true)",
      createRule: COORD_OR_ADMIN,
      updateRule: COORD_OR_ADMIN,
      deleteRule: COORD_OR_ADMIN,
    });

    shopRewards.fields.add(new TextField({ name: "title", required: true, max: 120 }));
    shopRewards.fields.add(new TextField({ name: "description", max: 500 }));
    shopRewards.fields.add(new NumberField({ name: "cost", required: true, min: 1, max: 5000, onlyInt: true }));
    shopRewards.fields.add(
      new SelectField({
        name: "category",
        required: true,
        maxSelect: 1,
        values: ["academico", "turma", "privilegio", "avatar"],
      })
    );
    shopRewards.fields.add(new TextField({ name: "iconName", max: 40 }));
    shopRewards.fields.add(new BoolField({ name: "approved" }));
    shopRewards.fields.add(new NumberField({ name: "stockLimit", required: true, min: 1, max: 10000, onlyInt: true }));
    shopRewards.fields.add(new NumberField({ name: "redeemedCount", min: 0, onlyInt: true }));
    addTimestamps(shopRewards);
    app.save(shopRewards);

    // -------------------------------------------------------------------------
    // 8. REDEMPTIONS (Vouchers gerados server-side)
    // -------------------------------------------------------------------------
    const redemptions = new Collection({
      type: "base",
      name: "redemptions",
      listRule: STAFF_ONLY + ' || (' + AUTH_ONLY + " && student.user = @request.auth.id)",
      viewRule: STAFF_ONLY + ' || (' + AUTH_ONLY + " && student.user = @request.auth.id)",
      createRule: null,
      updateRule:
        STAFF_ONLY +
        " && @request.body.student:isset = false && @request.body.reward:isset = false && @request.body.cost:isset = false",
      deleteRule: null,
      indexes: ["CREATE INDEX idx_redemptions_student ON redemptions (student)"],
    });

    redemptions.fields.add(
      new RelationField({
        name: "student",
        collectionId: students.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    redemptions.fields.add(new TextField({ name: "studentName", required: true, max: 120 }));
    redemptions.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    redemptions.fields.add(
      new RelationField({
        name: "reward",
        collectionId: shopRewards.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    redemptions.fields.add(new TextField({ name: "rewardTitle", required: true, max: 120 }));
    redemptions.fields.add(new NumberField({ name: "cost", min: 0, onlyInt: true }));
    redemptions.fields.add(
      new SelectField({
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["pendente", "entregue"],
      })
    );
    addTimestamps(redemptions);
    app.save(redemptions);

    // -------------------------------------------------------------------------
    // 9. STUDY_ROOMS (Mesas de Estudo ao Vivo — Espaço Híbrido)
    // -------------------------------------------------------------------------
    const studyRooms = new Collection({
      type: "base",
      name: "study_rooms",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
    });

    studyRooms.fields.add(new TextField({ name: "name", required: true, max: 100 }));
    studyRooms.fields.add(new TextField({ name: "topic", max: 240 }));
    studyRooms.fields.add(new NumberField({ name: "maxSeats", required: true, min: 2, max: 20, onlyInt: true }));
    studyRooms.fields.add(new TextField({ name: "accentColor", max: 20 }));
    studyRooms.fields.add(
      new RelationField({
        name: "participants",
        collectionId: users.id,
        maxSelect: 20,
        cascadeDelete: false,
      })
    );
    studyRooms.fields.add(new BoolField({ name: "active" }));
    addTimestamps(studyRooms);
    app.save(studyRooms);

    // -------------------------------------------------------------------------
    // 10. CHANNEL_CATEGORIES (Categorias do Espaço Híbrido)
    // -------------------------------------------------------------------------
    const categories = new Collection({
      type: "base",
      name: "channel_categories",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
    });

    categories.fields.add(new TextField({ name: "name", required: true, max: 80 }));
    categories.fields.add(new TextField({ name: "color", max: 20 }));
    categories.fields.add(new NumberField({ name: "sortOrder", onlyInt: true }));
    addTimestamps(categories);
    app.save(categories);

    // -------------------------------------------------------------------------
    // 11. CHAT_CHANNELS (Canais do Espaço Híbrido)
    // -------------------------------------------------------------------------
    const channels = new Collection({
      type: "base",
      name: "chat_channels",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE UNIQUE INDEX idx_channels_slug ON chat_channels (slug)"],
    });

    channels.fields.add(
      new RelationField({
        name: "category",
        collectionId: categories.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    channels.fields.add(new TextField({ name: "slug", required: true, max: 80 }));
    channels.fields.add(new TextField({ name: "label", required: true, max: 80 }));
    channels.fields.add(new TextField({ name: "title", required: true, max: 100 }));
    channels.fields.add(new TextField({ name: "description", max: 300 }));
    channels.fields.add(new BoolField({ name: "staffOnlyTopics" }));
    addTimestamps(channels);
    app.save(channels);

    // -------------------------------------------------------------------------
    // 12. CHANNEL_TOPICS (Tópicos Guiados)
    // -------------------------------------------------------------------------
    const topics = new Collection({
      type: "base",
      name: "channel_topics",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      // Alunos só podem abrir tópico em canais onde staffOnlyTopics = false e nunca fixado
      createRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && channel.staffOnlyTopics = false && author = @request.auth.id && @request.body.pinned != true)",
      // Staff atualiza tudo; autor pode editar título/resumo/resolvido, mas nunca fixar ou trocar autor
      updateRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && author = @request.auth.id && @request.body.pinned:isset = false && @request.body.author:isset = false)",
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE INDEX idx_topics_channel ON channel_topics (channel)"],
    });

    topics.fields.add(
      new RelationField({
        name: "channel",
        collectionId: channels.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    topics.fields.add(new TextField({ name: "title", required: true, max: 160 }));
    topics.fields.add(new TextField({ name: "summary", max: 500 }));
    topics.fields.add(
      new RelationField({
        name: "author",
        collectionId: users.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    topics.fields.add(new TextField({ name: "createdByName", max: 120 }));
    topics.fields.add(new BoolField({ name: "pinned" }));
    topics.fields.add(new BoolField({ name: "resolved" }));
    topics.fields.add(
      new SelectField({
        name: "pillar",
        maxSelect: 1,
        values: ["proposito", "maestria", "criatividade", "social"],
      })
    );
    addTimestamps(topics);
    app.save(topics);

    // -------------------------------------------------------------------------
    // 13. CHAT_MESSAGES (Mensagens dentro de Tópicos Guiados)
    // -------------------------------------------------------------------------
    const messages = new Collection({
      type: "base",
      name: "chat_messages",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: AUTH_ONLY + " && author = @request.auth.id && @request.body.pinned != true",
      // Staff pode fixar mensagens; reações passam pelo endpoint /api/loloverse/messages/:id/react
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY + ' || (' + AUTH_ONLY + " && author = @request.auth.id)",
      indexes: ["CREATE INDEX idx_messages_topic ON chat_messages (topic, created)"],
    });

    messages.fields.add(
      new RelationField({
        name: "channel",
        collectionId: channels.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    messages.fields.add(
      new RelationField({
        name: "topic",
        collectionId: topics.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    messages.fields.add(
      new RelationField({
        name: "author",
        collectionId: users.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    messages.fields.add(new TextField({ name: "authorName", max: 120 }));
    messages.fields.add(
      new SelectField({
        name: "authorRole",
        maxSelect: 1,
        values: ["professor", "aluno", "coordenador", "admin"],
      })
    );
    messages.fields.add(new NumberField({ name: "avatarSeed", min: 1, max: 999, onlyInt: true }));
    messages.fields.add(new TextField({ name: "avatarColor", max: 20 }));
    messages.fields.add(new TextField({ name: "content", required: true, max: 2000 }));
    messages.fields.add(new JSONField({ name: "reactions", maxSize: 32768 }));
    messages.fields.add(new BoolField({ name: "pinned" }));
    addTimestamps(messages);
    app.save(messages);

    // -------------------------------------------------------------------------
    // 14. ACTIVITY_LOGS (Trilha de Auditoria Imutável)
    // -------------------------------------------------------------------------
    const activityLogs = new Collection({
      type: "base",
      name: "activity_logs",
      listRule: STAFF_ONLY,
      viewRule: STAFF_ONLY,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: ["CREATE INDEX idx_logs_category_created ON activity_logs (category, created)"],
    });

    activityLogs.fields.add(
      new RelationField({
        name: "actor",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    activityLogs.fields.add(new TextField({ name: "actorName", required: true, max: 120 }));
    activityLogs.fields.add(new TextField({ name: "target", required: true, max: 160 }));
    activityLogs.fields.add(new TextField({ name: "action", required: true, max: 300 }));
    activityLogs.fields.add(
      new SelectField({
        name: "category",
        required: true,
        maxSelect: 1,
        values: [
          "comportamento",
          "frequencia",
          "quest",
          "loja",
          "intervencao",
          "governanca",
          "conta",
          "espaco",
          "seguranca",
        ],
      })
    );
    activityLogs.fields.add(new TextField({ name: "deltaSummary", max: 160 }));
    activityLogs.fields.add(new JSONField({ name: "metadata", maxSize: 16384 }));
    addTimestamps(activityLogs);
    app.save(activityLogs);
  },
  (app) => {
    const names = [
      "activity_logs",
      "chat_messages",
      "channel_topics",
      "chat_channels",
      "channel_categories",
      "study_rooms",
      "redemptions",
      "shop_rewards",
      "quest_completions",
      "quests",
      "students",
      "invites",
      "classes",
    ];
    for (const name of names) {
      try {
        const col = app.findCollectionByNameOrId(name);
        app.delete(col);
      } catch {
        // Ignora se já removida
      }
    }
  }
);
