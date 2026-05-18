import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppState,
  AppStateStatus,
  BackHandler,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import { DEFAULT_BLOCKED_APPS } from '../services/blockedApps';
import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '../services/blocking';

const platformConstants = Platform.constants as unknown as Record<string, string>;
const brand = (platformConstants.Brand || '').toLowerCase();
const mfr = (platformConstants.Manufacturer || '').toLowerCase();
const IS_SAMSUNG = brand.includes('samsung') || mfr.includes('samsung');
const IS_XIAOMI =
  brand.includes('xiaomi') ||
  brand.includes('redmi') ||
  brand.includes('poco') ||
  mfr.includes('xiaomi');

interface Props {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  // Steps: 0=age gate, 1=terms, 2=welcome, 3=how it works, 4=accessibility, 5=blocked apps
  const [step, setStep] = useState(0);
  const [birthYear, setBirthYear] = useState('');
  const [birthYearError, setBirthYearError] = useState('');
  const [underAgeLocked, setUnderAgeLocked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showRestrictedWarning, setShowRestrictedWarning] = useState(false);
  const [permissionFailed, setPermissionFailed] = useState(false);
  const { bottom } = useSafeAreaInsets();
  const containerStyle = [styles.container, { paddingBottom: Spacing.lg + bottom }];
  const appStateRef = useRef(AppState.currentState);
  const wentToSettingsRef = useRef(false);

  useEffect(() => {
    if (step !== 4) return;

    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          if (wentToSettingsRef.current) {
            wentToSettingsRef.current = false;
            const enabled = await isAccessibilityServiceEnabled();
            if (enabled) {
              setStep(5);
            } else {
              setShowRestrictedWarning(false);
              setPermissionFailed(true);
            }
          }
        }
        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [step]);

  const advanceFromHowItWorks = async () => {
    const enabled = await isAccessibilityServiceEnabled();
    setStep(enabled ? 5 : 4);
  };

  const handleOpenSettings = () => {
    wentToSettingsRef.current = true;
    setShowRestrictedWarning(false);
    openAccessibilitySettings();
  };

  const handleEnablePress = () => {
    if ((IS_SAMSUNG || IS_XIAOMI) && !permissionFailed) {
      setShowRestrictedWarning(true);
    } else {
      handleOpenSettings();
    }
  };

