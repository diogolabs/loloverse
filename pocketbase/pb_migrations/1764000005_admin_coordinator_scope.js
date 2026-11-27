/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Migration 005: Separação Admin vs. Coordenador (Segmento/Turno, Fórmulas de Média e Grade Curricular)
 *
 * 100% aditiva:
 * - Estende `users` com `segment` e `workShift` (escopo de coordenação/docência)
 * - Estende `classes` com `segment` e restringe criação/edição de turmas ao Admin
 * - Cria `grading_policies` (fórmulas de média — Admin)
 * - Cria `schedule_slots` (grade curricular semanal — Coordenação/Admin)
 */
migrate(
  (app) => {
    const AUTH_ONLY = '@request.auth.id != "" && @request.auth.active = true';
    const ADMIN_ONLY =
      '@request.auth.id != "" && @request.auth.active = true && @request.auth.role = "admin"';
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

    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("segment")) {
      users.fields.add(
        new SelectField({
          name: "segment",
          maxSelect: 1,
          values: ["infantil", "fund1", "fund2", "em", "todos"],
        })
      );
    }
    if (!users.fields.getByName("workShift")) {
      users.fields.add(
        new SelectField({
          name: "workShift",
          maxSelect: 1,
          values: ["Manhã", "Tarde", "Noite", "Integral", "Todos"],
        })
      );
    }
    users.updateRule =
      '@request.auth.id = id && @request.auth.active = true && @request.body.role:isset = false && @request.body.allowPasswordLogin:isset = false && @request.body.active:isset = false && @request.body.class:isset = false && @request.body.inviteCodeUsed:isset = false && @request.body.email:isset = false && @request.body.segment:isset = false && @request.body.workShift:isset = false';
    app.save(users);

    const classes = app.findCollectionByNameOrId("classes");
    if (!classes.fields.getByName("segment")) {
      classes.fields.add(
        new SelectField({
          name: "segment",
          maxSelect: 1,
          values: ["infantil", "fund1", "fund2", "em", "todos"],
        })
      );
    }
    classes.createRule = ADMIN_ONLY;
    classes.updateRule = ADMIN_ONLY;
    classes.deleteRule = ADMIN_ONLY;
    app.save(classes);

    // -------------------------------------------------------------------------
    // GRADING_POLICIES (Fórmulas de Média da Escola — Admin only write)
    // -------------------------------------------------------------------------
    const gradingPolicies = new Collection({
      type: "base",
      name: "grading_policies",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: ADMIN_ONLY,
      updateRule: ADMIN_ONLY,
      deleteRule: ADMIN_ONLY,
    });

    gradingPolicies.fields.add(new TextField({ name: "name", required: true, max: 140 }));
    gradingPolicies.fields.add(
      new SelectField({
        name: "segment",
        required: true,
        maxSelect: 1,
        values: ["infantil", "fund1", "fund2", "em", "todos"],
      })
    );
    gradingPolicies.fields.add(
      new SelectField({
        name: "termSystem",
        required: true,
        maxSelect: 1,
        values: ["bimestral", "trimestral"],
      })
    );
    gradingPolicies.fields.add(
      new SelectField({
        name: "formulaType",
        required: true,
        maxSelect: 1,
        values: ["aritmetica", "ponderada", "recuperacao_substitutiva"],
      })
    );
    gradingPolicies.fields.add(new NumberField({ name: "passingGrade", min: 0, max: 10 }));
    gradingPolicies.fields.add(new NumberField({ name: "weightExams", min: 0, max: 100, onlyInt: true }));
    gradingPolicies.fields.add(new NumberField({ name: "weightActivities", min: 0, max: 100, onlyInt: true }));
    gradingPolicies.fields.add(new NumberField({ name: "weightDynamicPaths", min: 0, max: 100, onlyInt: true }));
    gradingPolicies.fields.add(
      new SelectField({
        name: "rounding",
        required: true,
        maxSelect: 1,
        values: ["decimo", "meio_ponto", "exato"],
      })
    );
    gradingPolicies.fields.add(new BoolField({ name: "active" }));
    addTimestamps(gradingPolicies);
    app.save(gradingPolicies);

    // Seed inicial de 1 fórmula padrão (Fundamental II)
    app.save(
      new Record(gradingPolicies, {
        name: "Regra Oficial · Fundamental II",
        segment: "fund2",
        termSystem: "bimestral",
        formulaType: "ponderada",
        passingGrade: 6.0,
        weightExams: 50,
        weightActivities: 20,
        weightDynamicPaths: 30,
        rounding: "decimo",
        active: true,
      })
    );

    // -------------------------------------------------------------------------
    // SCHEDULE_SLOTS (Grade Curricular Semanal — Coordenação / Admin)
    // -------------------------------------------------------------------------
    const scheduleSlots = new Collection({
      type: "base",
      name: "schedule_slots",
      listRule: AUTH_ONLY,
      viewRule: AUTH_ONLY,
      createRule: COORD_OR_ADMIN,
      updateRule: COORD_OR_ADMIN,
      deleteRule: COORD_OR_ADMIN,
      indexes: [
        "CREATE UNIQUE INDEX idx_slot_class_day_idx ON schedule_slots (class, dayOfWeek, slotIndex)",
      ],
    });

    scheduleSlots.fields.add(
      new RelationField({
        name: "class",
        collectionId: classes.id,
        required: true,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    scheduleSlots.fields.add(
      new SelectField({
        name: "dayOfWeek",
        required: true,
        maxSelect: 1,
        values: ["seg", "ter", "qua", "qui", "sex"],
      })
    );
    scheduleSlots.fields.add(
      new NumberField({ name: "slotIndex", required: true, min: 1, max: 8, onlyInt: true })
    );
    scheduleSlots.fields.add(new TextField({ name: "subject", required: true, max: 120 }));
    scheduleSlots.fields.add(
      new RelationField({
        name: "teacher",
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    scheduleSlots.fields.add(new TextField({ name: "teacherName", max: 120 }));
    scheduleSlots.fields.add(new TextField({ name: "room", max: 80 }));
    scheduleSlots.fields.add(
      new SelectField({
        name: "bnccFocus",
        maxSelect: 1,
        values: ["con", "inv", "exp", "dig", "arg", "elo"],
      })
    );
    addTimestamps(scheduleSlots);
    app.save(scheduleSlots);
  },
  () => {
    // Down migration intencionalmente vazia para preservar dados em produção.
  }
);
