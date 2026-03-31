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
   * @param sort - Critério de ordenação (padrão: 'newest')
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
   * @param id - Identificador único da nota
   */
  const getNoteById = useCallback(
    (id: string): Promise<Note | null> =>
      db.getFirstAsync<Note>("SELECT * FROM notes WHERE id = ?;", [id]),
    [db],
  );

  /**
   * Cria uma nova nota e retorna o registro persistido.
   * @param input - Campos obrigatórios para criação (title, content)
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
   * @param id - Identificador da nota a ser atualizada
   * @param input - Campos a atualizar (title e/ou content)
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
   * @param id - Identificador da nota a ser removida
   */
  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await db.runAsync("DELETE FROM notes WHERE id = ?;", [id]);
    },
    [db],
  );

  /**
   * Busca notas por título e/ou conteúdo com suporte a filtro de data.
   * @param query - Texto a buscar em title e content
   * @param dateFrom - Timestamp mínimo de criação (null = sem filtro)
   * @param sort - Critério de ordenação
   */
  const searchNotes = useCallback(
    (
      query: string,
      dateFrom: number | null,
      sort: SortOrder,
    ): Promise<Note[]> => {
      const order = buildOrderClause(sort);
      const term = `%${query}%`;
      if (dateFrom !== null) {
        return db.getAllAsync<Note>(
          `SELECT * FROM notes WHERE (title LIKE ? OR content LIKE ?) AND created_at >= ? ${order};`,
          [term, term, dateFrom],
        );
      }
      return db.getAllAsync<Note>(
        `SELECT * FROM notes WHERE (title LIKE ? OR content LIKE ?) ${order};`,
        [term, term],
      );
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
