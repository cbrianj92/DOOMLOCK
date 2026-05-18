import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import { logProFeatureTap } from '../services/proFeatures';

interface Props {
  onBack: () => void;
}

const SUBJECTS = [
  'SAT Math',
  'SAT Reading',
  'SAT Writing',
  'ACT Math',
  'ACT Reading',
  'ACT English',
  'ACT Science',
];

const SubjectSelectionScreen: React.FC<Props> = ({ onBack }) => {
  const [toastSubject, setToastSubject] = useState<string | null>(null);

  const handleSubjectTap = (subject: string) => {
    logProFeatureTap('subject_selection'); // fire and forget
    setToastSubject(subject);
    setTimeout(() => setToastSubject(null), 2500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Choose a Subject</Text>
          <Text style={styles.subheading}>
            Practice a specific SAT or ACT subject area.
          </Text>
        </View>

        <View style={styles.subjectList}>
          {SUBJECTS.map(subject => (
            <TouchableOpacity
              key={subject}
              style={styles.subjectCard}
              onPress={() => handleSubjectTap(subject)}
              activeOpacity={0.75}>
              <View style={styles.subjectCardInner}>
                <Text style={styles.subjectName}>{subject}</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <View style={styles.lockOverlay} pointerEvents="none">
                <Text style={styles.lockIcon}>{'🔒'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {toastSubject !== null && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Pro feature — coming soon</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backText: {
    ...Typography.body,
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  heading: {
    ...Typography.heading,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.body,
    color: Colors.textLight,
  },
  subjectList: {
    gap: Spacing.sm,
  },
  subjectCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#dde2e8',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  subjectCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  subjectName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  proBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 28,
  },
  toast: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  toastText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: '600',
  },
});

export default SubjectSelectionScreen;
