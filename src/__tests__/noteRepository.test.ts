/* eslint-disable import/first */
/**
 * Testes unitários para useNoteRepository.
 *
 * A estratégia é mockar `expo-sqlite` e `expo-crypto` para isolar completamente
 * a lógica do repositório do banco de dados real. Isso torna os testes:
 *   - Rápidos: sem I/O de disco
 *   - Determinísticos: sem estado compartilhado entre testes
 *   - Portáteis: rodam em qualquer ambiente (CI, local)
 *
 * jest.mock() é hoisted pelo babel-jest antes dos imports, portanto as chamadas
 * abaixo garantem que os módulos já chegam mockados quando o import é resolvido.
 */

// ─── Mocks (hoistados antes dos imports) ─────────────────────────────────────

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid-1234"),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { useNoteRepository } from "../repositories/noteRepository";
import type { Note } from "../types/note";

// ─── Mock database object ─────────────────────────────────────────────────────

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "mock-uuid-1234",
    title: "Test Note",
    content: "Test Content",
    created_at: 1000000,
    updated_at: 1000000,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useNoteRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllNotes", () => {
    it("busca todas as notas com ordenação padrão (newest)", async () => {
      const notes = [makeNote()];
      mockDb.getAllAsync.mockResolvedValue(notes);

      const repo = useNoteRepository();
      const result = await repo.getAllNotes();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
      );
      expect(result).toEqual(notes);
    });

    it("usa ORDER BY title ASC para sort=alpha", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.getAllNotes("alpha");

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY title ASC COLLATE NOCASE"),
      );
    });

    it("usa ORDER BY created_at ASC para sort=oldest", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.getAllNotes("oldest");

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at ASC"),
      );
    });
  });

  describe("getNoteById", () => {
    it("retorna a nota quando encontrada", async () => {
      const note = makeNote();
      mockDb.getFirstAsync.mockResolvedValue(note);

      const repo = useNoteRepository();
      const result = await repo.getNoteById("mock-uuid-1234");

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = ?"),
        ["mock-uuid-1234"],
      );
      expect(result).toEqual(note);
    });

    it("retorna null quando nota não existe", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const repo = useNoteRepository();
      const result = await repo.getNoteById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("createNote", () => {
    it("insere nota e retorna o registro com timestamps", async () => {
      const before = Date.now();
      mockDb.runAsync.mockResolvedValue(undefined);

      const repo = useNoteRepository();
      const result = await repo.createNote({
        title: "Nova nota",
        content: "Conteúdo",
      });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO notes"),
        expect.arrayContaining(["mock-uuid-1234", "Nova nota", "Conteúdo"]),
      );
      expect(result.id).toBe("mock-uuid-1234");
      expect(result.title).toBe("Nova nota");
      expect(result.created_at).toBeGreaterThanOrEqual(before);
      expect(result.created_at).toBe(result.updated_at);
    });
  });

  describe("updateNote", () => {
    it("atualiza título preservando id e created_at", async () => {
      const existing = makeNote({ created_at: 999 });
      mockDb.getFirstAsync.mockResolvedValue(existing);
      mockDb.runAsync.mockResolvedValue(undefined);

      const repo = useNoteRepository();
      const result = await repo.updateNote("mock-uuid-1234", {
        title: "Título atualizado",
      });

      expect(result.title).toBe("Título atualizado");
      expect(result.content).toBe("Test Content");
      expect(result.created_at).toBe(999);
      expect(result.updated_at).toBeGreaterThan(999);
    });

    it("lança Error quando nota não existe", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const repo = useNoteRepository();

      await expect(
        repo.updateNote("nonexistent", { title: "x" }),
      ).rejects.toThrow('Note with id "nonexistent" not found');
    });
  });

  describe("deleteNote", () => {
    it("executa DELETE com o id correto", async () => {
      mockDb.runAsync.mockResolvedValue(undefined);
      const repo = useNoteRepository();
      await repo.deleteNote("mock-uuid-1234");

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM notes WHERE id = ?"),
        ["mock-uuid-1234"],
      );
    });
  });

  describe("searchNotes — FTS5", () => {
    it("usa MATCH do FTS5 quando há termo de busca", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.searchNotes("react native", null, "newest");

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("notes_fts MATCH"),
        expect.arrayContaining(['"react native"*']),
      );
    });

    it("usa filtro de data sem FTS5 quando não há query", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.searchNotes("", 1700000000000, "newest");

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("created_at >= ?"),
        [1700000000000],
      );
    });

    it("combina FTS5 e filtro de data quando ambos são fornecidos", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.searchNotes("expo", 1700000000000, "newest");

      const [sql, params] = mockDb.getAllAsync.mock.calls[0];
      expect(sql).toContain("notes_fts MATCH");
      expect(sql).toContain("created_at >= ?");
      expect(params).toContain(1700000000000);
    });

    it("escapa aspas duplas no termo de busca para evitar erros FTS5", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.searchNotes('nota com "aspas"', null, "newest");

      const [, params] = mockDb.getAllAsync.mock.calls[0];
      expect(params[0]).toBe('"nota com ""aspas"""*');
    });

    it("usa SELECT simples quando não há query nem filtro de data", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const repo = useNoteRepository();
      await repo.searchNotes("", null, "newest");

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM notes"),
      );
    });
  });
});