  const handleAgeSubmit = () => {
    const year = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setBirthYearError('Please enter a valid birth year.');
      return;
    }
    if (currentYear - year < 13) {
      setUnderAgeLocked(true);
      return;
    }
    setBirthYearError('');
    setStep(1);
  };

  // Step 0: Age gate
  if (step === 0) {
    if (underAgeLocked) {
      return (
        <View style={containerStyle}>
          <Text style={styles.heading}>Sorry!</Text>
          <Text style={styles.body}>
            Doomlock is for students aged 13 and up. We're sorry, but you're not
            eligible to use the app at this time.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSpaced]}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.buttonText}>Close App</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={containerStyle}>
        <Text style={styles.heading}>Before You Start</Text>
        <Text style={styles.body}>
          Doomlock is for students aged 13 and older. Please enter your year of
          birth to continue.
        </Text>
        <Text style={styles.inputLabel}>Year of Birth</Text>
        <TextInput
          style={styles.yearInput}
          value={birthYear}
          onChangeText={text => {
            setBirthYear(text);
            setBirthYearError('');
          }}
          placeholder="e.g. 2008"
          keyboardType="number-pad"
          maxLength={4}
          returnKeyType="done"
          onSubmitEditing={handleAgeSubmit}
        />
        {birthYearError ? (
          <Text style={styles.errorText}>{birthYearError}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.button, styles.buttonSpaced]}
          onPress={handleAgeSubmit}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 1: Terms acceptance
  if (step === 1) {
    return (
      <View style={containerStyle}>
        <Text style={styles.heading}>One Last Thing</Text>
        <Text style={styles.body}>Please confirm before we continue.</Text>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(prev => !prev)}
          activeOpacity={0.7}>
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            {'I am 13 or older and agree to the '}
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL(
                  'https://cbrianj92.github.io/DOOMLOCK/terms.html',
                )
              }>
              Terms of Service
            </Text>
            {' and '}
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL(
                  'https://cbrianj92.github.io/DOOMLOCK/privacy-policy.html',
                )
              }>
              Privacy Policy
            </Text>
            .
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSpaced,
            !termsAccepted && styles.buttonDisabled,
          ]}
          onPress={() => termsAccepted && setStep(2)}
          disabled={!termsAccepted}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 2: Welcome
  if (step === 2) {
    return (
      <View style={containerStyle}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>DOOMLOCK</Text>
          <Text style={styles.tagline}>Turn screen time into study time.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 3: How it works
  if (step === 3) {
    return (
      <View style={containerStyle}>
        <Text style={styles.heading}>How It Works</Text>
        <View style={styles.itemsContainer}>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>Open an app on your list</Text>
            <Text style={styles.itemBody}>
              Doomlock pauses you for a quick SAT practice question before you
              scroll.
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>Answer the question</Text>
            <Text style={styles.itemBody}>
              Correct earns more access time. Wrong shows the explanation — you
              still get access.
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.itemTitle}>One question per session</Text>
            <Text style={styles.itemBody}>
              Once you've answered, all your apps stay accessible until the study
              window ends.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={advanceFromHowItWorks}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 4: Accessibility permission
  if (step === 4) {
    if (permissionFailed) {
      return (
        <View style={containerStyle}>
          <Text style={styles.heading}>Having Trouble?</Text>
          {IS_SAMSUNG ? (
            <>
              <Text style={styles.body}>
                Samsung requires these steps in order — the three-dot menu only
                appears after you've tried to enable Doomlock in Accessibility
                first:
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepItem}>
                  1. Settings → Accessibility → Installed apps → find Doomlock
                  → try to turn it on
                </Text>
                <Text style={styles.stepNote}>
                  You'll see "For your security, this setting is unavailable."
                  Tap OK — this unlocks the next step.
                </Text>
                <Text style={styles.stepItem}>
                  2. Settings → Apps → Doomlock → ⋮ (three dots, top right) →
                  "Allow restricted settings"
                </Text>
                <Text style={styles.stepItem}>
                  3. Go back to Accessibility → Installed apps → enable Doomlock
                </Text>
              </View>
              <Text style={styles.stepNote}>
                On newer Samsung devices (Galaxy S24, Fold 6, Flip 6): first
                disable Auto Blocker under Settings → Security &amp; Privacy,
                then follow the steps above.
              </Text>
            </>
          ) : IS_XIAOMI ? (
            <>
              <Text style={styles.body}>
                On Xiaomi/MIUI, accessibility is in a non-standard location:
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepItem}>
                  1. Open Settings → Additional Settings
                </Text>
                <Text style={styles.stepItem}>2. Tap Accessibility</Text>
                <Text style={styles.stepItem}>
                  3. Find Doomlock and enable it
                </Text>
                <Text style={styles.stepItem}>
                  4. If Doomlock is grayed out, go to Battery → App battery
                  saver → Doomlock → No restrictions
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.body}>
                Here's how to enable the permission manually:
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepItem}>
                  1. Open your device Settings
                </Text>
                <Text style={styles.stepItem}>
                  2. Search for "Accessibility"
                </Text>
                <Text style={styles.stepItem}>
                  3. Find "Installed apps" or "Downloaded apps"
                </Text>
                <Text style={styles.stepItem}>
                  4. Find Doomlock and toggle it on
                </Text>
                <Text style={styles.stepItem}>
                  5. Confirm the warning dialog that appears
                </Text>
              </View>
            </>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonSpaced]}
            onPress={handleOpenSettings}>
            <Text style={styles.buttonText}>Try Again — Open Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showRestrictedWarning) {
      return (
        <View style={containerStyle}>
          {IS_SAMSUNG ? (
            <>
              <Text style={styles.heading}>One Extra Step for Samsung</Text>
              <Text style={styles.body}>
                Samsung requires these steps in order. Tap the button below
                first — we'll open Accessibility Settings for you.
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepItem}>
                  1. Find Doomlock and try to turn it on
                </Text>
                <Text style={styles.stepNote}>
                  You'll see "For your security, this setting is unavailable."
                  Tap OK — this unlocks the next step.
                </Text>
                <Text style={styles.stepItem}>
                  2. Go to Settings → Apps → Doomlock → ⋮ (three dots, top
                  right) → "Allow restricted settings"
                </Text>
                <Text style={styles.stepItem}>
                  3. Go back to Accessibility → Installed apps → enable Doomlock
                </Text>
              </View>
              <Text style={styles.stepNote}>
                On newer Samsung devices (Galaxy S24, Fold 6, Flip 6): first
                disable Auto Blocker under Settings → Security &amp; Privacy,
                then follow the steps above.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heading}>One Extra Step for Xiaomi</Text>
              <Text style={styles.body}>
                On Xiaomi/MIUI, accessibility settings are under Additional
                Settings, not the main menu:
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepItem}>
                  1. Settings → Additional Settings → Accessibility
                </Text>
                <Text style={styles.stepItem}>
                  2. Find Doomlock and enable it
                </Text>
                <Text style={styles.stepItem}>
                  3. Confirm the warning dialog
                </Text>
              </View>
            </>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonSpaced]}
            onPress={handleOpenSettings}>
            <Text style={styles.buttonText}>Open Accessibility Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenSettings}>
            <Text style={styles.secondaryButtonText}>
              Skip — take me straight to Settings
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={containerStyle}>
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
          onPress={handleEnablePress}>
          <Text style={styles.buttonText}>Enable in Settings</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {IS_SAMSUNG
            ? "Samsung requires one extra step — tap above and we'll walk you through it."
            : IS_XIAOMI
            ? "Xiaomi devices use a non-standard path — tap above and we'll guide you."
            : 'In Settings, find Doomlock under Installed Apps and turn it on. This screen will advance automatically.'}
        </Text>
      </View>
    );
  }

  // Step 5: Blocked apps confirmation
  return (
    <View style={containerStyle}>
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
  inputLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#dde3ea',
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    fontSize: 18,
    color: Colors.text,
  },
  errorText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...Typography.body,
    flex: 1,
    color: Colors.text,
    lineHeight: 24,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.4,
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
  stepsList: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#f8f9fa',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  stepItem: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  stepNote: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic',
    lineHeight: 19,
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
  secondaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  secondaryButtonText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textLight,
    textDecorationLine: 'underline',
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
