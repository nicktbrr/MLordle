// Shared Wordle-style feedback vocabulary.
//   correct -> 🟩  | present -> 🟨  | absent -> ⬛
export type SlotStatus = 'correct' | 'present' | 'absent';

export const STATUS_EMOJI: Record<SlotStatus, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
};

export interface AttrFeedback {
  key: string;
  label: string; // human label, e.g. "Modality"
  value: string; // the guess's value for this attribute (raw)
  status: SlotStatus;
}
