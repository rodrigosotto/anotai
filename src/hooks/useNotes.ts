import { useCallback, useEffect, useState } from "react";

import { useNoteRepository } from "../repositories/noteRepository";
import type { Note, NoteInput, SortOrder } from "../types/note";

interface UseNotesReturn {
  notes: Note[];
  isLoading: boolean;
  error: Error | null;
  sort: SortOrder;
  setSort: (sort: SortOrder) => void;
  refresh: () => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, input: Partial<NoteInput>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
}

/**
 * Encapsula o acesso ao repositório de notas e gerencia o estado local.
 * Deve ser usado dentro de um componente descendente de `SQLiteProvider`.
 *
 * @param initialSort - Ordenação inicial (padrão: 'newest')
 */
export function useNotes(initialSort: SortOrder = "newest"): UseNotesReturn {
  const {
    getAllNotes,
    createNote: repoCreate,
    updateNote: repoUpdate,
    deleteNote: repoDelete,
  } = useNoteRepository();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sort, setSort] = useState<SortOrder>(initialSort);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllNotes(sort);
      setNotes(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [getAllNotes, sort]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (input: NoteInput): Promise<Note> => {
      const note = await repoCreate(input);
      await refresh();
      return note;
    },
    [repoCreate, refresh],
  );

  const updateNote = useCallback(
    async (id: string, input: Partial<NoteInput>): Promise<Note> => {
      const note = await repoUpdate(id, input);
      await refresh();
      return note;
    },
    [repoUpdate, refresh],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await repoDelete(id);
      await refresh();
    },
    [repoDelete, refresh],
  );

  return {
    notes,
    isLoading,
    error,
    sort,
    setSort,
    refresh,
    createNote,
    updateNote,
    deleteNote,
  };
}
