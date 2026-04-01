import { randomUUID } from "expo-crypto";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo } from "react";

import type { Note, NoteInput, SortOrder } from "../types/note";

function generateId(): string {
  return randomUUID();
}

function buildOrderClause(sort: SortOrder): string {
  switch (sort) {
    case "newest":
      return "ORDER BY created_at DESC";
    case "oldest":
      return "ORDER BY created_at ASC";
    case "alpha":
      return "ORDER BY title ASC COLLATE NOCASE";
  }
}

/**
 * Encapsula todas as operações CRUD da tabela `notes`.
 * Deve ser usado dentro de um componente descendente de `SQLiteProvider`.
 */
export function useNoteRepository() {
  const db = useSQLiteContext();

  /**
   * Retorna todas as notas ordenadas pelo critério especificado.
   */
  const getAllNotes = useCallback(
    (sort: SortOrder = "newest"): Promise<Note[]> => {
      const order = buildOrderClause(sort);
      return db.getAllAsync<Note>(`SELECT * FROM notes ${order};`);
    },
    [db],
  );

  /**
   * Retorna uma nota pelo id, ou `null` se não existir.
   */
  const getNoteById = useCallback(
    (id: string): Promise<Note | null> =>
      db.getFirstAsync<Note>("SELECT * FROM notes WHERE id = ?;", [id]),
    [db],
  );

  /**
   * Cria uma nova nota e retorna o registro persistido.
   * O trigger `notes_fts_insert` mantém o índice FTS5 sincronizado.
   */
  const createNote = useCallback(
    async (input: NoteInput): Promise<Note> => {
      const now = Date.now();
      const id = generateId();
      await db.runAsync(
        "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
        [id, input.title, input.content, now, now],
      );
      return { id, ...input, created_at: now, updated_at: now };
    },
    [db],
  );

  /**
   * Atualiza os campos de uma nota existente e retorna o registro atualizado.
   * O trigger `notes_fts_update` mantém o índice FTS5 sincronizado.
   * @throws Error se a nota não for encontrada
   */
  const updateNote = useCallback(
    async (id: string, input: Partial<NoteInput>): Promise<Note> => {
      const existing = await db.getFirstAsync<Note>(
        "SELECT * FROM notes WHERE id = ?;",
        [id],
      );
      if (!existing) throw new Error(`Note with id "${id}" not found`);

      const updated: Note = { ...existing, ...input, updated_at: Date.now() };
      await db.runAsync(
        "UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?;",
        [updated.title, updated.content, updated.updated_at, id],
      );
      return updated;
    },
    [db],
  );

  /**
   * Remove uma nota pelo id.
   * O trigger `notes_fts_delete` mantém o índice FTS5 sincronizado.
   */
  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await db.runAsync("DELETE FROM notes WHERE id = ?;", [id]);
    },
    [db],
  );

  /**
   * Busca notas com suporte a FTS5 (quando há termo de busca) ou filtro de data.
   *
   * Performance:
   * - FTS5 MATCH: usa índice invertido → O(log n + k), ideal para texto longo
   * - LIKE '%term%': full-table-scan → O(n), aceitável apenas para listas pequenas
   *
   * A query FTS5 une a virtual table com a tabela real via rowid para obter
   * todos os campos (id, created_at, updated_at) que o índice não armazena.
   */
  const searchNotes = useCallback(
    (
      query: string,
      dateFrom: number | null,
      sort: SortOrder,
    ): Promise<Note[]> => {
      const order = buildOrderClause(sort);
      const trimmed = query.trim();

      if (trimmed.length > 0) {
        /*
         * FTS5 MATCH com escape de aspas para evitar erros de sintaxe.
         * O operador * no final habilita prefix-search: "re*" casa "react", "readme" etc.
         * Usamos JOIN para recuperar id e timestamps da tabela principal.
         */
        const ftsQuery = `"${trimmed.replace(/"/g, '""')}"*`;

        if (dateFrom !== null) {
          return db.getAllAsync<Note>(
            `SELECT n.*
             FROM notes n
             JOIN notes_fts ON notes_fts.rowid = n.rowid
             WHERE notes_fts MATCH ?
               AND n.created_at >= ?
             ${order};`,
            [ftsQuery, dateFrom],
          );
        }

        return db.getAllAsync<Note>(
          `SELECT n.*
           FROM notes n
           JOIN notes_fts ON notes_fts.rowid = n.rowid
           WHERE notes_fts MATCH ?
           ${order};`,
          [ftsQuery],
        );
      }

      // Sem termo de busca: filtra apenas por data (sem necessidade de FTS5)
      if (dateFrom !== null) {
        return db.getAllAsync<Note>(
          `SELECT * FROM notes WHERE created_at >= ? ${order};`,
          [dateFrom],
        );
      }

      return db.getAllAsync<Note>(`SELECT * FROM notes ${order};`);
    },
    [db],
  );

  return useMemo(
    () => ({
      getAllNotes,
      getNoteById,
      createNote,
      updateNote,
      deleteNote,
      searchNotes,
    }),
    [getAllNotes, getNoteById, createNote, updateNote, deleteNote, searchNotes],
  );
}
