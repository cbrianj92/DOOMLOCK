import { assignCohort } from './cohort';
import { supabase } from './supabase';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error && data.user) {
    await assignCohort(data.user.id);
  }
  return { user: data.user, session: data.session, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // Assign cohort if this user has never been assigned one (e.g. pre-cohort account,
  // or public.users was wiped while auth.users persisted)
  if (!error && data.user) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();
    if (!existing) {
      await assignCohort(data.user.id);
    }
  }
  return { user: data.user, session: data.session, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
