import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, UnlockDuration } from '../constants';
import { Question, AnswerOption } from '../types';
import AnswerButton from '../components/AnswerButton';
import Timer from '../components/Timer';
import useQuestion from '../hooks/useQuestion';
import useUnlock from '../hooks/useUnlock';

const DIFFICULTY_COLOR: Record<Question['difficulty'], string> = {
  easy: Colors.success,
  medium: Colors.accent,
  hard: Colors.error,
};

const QuestionScreen: React.FC = () => {
  const { question, loading: questionLoading, error, refetch } = useQuestion();
  const { isUnlocked, remainingMs, startUnlock, loading: unlockLoading } = useUnlock();
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && selected === question?.correct_answer;
  const wasUnlocked = useRef(false);

  // Reset to a fresh question when the unlock timer expires
  useEffect(() => {
    if (wasUnlocked.current && !isUnlocked && !unlockLoading) {
      setSelected(null);
      setSubmitted(false);
      refetch();
    }
    wasUnlocked.current = isUnlocked;
  }, [isUnlocked, unlockLoading, refetch]);

  const handleSelect = (letter: AnswerOption) => {
    if (!submitted) {
      setSelected(letter);
    }
  };

  const handleSubmit = () => {
    if (selected) {
      setSubmitted(true);
    }
  };

  const handleUnlock = async () => {
    const duration = isCorrect ? UnlockDuration.correct : UnlockDuration.wrong;
    await startUnlock(duration);
  };

  if (questionLoading || unlockLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  // Active unlock window — show timer instead of question
  if (isUnlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.appName}>Doomlock</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Timer remainingMs={remainingMs} />
          <Text style={styles.timerHint}>
            A new question will appear when the timer ends.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !question) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No question available.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.appName}>Doomlock</Text>
        <View style={styles.badges}>
          <View style={styles.subjectBadge}>
            <Text style={styles.badgeText}>{question.subject}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLOR[question.difficulty] }]}>
            <Text style={styles.badgeText}>{question.difficulty}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question</Text>
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>

        <View style={styles.answers}>
          {(['a', 'b', 'c', 'd'] as AnswerOption[]).map(letter => (
            <AnswerButton
              key={letter}
              letter={letter}
              text={question[`option_${letter}`]}
              onPress={handleSelect}
              selected={selected === letter}
              disabled={submitted}
            />
          ))}
        </View>

        {submitted && (
          <View style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            <Text style={styles.resultTitle}>
              {isCorrect ? 'Correct! +5 minutes' : 'Incorrect — +3 minutes'}
            </Text>
            {!isCorrect && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {question.correct_answer.toUpperCase()}
              </Text>
            )}
            <Text style={styles.explanation}>{question.explanation}</Text>
          </View>
        )}

        {!submitted && (
          <TouchableOpacity
            style={[styles.submitButton, !selected && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!selected}
            activeOpacity={0.8}>
            <Text style={styles.submitText}>Submit Answer</Text>
          </TouchableOpacity>
        )}

        {submitted && (
          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} activeOpacity={0.8}>
            <Text style={styles.unlockText}>
              {isCorrect ? 'Unlock for 5 Minutes' : 'Unlock for 3 Minutes'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appName: {
    ...Typography.heading,
    color: Colors.background,
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  subjectBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  scroll: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  timerHint: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  questionCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  questionLabel: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  questionText: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.primary,
  },
  answers: {
    marginBottom: Spacing.md,
  },
  resultCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultCorrect: {
    backgroundColor: '#eafaf1',
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  resultWrong: {
    backgroundColor: '#fdf2f2',
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  resultTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  correctAnswerText: {
    ...Typography.body,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  explanation: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#b0c4d8',
  },
  submitText: {
    ...Typography.button,
    color: Colors.background,
  },
  unlockButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  unlockText: {
    ...Typography.button,
    color: Colors.background,
  },
});

export default QuestionScreen;
