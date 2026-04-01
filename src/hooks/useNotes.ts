import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNoteRepository } from "../repositories/noteRepository";
import type { Note, NoteInput, SortOrder } from "../types/note";

export type DateFilter = "all" | "today" | "week" | "month";

function dateFilterToTimestamp(filter: DateFilter): number | null {
  if (filter === "all") return null;
  const now = new Date();
  switch (filter) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.getTime();
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.getTime();
    }
    case "month": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.getTime();
    }
  }
}

interface UseNotesOptions {
  sort?: SortOrder;
  searchQuery?: string;
  dateFilter?: DateFilter;
}

interface UseNotesReturn {
  notes: Note[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, input: Partial<NoteInput>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
}

/**
 * Encapsula o acesso ao repositório de notas e gerencia o estado local.
 * Deve ser usado dentro de um componente descendente de `SQLiteProvider`.
 */
export function useNotes({
  sort = "newest",
  searchQuery = "",
  dateFilter = "all",
}: UseNotesOptions = {}): UseNotesReturn {
  const {
    getAllNotes,
    searchNotes,
    createNote: repoCreate,
    updateNote: repoUpdate,
    deleteNote: repoDelete,
  } = useNoteRepository();

  const [rawNotes, setRawNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: Note[];
      const hasQuery = searchQuery.trim().length > 0;
      const hasDateFilter = dateFilter !== "all";

      if (hasQuery || hasDateFilter) {
        const dateFrom = dateFilterToTimestamp(dateFilter);
        data = await searchNotes(searchQuery.trim(), dateFrom, sort);
      } else {
        data = await getAllNotes(sort);
      }
      setRawNotes(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [getAllNotes, searchNotes, sort, searchQuery, dateFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refresh();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refresh]);

  // useMemo evita recriar o array de referência quando `rawNotes` não mudou,
  // prevenindo re-renders desnecessários em FlashList
  const notes = useMemo(() => rawNotes, [rawNotes]);

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
    refresh,
    createNote,
    updateNote,
    deleteNote,
  };
}
