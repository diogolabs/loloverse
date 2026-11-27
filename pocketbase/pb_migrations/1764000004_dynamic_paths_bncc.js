/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Migration 004: Ficha RPG (6 Atributos BNCC) + Percurso Dinâmico & Avaliação 3D
 *
 * 100% aditiva (zero breaking change nas 14 coleções existentes):
 * - Estende `students` e `users` com campos opcionais (bnccAttributes, topSpecialties, avatarConfig, unlockedTitles, streak diário)
 * - Cria coleções `dynamic_paths`, `path_steps`, `path_teams`, `path_submissions`, `path_evaluations` e `grade_components`
 * - Protege integralmente `bimesterAverage` e privacidade LGPD entre colegas.
 */
migrate(
  (app) => {
    const AUTH_ONLY = '@request.auth.id != "" && @request.auth.active = true';
    const STAFF_ONLY =
      '@request.auth.id != "" && @request.auth.active = true && (@request.auth.role = "teacher" || @request.auth.role = "coordinator" || @request.auth.role = "admin")';

    const addTimestamps = (col) => {
      col.fields.add(
        new AutodateField({ name: "created", onCreate: true, onUpdate: false })
      );
      col.fields.add(
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
      );
    };

    const classes = app.findCollectionByNameOrId("classes");
    const users = app.findCollectionByNameOrId("users");
    const students = app.findCollectionByNameOrId("students");
    const studyRooms = app.findCollectionByNameOrId("study_rooms");
    const activityLogs = app.findCollectionByNameOrId("activity_logs");

    // -------------------------------------------------------------------------
    // 1. Extensão aditiva em `users` (avatarConfig) e `students` (Atributos BNCC)
    // -------------------------------------------------------------------------
    if (!users.fields.getByName("avatarConfig")) {
      users.fields.add(new JSONField({ name: "avatarConfig", maxSize: 8192 }));
      app.save(users);
    }

    if (!students.fields.getByName("avatarConfig")) {
      students.fields.add(new JSONField({ name: "avatarConfig", maxSize: 8192 }));
    }
    if (!students.fields.getByName("bnccAttributes")) {
      students.fields.add(new JSONField({ name: "bnccAttributes", maxSize: 16384 }));
    }
    if (!students.fields.getByName("topSpecialties")) {
      students.fields.add(new JSONField({ name: "topSpecialties", maxSize: 4096 }));
    }
    if (!students.fields.getByName("unlockedTitles")) {
      students.fields.add(new JSONField({ name: "unlockedTitles", maxSize: 8192 }));
    }
    if (!students.fields.getByName("lastStreakDate")) {
      students.fields.add(new TextField({ name: "lastStreakDate", max: 16 }));
    }
    if (!students.fields.getByName("hybridHpDate")) {
      students.fields.add(new TextField({ name: "hybridHpDate", max: 16 }));
    }
    if (!students.fields.getByName("hybridHpToday")) {
      students.fields.add(
        new NumberField({ name: "hybridHpToday", min: 0, max: 20, onlyInt: true })
      );
    }
    app.save(students);

    // Expande categorias válidas em `activity_logs`
    const catField = activityLogs.fields.getByName("category");
    if (catField && Array.isArray(catField.values)) {
      if (catField.values.indexOf("percurso") === -1) catField.values.push("percurso");
      if (catField.values.indexOf("avaliacao") === -1) catField.values.push("avaliacao");
      app.save(activityLogs);
    }

    // -------------------------------------------------------------------------
    // 2. DYNAMIC_PATHS (Percurso Dinâmico)
    // -------------------------------------------------------------------------
    const dynamicPaths = new Collection({
      type: "base",
      name: "dynamic_paths",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && class = @request.auth.class)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && class = @request.auth.class)",
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE INDEX idx_dp_class_active ON dynamic_paths (class, active)"],
    });

    dynamicPaths.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    dynamicPaths.fields.add(new TextField({ name: "title", required: true, max: 180 }));
    dynamicPaths.fields.add(new TextField({ name: "drivingQuestion", max: 600 }));
    dynamicPaths.fields.add(new TextField({ name: "bnccSummary", max: 300 }));
    dynamicPaths.fields.add(
      new SelectField({
        name: "currentCycle",
        required: true,
        maxSelect: 1,
        values: ["ciclo1", "ciclo2", "concluido"],
      })
    );
    dynamicPaths.fields.add(
      new SelectField({
        name: "gradingMode",
        required: true,
        maxSelect: 1,
        values: ["formativo", "ponderado", "bonus"],
      })
    );
    dynamicPaths.fields.add(
      new NumberField({ name: "gradeWeight", min: 0, max: 100, onlyInt: true })
    );
    dynamicPaths.fields.add(new TextField({ name: "culminationDate", max: 100 }));
    dynamicPaths.fields.add(new TextField({ name: "disciplinaryTitle", max: 80 }));
    dynamicPaths.fields.add(new BoolField({ name: "active" }));
    addTimestamps(dynamicPaths);
    app.save(dynamicPaths);

    // -------------------------------------------------------------------------
    // 3. PATH_STEPS (Etapas nos 12 Formatos do Percurso Dinâmico)
    // -------------------------------------------------------------------------
    const pathSteps = new Collection({
      type: "base",
      name: "path_steps",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && path.class = @request.auth.class)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && path.class = @request.auth.class)",
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE INDEX idx_ps_path_order ON path_steps (path, sortOrder)"],
    });

    pathSteps.fields.add(
      new RelationField({
        name: "path",
        collectionId: dynamicPaths.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathSteps.fields.add(
      new SelectField({
        name: "cycle",
        required: true,
        maxSelect: 1,
        values: ["ciclo1", "ciclo2"],
      })
    );
    pathSteps.fields.add(
      new SelectField({
        name: "stepFormat",
        required: true,
        maxSelect: 1,
        values: [
          "ponto_partida",
          "roda_hipoteses",
          "mesa_ideias",
          "laboratorio_evidencias",
          "roda_conexoes",
          "registro_bordo",
          "saida_exploratoria",
          "encontro_convidado",
          "montagem_equipes",
          "estudio_equipe",
          "estudio_autoral",
          "mostra_publica",
        ],
      })
    );
    pathSteps.fields.add(
      new SelectField({
        name: "scope",
        required: true,
        maxSelect: 1,
        values: ["turma", "equipe", "individual"],
      })
    );
    pathSteps.fields.add(new TextField({ name: "title", required: true, max: 180 }));
    pathSteps.fields.add(new TextField({ name: "description", max: 1000 }));
    pathSteps.fields.add(new JSONField({ name: "guidingQuestions", maxSize: 8192 }));
    pathSteps.fields.add(
      new SelectField({
        name: "bnccAttr",
        required: true,
        maxSelect: 1,
        values: ["con", "inv", "exp", "dig", "arg", "elo"],
      })
    );
    pathSteps.fields.add(new BoolField({ name: "requiresEvidence" }));
    pathSteps.fields.add(new TextField({ name: "dueDate", max: 80 }));
    pathSteps.fields.add(new NumberField({ name: "sortOrder", min: 1, onlyInt: true }));
    pathSteps.fields.add(
      new SelectField({
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["aberta", "concluida"],
      })
    );
    addTimestamps(pathSteps);
    app.save(pathSteps);

    // -------------------------------------------------------------------------
    // 4. PATH_TEAMS (Equipes & Papéis vinculados opcionalmente às Mesas)
    // -------------------------------------------------------------------------
    const pathTeams = new Collection({
      type: "base",
      name: "path_teams",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && path.class = @request.auth.class)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && path.class = @request.auth.class)",
      createRule: STAFF_ONLY,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: ["CREATE INDEX idx_pt_path ON path_teams (path)"],
    });

    pathTeams.fields.add(
      new RelationField({
        name: "path",
        collectionId: dynamicPaths.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathTeams.fields.add(new TextField({ name: "name", required: true, max: 100 }));
    pathTeams.fields.add(
      new RelationField({
        name: "members",
        collectionId: students.id,
        maxSelect: 15,
        cascadeDelete: false,
      })
    );
    pathTeams.fields.add(new JSONField({ name: "roles", maxSize: 8192 }));
    pathTeams.fields.add(
      new RelationField({
        name: "studyRoom",
        collectionId: studyRooms.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    addTimestamps(pathTeams);
    app.save(pathTeams);

    // -------------------------------------------------------------------------
    // 5. PATH_SUBMISSIONS (Evidências — escrita controlada server-side)
    // -------------------------------------------------------------------------
    const pathSubmissions = new Collection({
      type: "base",
      name: "path_submissions",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      createRule: null,
      updateRule: STAFF_ONLY,
      deleteRule: STAFF_ONLY,
      indexes: [
        "CREATE INDEX idx_psub_step_student ON path_submissions (step, student)",
      ],
    });

    pathSubmissions.fields.add(
      new RelationField({
        name: "path",
        collectionId: dynamicPaths.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathSubmissions.fields.add(
      new RelationField({
        name: "step",
        collectionId: pathSteps.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathSubmissions.fields.add(
      new RelationField({
        name: "student",
        collectionId: students.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathSubmissions.fields.add(
      new RelationField({
        name: "team",
        collectionId: pathTeams.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    pathSubmissions.fields.add(new TextField({ name: "artifactFormat", max: 120 }));
    pathSubmissions.fields.add(new TextField({ name: "content", required: true, max: 3000 }));
    pathSubmissions.fields.add(new URLField({ name: "attachmentUrl" }));
    pathSubmissions.fields.add(
      new SelectField({
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["enviado", "revisao", "validado"],
      })
    );
    pathSubmissions.fields.add(new TextField({ name: "teacherFeedback", max: 1000 }));
    addTimestamps(pathSubmissions);
    app.save(pathSubmissions);

    // -------------------------------------------------------------------------
    // 6. PATH_EVALUATIONS (Rubrica 4D — estritamente privada por estudante)
    // -------------------------------------------------------------------------
    const pathEvaluations = new Collection({
      type: "base",
      name: "path_evaluations",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [
        "CREATE UNIQUE INDEX idx_peval_unique ON path_evaluations (path, student)",
      ],
    });

    pathEvaluations.fields.add(
      new RelationField({
        name: "path",
        collectionId: dynamicPaths.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathEvaluations.fields.add(
      new RelationField({
        name: "student",
        collectionId: students.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    pathEvaluations.fields.add(new NumberField({ name: "rigorLevel", min: 1, max: 4, onlyInt: true }));
    pathEvaluations.fields.add(new NumberField({ name: "evidenceLevel", min: 1, max: 4, onlyInt: true }));
    pathEvaluations.fields.add(new NumberField({ name: "authorshipLevel", min: 1, max: 4, onlyInt: true }));
    pathEvaluations.fields.add(new NumberField({ name: "collaborationLevel", min: 1, max: 4, onlyInt: true }));
    pathEvaluations.fields.add(new NumberField({ name: "suggestedScore", min: 0, max: 10 }));
    pathEvaluations.fields.add(new TextField({ name: "qualitativeNote", max: 1200 }));
    pathEvaluations.fields.add(new BoolField({ name: "publishedToGradebook" }));
    pathEvaluations.fields.add(new DateField({ name: "publishedAt" }));
    addTimestamps(pathEvaluations);
    app.save(pathEvaluations);

    // -------------------------------------------------------------------------
    // 7. GRADE_COMPONENTS (Composição transparente da Média Bimestral)
    // -------------------------------------------------------------------------
    const gradeComponents = new Collection({
      type: "base",
      name: "grade_components",
      listRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      viewRule:
        STAFF_ONLY +
        ' || (' +
        AUTH_ONLY +
        " && student.user = @request.auth.id)",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: ["CREATE INDEX idx_gc_student ON grade_components (student)"],
    });

    gradeComponents.fields.add(
      new RelationField({
        name: "student",
        collectionId: students.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    gradeComponents.fields.add(new TextField({ name: "bimester", required: true, max: 40 }));
    gradeComponents.fields.add(
      new SelectField({
        name: "sourceType",
        required: true,
        maxSelect: 1,
        values: ["prova", "atividade", "percurso", "bonus"],
      })
    );
    gradeComponents.fields.add(new TextField({ name: "sourceId", max: 64 }));
    gradeComponents.fields.add(new TextField({ name: "label", required: true, max: 180 }));
    gradeComponents.fields.add(new NumberField({ name: "score", min: 0, max: 10 }));
    gradeComponents.fields.add(new NumberField({ name: "weight", min: 0, max: 100, onlyInt: true }));
    addTimestamps(gradeComponents);
    app.save(gradeComponents);
  },
  () => {
    // Down migration intencionalmente vazia para preservar dados pedagógicos em produção.
  }
);
