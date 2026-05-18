import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import QuestionScreen from './QuestionScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import { getSession, signOut } from '../services/auth';
import { logSession } from '../services/session';
import { supabase } from '../services/supabase';
import { ProgressEntry } from '../types';

interface EnrichedEntry extends ProgressEntry {
  subject: string;
}

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

type SubView = 'progress' | 'practice' | 'subjects';

const ProgressScreen: React.FC = () => {
  const [subView, setSubView] = useState<SubView>('progress');
  const [rows, setRows] = useState<EnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const session = await getSession();
    if (!session) {
      setError('Not logged in.');
      setLoading(false);
      return;
    }

    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', session.user.id)
      .order('answered_at', { ascending: false })
      .limit(50);

    if (progressError) {
      setError(progressError.message);
      setLoading(false);
      return;
    }

    const progressRows = (progressData ?? []) as ProgressEntry[];

    if (progressRows.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const questionIds = [...new Set(progressRows.map(r => r.question_id))];
    const { data: questionData } = await supabase
      .from('questions')
      .select('id, subject')
      .in('id', questionIds);

    const questionMap = new Map<string, string>(
      ((questionData ?? []) as { id: string; subject: string }[]).map(q => [
        q.id,
        q.subject,
      ]),
    );

    setRows(
      progressRows.map(row => ({
        ...row,
        subject: questionMap.get(row.question_id) ?? 'Unknown',
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePracticeStart = () => {
    logSession('direct_practice'); // fire and forget
    setSubView('practice');
  };

  const handlePracticeComplete = () => {
    setSubView('progress');
    fetchData(); // refresh stats after practice answer
  };

  const handleSignOut = async () => {
    await signOut();
    // App.tsx auth state listener handles the navigation to auth screen
  };

  if (subView === 'practice') {
    return (
      <QuestionScreen
        isPractice
        onPracticeComplete={handlePracticeComplete}
      />
    );
  }

  if (subView === 'subjects') {
    return <SubjectSelectionScreen onBack={() => setSubView('progress')} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (rows.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyHeading}>Nothing here yet</Text>
        <Text style={styles.emptyBody}>
          Answer your first question to see your stats — total answered,
          accuracy percentage, a breakdown by SAT subject, and a history of
          every question you've seen.
        </Text>
        <TouchableOpacity style={styles.practiceButton} onPress={handlePracticeStart}>
          <Text style={styles.practiceButtonText}>Practice Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const total = rows.length;
  const correct = rows.filter(r => r.is_correct).length;
  const accuracy = Math.round((correct / total) * 100);

  const subjectMap = new Map<string, SubjectStat>();
  for (const row of rows) {
    const stat = subjectMap.get(row.subject) ?? {
      subject: row.subject,
      correct: 0,
      total: 0,
    };
    stat.total += 1;
    if (row.is_correct) stat.correct += 1;
    subjectMap.set(row.subject, stat);
  }
  const subjectStats = [...subjectMap.values()];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topRow}>
        <Text style={styles.heading}>Progress</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => requestAnimationFrame(() => setSubView('subjects'))}
          activeOpacity={0.7}>
          <Text style={styles.iconButtonText}>Subjects</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text
              style={[
                styles.statValue,
                { color: accuracy >= 70 ? Colors.success : Colors.error },
              ]}>
              {accuracy}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>By Subject</Text>
        {subjectStats.map(stat => (
          <View key={stat.subject} style={styles.subjectRow}>
            <Text style={styles.subjectName}>{stat.subject}</Text>
            <Text style={styles.subjectStat}>
              {stat.correct}/{stat.total} correct
            </Text>
          </View>
        ))}

        <View style={styles.recentHeader}>
          <Text style={styles.sectionHeading}>Recent Answers</Text>
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={handlePracticeStart}
            activeOpacity={0.8}>
            <Text style={styles.practiceButtonText}>Practice</Text>
          </TouchableOpacity>
        </View>

        {rows.map(row => (
          <View
            key={row.id}
            style={[
              styles.historyItem,
              row.is_correct ? styles.historyCorrect : styles.historyWrong,
            ]}>
            <View style={styles.historyLeft}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{row.subject}</Text>
              </View>
              <Text
                style={[
                  styles.historyResult,
                  { color: row.is_correct ? Colors.success : Colors.error },
                ]}>
                {row.is_correct ? 'Correct' : 'Incorrect'}
              </Text>
            </View>
            <Text style={styles.historyDate}>{formatDate(row.answered_at)}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  heading: {
    ...Typography.heading,
    color: Colors.primary,
  },
  iconButton: {
    backgroundColor: '#f0f4f8',
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  iconButtonText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  statValue: {
    ...Typography.heading,
    color: Colors.background,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionHeading: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xs,
  },
  subjectName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  subjectStat: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textLight,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  practiceButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  practiceButtonText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xs,
    borderLeftWidth: 4,
  },
  historyCorrect: {
    backgroundColor: '#eafaf1',
    borderLeftColor: Colors.success,
  },
  historyWrong: {
    backgroundColor: '#fdf2f2',
    borderLeftColor: Colors.error,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subjectBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subjectBadgeText: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.background,
  },
  historyResult: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textLight,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    ...Typography.button,
    color: Colors.background,
  },
  emptyHeading: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  signOutLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  signOutText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default ProgressScreen;
