import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import { getSession } from './src/services/auth';
import { supabase } from './src/services/supabase';
import { syncBlockedPackages } from './src/services/blocking';
import { getAndClearNativeEntryPoint, logSession } from './src/services/session';
import TabBar, { Tab } from './src/components/TabBar';

const ONBOARDING_KEY = 'doomlock_onboarding_complete';

type AppStatus = 'loading' | 'onboarding' | 'auth' | 'main';

function App() {
  const [status, setStatus] = useState<AppStatus>('loading');
  const [activeTab, setActiveTab] = useState<Tab>('practice');

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        setStatus('auth');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAppState = async () => {
    const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!onboardingDone) {
      setStatus('onboarding');
      return;
    }
    const session = await getSession();
    if (session) {
      await syncBlockedPackages();
      // Determine entry point: check if the accessibility service flagged this launch
      const nativeEntryPoint = await getAndClearNativeEntryPoint();
      const entryPoint = nativeEntryPoint === 'overlay_triggered'
        ? 'overlay_triggered'
        : 'direct_open';
      logSession(entryPoint); // fire and forget
      setStatus('main');
    } else {
      setStatus('auth');
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await syncBlockedPackages();
    setStatus('auth');
  };

  const handleAuthComplete = async () => {
    await syncBlockedPackages();
    logSession('direct_open');
    setStatus('main');
  };

  if (status === 'loading') {
    return null;
  }

  if (status === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  if (status === 'auth') {
    return (
      <SafeAreaProvider>
        <AuthScreen onComplete={handleAuthComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {activeTab === 'practice' && <QuestionScreen />}
        {activeTab === 'progress' && <ProgressScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
