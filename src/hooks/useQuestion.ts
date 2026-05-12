import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Question } from '../types';

interface UseQuestionResult {
  question: Question | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useQuestion = (): UseQuestionResult => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase.rpc('get_random_question');

    if (supabaseError) {
      setError('Failed to load question. Please try again.');
    } else {
      setQuestion(data?.[0] ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  return { question, loading, error, refetch: fetchQuestion };
};

export default useQuestion;
