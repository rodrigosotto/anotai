/** Representa uma nota persistida no banco de dados */
export interface Note {
  id: string;
  title: string;
  content: string;
  /** Timestamp de criação em Unix ms */
  created_at: number;
  /** Timestamp da última atualização em Unix ms */
  updated_at: number;
}

/** Campos necessários para criar ou editar uma nota (sem id e timestamps) */
export type NoteInput = Omit<Note, 'id' | 'created_at' | 'updated_at'>;

/** Critério de ordenação das notas */
export type SortOrder = 'newest' | 'oldest' | 'alpha';
