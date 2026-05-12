import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project URL and anon key
const SUPABASE_URL = 'https://qarrsjolwnhmoqtcikmc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9YrgiTYL2ay2Jbp6Z0tDLw_BbpL2r1N';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
