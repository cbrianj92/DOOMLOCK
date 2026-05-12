export interface Question {
  id: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  answered_at: string;
  unlock_duration_granted: number;
}

export type AnswerOption = 'a' | 'b' | 'c' | 'd';
