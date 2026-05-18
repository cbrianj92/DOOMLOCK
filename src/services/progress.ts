import { supabase } from './supabase';

type DifficultyRating = 'too_easy' | 'just_right' | 'too_hard';

export const saveProgress = async (
  questionId: string,
  isCorrect: boolean,
  unlockDurationMs: number,
): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('progress')
    .insert({
      user_id: session.user.id,
      question_id: questionId,
      is_correct: isCorrect,
      unlock_duration_granted: unlockDurationMs,
    })
    .select('id')
    .single();

  return data?.id ?? null;
};

export const updateProgressRating = async (
  progressId: string,
  rating: DifficultyRating,
): Promise<void> => {
  await supabase
    .from('progress')
    .update({ difficulty_rating: rating })
    .eq('id', progressId);
};
