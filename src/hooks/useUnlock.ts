import { useState, useEffect, useRef, useCallback } from 'react';
import { setUnlockExpiry, getRemainingMs, clearUnlockExpiry } from '../utils/unlockStorage';

interface UseUnlockResult {
  isUnlocked: boolean;
  remainingMs: number;
  startUnlock: (durationMs: number) => Promise<void>;
  loading: boolean;
}

const useUnlock = (): UseUnlockResult => {
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startCountdown = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(async () => {
      const remaining = await getRemainingMs();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearTimer();
        await clearUnlockExpiry();
      }
    }, 1000);
  }, []);

  // Check AsyncStorage on mount for an existing unlock window
  useEffect(() => {
    const init = async () => {
      const remaining = await getRemainingMs();
      setRemainingMs(remaining);
      setLoading(false);
      if (remaining > 0) {
        startCountdown();
      }
    };
    init();
    return () => clearTimer();
  }, [startCountdown]);

  const startUnlock = useCallback(async (durationMs: number) => {
    await setUnlockExpiry(durationMs);
    const remaining = await getRemainingMs();
    setRemainingMs(remaining);
    startCountdown();
  }, [startCountdown]);

  return {
    isUnlocked: remainingMs > 0,
    remainingMs,
    startUnlock,
    loading,
  };
};

export default useUnlock;
