import { supabase } from './supabase';

export const flagQuestion = async (questionId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  await supabase.from('question_flags').insert({
    question_id: questionId,
    user_id: session?.user.id ?? null,
  });
};
