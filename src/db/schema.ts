import type { SQLiteDatabase } from 'expo-sqlite';

/** DDL da tabela principal de notas */
export const SQL_CREATE_NOTES = `
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT    PRIMARY KEY NOT NULL,
    title      TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

/** DDL da tabela de controle de migrations */
export const SQL_CREATE_MIGRATIONS = `
  CREATE TABLE IF NOT EXISTS __migrations (
    version     INTEGER PRIMARY KEY NOT NULL,
    executed_at INTEGER NOT NULL
  );
`;

/**
 * Cria as tabelas base necessárias antes de qualquer migration rodar.
 * Chamada internamente por `runMigrations`.
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SQL_CREATE_MIGRATIONS);
}
