/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Hook 04: Proteção de Privacidade (LGPD) em Respostas & Realtime
 *
 * `onRecordEnrich` executa em todas as leituras (list, view e eventos SSE Realtime),
 * garantindo que dados pedagógicos sensíveis nunca vazem para contas de alunos.
 */

onRecordEnrich((e) => {
  const L = require(`${__hooks}/lib/loloverse.js`);
  const info = typeof e.requestInfo === "function" ? e.requestInfo() : e.requestInfo;
  const auth = info ? info.auth : null;

  if (!auth || L.isSuperuser(auth)) {
    e.next();
    return;
  }

  const role = L.getRole(auth);
  const colName = e.record.collection().name;

  if (colName === "students" && role === "student") {
    // Notas internas de intervenção da coordenação são sempre confidenciais (staff-only)
    e.record.hide("lastInterventionNote");
    e.record.hide("interventionsCount");

    // Para colegas da mesma turma, oculta indicadores acadêmicos individuais (LGPD escolar)
    const isSelf = e.record.getString("user") === auth.id;
    if (!isSelf) {
      e.record.hide("bimesterAverage");
      e.record.hide("previousAverage");
      e.record.hide("attendanceRate");
      e.record.hide("attendanceToday");
      e.record.hide("deliveryRate");
    }
  }

  if (colName === "users" && role !== "admin" && role !== "coordinator") {
    e.record.hide("allowPasswordLogin");
    e.record.hide("inviteCodeUsed");
  }

  e.next();
});
