import { z } from "zod";

export const noteSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(100, "Título pode ter no máximo 100 caracteres"),
  content: z
    .string()
    .min(1, "Conteúdo é obrigatório")
    .max(10_000, "Conteúdo pode ter no máximo 10.000 caracteres"),
});

export type NoteFormValues = z.infer<typeof noteSchema>;
