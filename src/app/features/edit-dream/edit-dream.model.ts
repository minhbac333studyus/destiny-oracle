export interface DreamEditForm {
  fearText:          string;
  additionalContext: string;
}

export type RegenerateStatus = 'idle' | 'generating' | 'success' | 'error';
