/// <reference path="../pb_data/types.d.ts" />

/**
 * Loloverse — Migration 003: Ajusta tamanho mínimo de senha em `users` para 8 caracteres
 * (mantendo contas de Admin/Superuser com recomendação de 14+ caracteres).
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const passwordField = users.fields.getByName("password");
    if (passwordField) {
      passwordField.min = 8;
    }
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const passwordField = users.fields.getByName("password");
    if (passwordField) {
      passwordField.min = 12;
    }
    app.save(users);
  }
);
