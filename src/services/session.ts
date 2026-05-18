import { NativeModules } from 'react-native';
import { supabase } from './supabase';

const { BlockingModule } = NativeModules;

type EntryPoint = 'overlay_triggered' | 'direct_open' | 'direct_practice';

export const logSession = async (entryPoint: EntryPoint): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('session_log').insert({
    user_id: session.user.id,
    entry_point: entryPoint,
  });
};

// Reads and clears the native SharedPreferences entry point flag.
// Returns 'overlay_triggered' if the accessibility service triggered this launch,
// null otherwise.
export const getAndClearNativeEntryPoint =
  (): Promise<string | null> => {
    return BlockingModule.getAndClearEntryPoint();
  };
