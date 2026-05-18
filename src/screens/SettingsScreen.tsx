import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import {
  BlockedApp,
  DEFAULT_BLOCKED_APPS,
  getBlockedApps,
  saveBlockedApps,
} from '../services/blockedApps';
import { syncBlockedPackages } from '../services/blocking';
import {
  DifficultyPreference,
  getDifficultyPreference,
  saveDifficultyPreference,
} from '../services/difficultyPreference';

const DIFFICULTY_OPTIONS: { value: DifficultyPreference; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<DifficultyPreference>('mixed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBlockedApps(), getDifficultyPreference()]).then(
      ([apps, pref]) => {
        setBlockedSet(new Set(apps.map(a => a.packageName)));
        setDifficulty(pref);
        setLoading(false);
      },
    );
  }, []);

  const handleToggle = async (app: BlockedApp, enabled: boolean) => {
    const next = new Set(blockedSet);
    if (enabled) {
      next.add(app.packageName);
    } else {
      next.delete(app.packageName);
    }
    setBlockedSet(next);
    const updated = DEFAULT_BLOCKED_APPS.filter(a => next.has(a.packageName));
    await saveBlockedApps(updated);
    await syncBlockedPackages();
  };

  const handleDifficulty = async (value: DifficultyPreference) => {
    setDifficulty(value);
    await saveDifficultyPreference(value);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
      <Text style={styles.heading}>Settings</Text>

      <Text style={styles.sectionTitle}>Question Difficulty</Text>
      <Text style={styles.sectionSubtitle}>
        Choose which difficulty questions to practice.
      </Text>
      <View style={styles.segmentedControl}>
        {DIFFICULTY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, difficulty === opt.value && styles.segmentActive]}
            onPress={() => handleDifficulty(opt.value)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.segmentLabel,
                difficulty === opt.value && styles.segmentLabelActive,
              ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Blocked Apps</Text>
      <Text style={styles.sectionSubtitle}>
        Toggle off any app you don't want Doomlock to block.
      </Text>
      <View style={styles.card}>
        {DEFAULT_BLOCKED_APPS.map((app, index) => (
          <View
            key={app.packageName}
            style={[styles.row, index < DEFAULT_BLOCKED_APPS.length - 1 && styles.rowBorder]}>
            <Text style={styles.appName}>{app.displayName}</Text>
            <Switch
              value={blockedSet.has(app.packageName)}
              onValueChange={enabled => handleToggle(app, enabled)}
              trackColor={{ false: '#ccc', true: Colors.accent }}
              thumbColor={Colors.background}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heading: {
    ...Typography.heading,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionTitleSpaced: {
    marginTop: Spacing.lg,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dde3ea',
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentLabel: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  segmentLabelActive: {
    color: Colors.background,
  },
  card: {
    borderWidth: 1,
    borderColor: '#dde3ea',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f4',
  },
  appName: {
    ...Typography.body,
    color: Colors.text,
  },
});

export default SettingsScreen;
