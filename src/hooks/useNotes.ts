import { useCallback, useEffect, useRef, useState } from "react";

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
  initialSort?: SortOrder;
  searchQuery?: string;
  dateFilter?: DateFilter;
}

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
 */
export function useNotes({
  initialSort = "newest",
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

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sort, setSort] = useState<SortOrder>(initialSort);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: Note[];
      if (searchQuery.trim().length > 0) {
        const dateFrom = dateFilterToTimestamp(dateFilter);
        data = await searchNotes(searchQuery.trim(), dateFrom, sort);
      } else if (dateFilter !== "all") {
        const dateFrom = dateFilterToTimestamp(dateFilter);
        data = await searchNotes("", dateFrom, sort);
      } else {
        data = await getAllNotes(sort);
      }
      setNotes(data);
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
