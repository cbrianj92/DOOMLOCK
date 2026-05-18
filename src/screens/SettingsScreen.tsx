import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { supabase } from '../services/supabase';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Delete user's own data rows (best-effort — RLS may restrict some)
        await supabase.from('progress').delete().eq('user_id', user.id);
        await supabase.from('question_flags').delete().eq('user_id', user.id);

        // Log deletion request so admin can delete the auth record
        await supabase.from('deletion_requests').insert({
          user_id: user.id,
          email: user.email ?? null,
          status: 'pending',
        });
      }
    } catch {
      // Continue regardless — sign-out still happens
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
    await supabase.auth.signOut();
    // App.tsx onAuthStateChange handles navigation to auth screen on SIGNED_OUT
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md },
        ]}>
        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.sectionTitle}>Question Difficulty</Text>
        <Text style={styles.sectionSubtitle}>
          Choose which difficulty questions to practice.
        </Text>
        <View style={styles.segmentedControl}>
          {DIFFICULTY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.segment,
                difficulty === opt.value && styles.segmentActive,
              ]}
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

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Blocked Apps
        </Text>
        <Text style={styles.sectionSubtitle}>
          Toggle off any app you don't want Doomlock to block.
        </Text>
        <View style={styles.card}>
          {DEFAULT_BLOCKED_APPS.map((app, index) => (
            <View
              key={app.packageName}
              style={[
                styles.row,
                index < DEFAULT_BLOCKED_APPS.length - 1 && styles.rowBorder,
              ]}>
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

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Account
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteButtonText}>Delete My Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteHint}>
          Can't access the app? Email{' '}
          <Text style={styles.deleteHintEmail}>support@doomlock.app</Text> to
          request deletion.
        </Text>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete My Account</Text>
            <Text style={styles.modalBody}>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </Text>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={handleDeleteAccount}
              disabled={deleting}>
              {deleting ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.modalDeleteText}>Delete My Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.error,
  },
  deleteHint: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  deleteHintEmail: {
    color: Colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    width: '100%',
  },
  modalTitle: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  modalBody: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#dde3ea',
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalCancelText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  modalDeleteButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalDeleteText: {
    ...Typography.button,
    color: Colors.background,
  },
});

export default SettingsScreen;
