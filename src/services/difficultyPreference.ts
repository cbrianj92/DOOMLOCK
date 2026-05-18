import AsyncStorage from '@react-native-async-storage/async-storage';

const DIFFICULTY_KEY = 'doomlock_difficulty_preference';

export type DifficultyPreference = 'easy' | 'medium' | 'hard' | 'mixed';

export const getDifficultyPreference = async (): Promise<DifficultyPreference> => {
  const stored = await AsyncStorage.getItem(DIFFICULTY_KEY);
  return (stored as DifficultyPreference) ?? 'mixed';
};

export const saveDifficultyPreference = async (
  difficulty: DifficultyPreference,
): Promise<void> => {
  await AsyncStorage.setItem(DIFFICULTY_KEY, difficulty);
};
