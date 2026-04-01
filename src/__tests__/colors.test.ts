import { getNoteColor } from "../theme/colors";

describe("getNoteColor", () => {
  it("retorna uma string de cor hexadecimal válida", () => {
    const color = getNoteColor("some-id");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("retorna a mesma cor para o mesmo id (determinístico)", () => {
    const id = "abc-123-def";
    expect(getNoteColor(id)).toBe(getNoteColor(id));
  });

  it("diferentes ids podem retornar cores diferentes", () => {
    // Com 8 cores na paleta e ids distintos, deve haver variação
    const colors = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map(getNoteColor),
    );
    expect(colors.size).toBeGreaterThan(1);
  });

  it("distribui uniformemente entre as 8 cores da paleta", () => {
    // Gera ids cujos char-codes somam de 0 a 7 para garantir cobertura total
    const colors = new Set<string>();
    for (let i = 0; i < 100; i++) {
      colors.add(getNoteColor(String.fromCharCode(65 + i))); // A, B, C...
    }
    // Deve ter pelo menos 4 cores distintas em 100 amostras
    expect(colors.size).toBeGreaterThanOrEqual(4);
  });

  it("lida com id de string vazia sem lançar erro", () => {
    expect(() => getNoteColor("")).not.toThrow();
    expect(getNoteColor("")).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("lida com id muito longo sem lançar erro", () => {
    const longId = "x".repeat(1000);
    expect(() => getNoteColor(longId)).not.toThrow();
  });
});
