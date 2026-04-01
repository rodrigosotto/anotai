import { noteSchema } from "../schemas/noteSchema";

describe("noteSchema", () => {
  // ── Casos válidos ──────────────────────────────────────────────────────────

  it("aceita título e conteúdo válidos", () => {
    const result = noteSchema.safeParse({
      title: "Minha nota",
      content: "Conteúdo da nota",
    });
    expect(result.success).toBe(true);
  });

  it("aceita título com exatamente 100 caracteres", () => {
    const result = noteSchema.safeParse({
      title: "a".repeat(100),
      content: "Conteúdo",
    });
    expect(result.success).toBe(true);
  });

  it("aceita conteúdo com exatamente 10.000 caracteres", () => {
    const result = noteSchema.safeParse({
      title: "Título",
      content: "a".repeat(10_000),
    });
    expect(result.success).toBe(true);
  });

  // ── Título inválido ────────────────────────────────────────────────────────

  it("rejeita título vazio", () => {
    const result = noteSchema.safeParse({ title: "", content: "Conteúdo" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("title");
      expect(result.error.issues[0].message).toBe("Título é obrigatório");
    }
  });

  it("rejeita título com mais de 100 caracteres", () => {
    const result = noteSchema.safeParse({
      title: "a".repeat(101),
      content: "Conteúdo",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Título pode ter no máximo 100 caracteres",
      );
    }
  });

  // ── Conteúdo inválido ──────────────────────────────────────────────────────

  it("rejeita conteúdo vazio", () => {
    const result = noteSchema.safeParse({ title: "Título", content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("content");
      expect(result.error.issues[0].message).toBe("Conteúdo é obrigatório");
    }
  });

  it("rejeita conteúdo com mais de 10.000 caracteres", () => {
    const result = noteSchema.safeParse({
      title: "Título",
      content: "a".repeat(10_001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Conteúdo pode ter no máximo 10.000 caracteres",
      );
    }
  });

  // ── Campos ausentes ────────────────────────────────────────────────────────

  it("rejeita objeto sem título", () => {
    const result = noteSchema.safeParse({ content: "Conteúdo" });
    expect(result.success).toBe(false);
  });

  it("rejeita objeto sem conteúdo", () => {
    const result = noteSchema.safeParse({ title: "Título" });
    expect(result.success).toBe(false);
  });

  it("rejeita objeto vazio", () => {
    const result = noteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
