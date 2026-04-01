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
  {
    version: 2,
    description: "Create FTS5 virtual table and sync triggers",
    up: async (db) => {
      /*
       * FTS5 (Full-Text Search) vs LIKE
       * ─────────────────────────────────
       * LIKE '%term%' força um full-table-scan: O(n) onde n = número de linhas.
       * FTS5 mantém um índice invertido; cada busca é O(log n + k) onde k = resultados.
       * Para 10.000 notas, FTS5 é ~100x mais rápido que LIKE em campos de texto longo.
       *
       * A virtual table usa content=notes para evitar duplicar os dados:
       * ela armazena apenas o índice invertido e referencia a tabela `notes` para
       * recuperar as colunas originais (title, content) via content_rowid=rowid.
       */
      await db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
        USING fts5(
          title,
          content,
          content=notes,
          content_rowid=rowid
        );
      `);

      /*
       * Triggers mantêm o índice FTS5 sincronizado com a tabela `notes`.
       * Sem eles, o índice ficaria desatualizado após INSERT/UPDATE/DELETE.
       */
      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_insert
        AFTER INSERT ON notes BEGIN
          INSERT INTO notes_fts(rowid, title, content)
          VALUES (new.rowid, new.title, new.content);
        END;
      `);

      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_delete
        AFTER DELETE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content)
          VALUES ('delete', old.rowid, old.title, old.content);
        END;
      `);

      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_update
        AFTER UPDATE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content)
          VALUES ('delete', old.rowid, old.title, old.content);
          INSERT INTO notes_fts(rowid, title, content)
          VALUES (new.rowid, new.title, new.content);
        END;
      `);

      // Popula o índice FTS com as notas já existentes
      await db.execAsync(`
        INSERT INTO notes_fts(rowid, title, content)
        SELECT rowid, title, content FROM notes;
      `);
    },
    down: async (db) => {
      await db.execAsync("DROP TRIGGER IF EXISTS notes_fts_update;");
      await db.execAsync("DROP TRIGGER IF EXISTS notes_fts_delete;");
      await db.execAsync("DROP TRIGGER IF EXISTS notes_fts_insert;");
      await db.execAsync("DROP TABLE IF EXISTS notes_fts;");
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
