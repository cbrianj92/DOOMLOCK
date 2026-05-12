import React, { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import QuestionScreen from './src/screens/QuestionScreen';
import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  syncBlockedPackages,
} from './src/services/blocking';

function App() {
  const appState = useRef(AppState.currentState);

  const initBlocking = async () => {
    const enabled = await isAccessibilityServiceEnabled();
    if (!enabled) {
      Alert.alert(
        'Accessibility Access Required',
        'Doomlock needs Accessibility access to monitor and block apps. Tap Continue, then enable Doomlock under Installed Apps.',
        [{ text: 'Continue', onPress: openAccessibilitySettings }]
      );
    } else {
      await syncBlockedPackages();
    }
  };

  useEffect(() => {
    initBlocking();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        initBlocking();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <QuestionScreen />;
}

export default App;
