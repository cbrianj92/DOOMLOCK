import { supabase } from './supabase';

export const logProFeatureTap = async (featureName: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('pro_feature_taps').insert({
    user_id: session.user.id,
    feature_name: featureName,
  });
};
