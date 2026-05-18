import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import { DEFAULT_BLOCKED_APPS } from '../services/blockedApps';
import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '../services/blocking';

interface Props {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  // On step 2, auto-advance when the user grants accessibility permission
  useEffect(() => {
    if (step !== 2) return;

    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          const enabled = await isAccessibilityServiceEnabled();
          if (enabled) {
            setStep(3);
          }
        }
        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [step]);

  // Skip accessibility step if permission is already granted
  const advanceFromHowItWorks = async () => {
    const enabled = await isAccessibilityServiceEnabled();
    setStep(enabled ? 3 : 2);
  };

  if (step === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>DOOMLOCK</Text>
          <Text style={styles.tagline}>Turn screen time into study time.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setStep(1)}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>How It Works</Text>
        <View style={styles.itemsContainer}>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>Open an app on your list</Text>
            <Text style={styles.itemBody}>
              Doomlock pauses you for a quick SAT practice question before you scroll.
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>Answer the question</Text>
            <Text style={styles.itemBody}>
              Correct earns more access time. Wrong shows the explanation — you still get access.
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>One question per session</Text>
            <Text style={styles.itemBody}>
              Once you've answered, all your apps stay accessible until the study window ends.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={advanceFromHowItWorks}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>One Permission to Enable</Text>
        <Text style={styles.body}>
          Doomlock uses Android's Accessibility Service to recognize when you
          open an app on your study list, so it can prompt a practice question.
        </Text>
        <Text style={[styles.body, styles.bodySpaced]}>
          We only detect app window changes — we never read your screen content
          or any personal data.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonSpaced]}
          onPress={openAccessibilitySettings}>
          <Text style={styles.buttonText}>Enable in Settings</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          In Settings, find Doomlock under Installed Apps and turn it on. This
          screen will advance automatically.
        </Text>
      </View>
    );
  }

  // Step 3: Blocked apps confirmation
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Study Triggers</Text>
      <Text style={styles.body}>
        Opening any of these apps will prompt a quick SAT practice question:
      </Text>
      <ScrollView
        style={styles.appList}
        contentContainerStyle={styles.appListContent}>
        {DEFAULT_BLOCKED_APPS.map(app => (
          <View key={app.packageName} style={styles.appItem}>
            <Text style={styles.appName}>{app.displayName}</Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={onComplete}>
        <Text style={styles.buttonText}>Let's Study</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    ...Typography.heading,
    fontSize: 40,
    color: Colors.primary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textLight,
  },
  heading: {
    ...Typography.heading,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  body: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  bodySpaced: {
    marginTop: Spacing.sm,
  },
  itemsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  howItWorksItem: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#f8f9fa',
    borderRadius: BorderRadius.card,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  itemTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  itemBody: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  buttonSpaced: {
    marginTop: Spacing.lg,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.background,
  },
  hint: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  appList: {
    flex: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  appListContent: {
    paddingBottom: Spacing.xs,
  },
  appItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xs,
  },
  appName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default OnboardingScreen;
