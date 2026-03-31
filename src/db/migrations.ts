import type { SQLiteDatabase } from "expo-sqlite";

import { SQL_CREATE_NOTES, initDatabase } from "./schema";

/** Contrato de uma migration versionada */
export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

/** Todas as migrations em ordem crescente de versão */
export const migrations: Migration[] = [
  {
    version: 1,
    description: "Create notes table",
    up: async (db) => {
      await db.execAsync(SQL_CREATE_NOTES);
    },
    down: async (db) => {
      await db.execAsync("DROP TABLE IF EXISTS notes;");
    },
  },
];

/**
 * Executa todas as migrations pendentes.
 * Esta é a função passada ao `SQLiteProvider.onInit`.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await initDatabase(db);

  const executed = await db.getAllAsync<{ version: number }>(
    "SELECT version FROM __migrations ORDER BY version ASC;",
  );
  const executedVersions = new Set(
    executed.map((r: { version: number }) => r.version),
  );

  for (const migration of migrations) {
    if (!executedVersions.has(migration.version)) {
      await migration.up(db);
      await db.runAsync(
        "INSERT INTO __migrations (version, executed_at) VALUES (?, ?);",
        [migration.version, Date.now()],
      );
    }
  }
}
