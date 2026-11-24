/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Migration 002: Estrutura Escolar Inicial (Sem credenciais fixas!)
 *
 * Cria apenas dados estruturais não sensíveis:
 * - Turmas iniciais
 * - Categorias, Canais e Mesas de Estudo do Espaço Híbrido
 * - Itens base aprovados da Lojinha
 *
 * Conta de Admin segura (fora do modo Google):
 * - Opcionalmente criada no primeiro boot APENAS se as variáveis de ambiente
 *   `LOLOVERSE_ADMIN_EMAIL` e `LOLOVERSE_ADMIN_PASSWORD` (>= 14 caracteres)
 *   forem informadas no servidor. NUNCA grave senhas reais neste arquivo.
 */
migrate(
  (app) => {
    // 1. Turmas base
    const classesCol = app.findCollectionByNameOrId("classes");
    const classDefs = [
      {
        code: "8a",
        name: "8º Ano A - Robótica & Maker",
        grade: "8º Ano EF",
        teacherName: "Docente Titular",
        period: "Manhã",
        room: "Lab Maker 02",
        active: true,
      },
      {
        code: "9b",
        name: "9º Ano B - Ciências & Sustentabilidade",
        grade: "9º Ano EF",
        teacherName: "Docente Titular",
        period: "Manhã",
        room: "Sala 14",
        active: true,
      },
      {
        code: "1em",
        name: "1º Ano EM - Empreendedorismo Digital",
        grade: "1º Ano EM",
        teacherName: "Docente Titular",
        period: "Tarde",
        room: "Espaço Inovação",
        active: true,
      },
    ];

    for (const def of classDefs) {
      const rec = new Record(classesCol, def);
      app.save(rec);
    }

    // 2. Categorias do Espaço Híbrido
    const catCol = app.findCollectionByNameOrId("channel_categories");
    const catDefs = [
      { key: "avisos", name: "Avisos & Rotina", color: "#FACC15", sortOrder: 1 },
      { key: "estudos", name: "Dúvidas & Disciplinas", color: "#3B82F6", sortOrder: 2 },
      { key: "projetos", name: "Projetos & Laboratório", color: "#10B981", sortOrder: 3 },
      { key: "cultura", name: "Cultura & Convivência", color: "#8B5CF6", sortOrder: 4 },
    ];
    const catMap = {};
    for (const def of catDefs) {
      const rec = new Record(catCol, {
        name: def.name,
        color: def.color,
        sortOrder: def.sortOrder,
      });
      app.save(rec);
      catMap[def.key] = rec.id;
    }

    // 3. Canais do Espaço Híbrido
    const chCol = app.findCollectionByNameOrId("chat_channels");
    const chDefs = [
      {
        category: catMap.avisos,
        slug: "#mural-avisos",
        label: "mural-avisos",
        title: "Mural de Avisos",
        description: "Comunicados oficiais da turma, datas de entrega e desafios coletivos.",
        staffOnlyTopics: true,
      },
      {
        category: catMap.estudos,
        slug: "#duvidas-matematica",
        label: "duvidas-matematica",
        title: "Dúvidas de Matemática",
        description: "Tópicos organizados por exercício para ajuda entre colegas e professores.",
        staffOnlyTopics: false,
      },
      {
        category: catMap.projetos,
        slug: "#projetos-maker",
        label: "projetos-maker",
        title: "Projetos Maker",
        description: "Circuitos, protótipos e bastidores da Feira de Ciências organizados por projeto.",
        staffOnlyTopics: false,
      },
      {
        category: catMap.cultura,
        slug: "#cultura-e-playlists",
        label: "cultura-e-playlists",
        title: "Cultura & Playlists",
        description: "Indicações de livros, músicas para aula prática e convivência saudável.",
        staffOnlyTopics: false,
      },
    ];
    for (const def of chDefs) {
      app.save(new Record(chCol, def));
    }

    // 4. Mesas de Estudo ao Vivo
    const roomCol = app.findCollectionByNameOrId("study_rooms");
    const roomDefs = [
      {
        name: "Mesa de Robótica & Arduino",
        topic: "Protótipo da Feira de Ciências · Desafio Coletivo",
        maxSeats: 6,
        accentColor: "#FACC15",
        participants: [],
        active: true,
      },
      {
        name: "Plantão de Matemática",
        topic: "Equações do 1º grau e frações sem mistério",
        maxSeats: 6,
        accentColor: "#3B82F6",
        participants: [],
        active: true,
      },
      {
        name: "Mesa Foco Lo-Fi (Silenciosa)",
        topic: "Pomodoro 25/5 · Diário de Bordo e Tarefas",
        maxSeats: 8,
        accentColor: "#10B981",
        participants: [],
        active: true,
      },
    ];
    for (const def of roomDefs) {
      app.save(new Record(roomCol, def));
    }

    // 5. Recompensas iniciais da Lojinha
    const rewCol = app.findCollectionByNameOrId("shop_rewards");
    const rewDefs = [
      {
        title: "Escolher Playlist Lo-Fi da Aula Prática",
        description: "Curadoria da trilha instrumental durante 1 aula de laboratório.",
        cost: 60,
        category: "turma",
        iconName: "Music",
        approved: true,
        stockLimit: 10,
        redeemedCount: 0,
      },
      {
        title: "Dica Estratégica na Lista de Exercícios",
        description: "Atendimento individual de 5 minutos com o professor antes da entrega.",
        cost: 80,
        category: "academico",
        iconName: "Compass",
        approved: true,
        stockLimit: 15,
        redeemedCount: 0,
      },
      {
        title: "Passaporte Impressão 3D Livre (15 min)",
        description: "Imprimir um chaveiro ou peça autoral modelada no laboratório.",
        cost: 120,
        category: "privilegio",
        iconName: "Sparkles",
        approved: true,
        stockLimit: 8,
        redeemedCount: 0,
      },
    ];
    for (const def of rewDefs) {
      app.save(new Record(rewCol, def));
    }

    // 6. Bootstrap opcional da conta Admin escolar (login com e-mail/senha fora do Google)
    const adminEmail = ($os.getenv("LOLOVERSE_ADMIN_EMAIL") || "").trim().toLowerCase();
    const adminPassword = ($os.getenv("LOLOVERSE_ADMIN_PASSWORD") || "").trim();
    const adminName = ($os.getenv("LOLOVERSE_ADMIN_NAME") || "Administrador Loloverse").trim();

    if (adminEmail && adminPassword) {
      if (adminPassword.length < 14) {
        throw new Error(
          "LOLOVERSE_ADMIN_PASSWORD precisa ter no mínimo 14 caracteres para segurança de produção."
        );
      }

      const usersCol = app.findCollectionByNameOrId("users");
      const adminUser = new Record(usersCol);
      adminUser.setEmail(adminEmail);
      adminUser.setPassword(adminPassword);
      adminUser.setVerified(true);
      adminUser.set("username", "admin.loloverse");
      adminUser.set("displayName", adminName);
      adminUser.set("role", "admin");
      adminUser.set("avatarSeed", 1);
      adminUser.set("avatarColor", "#8B5CF6");
      adminUser.set("bio", "Administração & Segurança Escolar");
      adminUser.set("allowPasswordLogin", true);
      adminUser.set("active", true);
      adminUser.set("emailVisibility", false);
      app.save(adminUser);

      console.log(
        "[Loloverse] Conta de Admin escolar criada com sucesso. Remova LOLOVERSE_ADMIN_PASSWORD do .env após o primeiro boot!"
      );
    }
  },
  () => {
    // Down migration intencionalmente vazia para não destruir dados escolares em rollback acidental.
  }
);
