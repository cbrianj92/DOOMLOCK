import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const COHORT_KEY = 'doomlock_cohort';

type Cohort = 'A' | 'B' | 'C';

const COHORT_DURATIONS: Record<Cohort, { correct: number; wrong: number }> = {
  A: { correct: 3 * 60 * 1000, wrong: 1.5 * 60 * 1000 },
  B: { correct: 5 * 60 * 1000, wrong: 3 * 60 * 1000 },
  C: { correct: 8 * 60 * 1000, wrong: 4 * 60 * 1000 },
};

export const assignCohort = async (userId: string): Promise<Cohort> => {
  const cohorts: Cohort[] = ['A', 'B', 'C'];
  const cohort = cohorts[Math.floor(Math.random() * 3)];
  await supabase.from('users').insert({ id: userId, cohort });
  await AsyncStorage.setItem(COHORT_KEY, cohort);
  return cohort;
};

export const getCohortDurations = async (): Promise<{
  correct: number;
  wrong: number;
}> => {
  // Check cache first
  const cached = await AsyncStorage.getItem(COHORT_KEY);
  if (cached && cached in COHORT_DURATIONS) {
    return COHORT_DURATIONS[cached as Cohort];
  }

  // Cache miss — fetch from Supabase and re-cache
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return COHORT_DURATIONS.B;

  const { data } = await supabase
    .from('users')
    .select('cohort')
    .eq('id', session.user.id)
    .single();

  const cohort = (data?.cohort as Cohort) ?? 'B';
  await AsyncStorage.setItem(COHORT_KEY, cohort);
  return COHORT_DURATIONS[cohort];
};
