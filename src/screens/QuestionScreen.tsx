import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import AnswerButton from '../components/AnswerButton';
import Timer from '../components/Timer';
import useQuestion from '../hooks/useQuestion';
import useUnlock from '../hooks/useUnlock';
import { getCohortDurations } from '../services/cohort';
import { saveProgress, updateProgressRating } from '../services/progress';
import { flagQuestion } from '../services/flagQuestion';
import { Question, AnswerOption } from '../types';
import formatTime from '../utils/formatTime';

const MAX_BANK_MS = 30 * 60 * 1000;

type DifficultyRating = 'too_easy' | 'just_right' | 'too_hard';

const DIFFICULTY_COLOR: Record<Question['difficulty'], string> = {
  easy: Colors.success,
  medium: Colors.accent,
  hard: Colors.error,
};

interface Props {
  isPractice?: boolean;
  onPracticeComplete?: () => void;
}

const QuestionScreen: React.FC<Props> = ({
  isPractice = false,
  onPracticeComplete,
}) => {
  const { question, loading: questionLoading, error, refetch } = useQuestion();
  const { isUnlocked, remainingMs, startUnlock, loading: unlockLoading } =
    useUnlock();

  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cohortDurations, setCohortDurations] = useState({
    correct: 5 * 60 * 1000,
    wrong: 3 * 60 * 1000,
  });
  const progressIdRef = useRef<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [_ratingDismissed, setRatingDismissed] = useState(false);

  // Banking state (non-practice only)
  const [streakCount, setStreakCount] = useState(1);
  const [bankedMs, setBankedMs] = useState(0);
  const [maxReached, setMaxReached] = useState(false);

  // Flagging state
  const [flagged, setFlagged] = useState(false);
  const [showFlagToast, setShowFlagToast] = useState(false);
  const flagToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCorrect = submitted && selected === question?.correct_answer;
  const wasUnlocked = useRef(false);

  useEffect(() => {
    getCohortDurations().then(setCohortDurations);
  }, []);

  // Reset full streak when unlock window expires
  useEffect(() => {
    if (!isPractice && wasUnlocked.current && !isUnlocked && !unlockLoading) {
      setSelected(null);
      setSubmitted(false);
      setStreakCount(1);
      setBankedMs(0);
      setMaxReached(false);
      setFlagged(false);
      progressIdRef.current = null;
      setShowRating(false);
      setRatingDismissed(false);
      refetch();
    }
    wasUnlocked.current = isUnlocked;
  }, [isUnlocked, unlockLoading, refetch, isPractice]);

  // Save progress and show rating on submission
  useEffect(() => {
    if (!submitted || !question) return;
    const correct = selected === question.correct_answer;
    const durationToSave = isPractice
      ? 0
      : correct
      ? cohortDurations.correct
      : cohortDurations.wrong;
    saveProgress(question.id, correct, durationToSave).then(id => {
      progressIdRef.current = id;
    });
    setShowRating(true);
    setRatingDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const handleSelect = (letter: AnswerOption) => {
    if (!submitted) setSelected(letter);
  };

  const handleSubmit = () => {
    if (!selected || !question) return;
    // Update banking synchronously so display is correct on first render
    if (!isPractice && selected === question.correct_answer) {
      const newBanked = Math.min(bankedMs + cohortDurations.correct, MAX_BANK_MS);
      setBankedMs(newBanked);
      if (newBanked >= MAX_BANK_MS) setMaxReached(true);
    }
    setSubmitted(true);
  };

  const handleRatingTap = (rating: DifficultyRating) => {
    setShowRating(false);
    setRatingDismissed(true);
    if (progressIdRef.current) updateProgressRating(progressIdRef.current, rating);
  };

  const handleKeepGoing = () => {
    setSelected(null);
    setSubmitted(false);
    setShowRating(false);
    setRatingDismissed(false);
    setFlagged(false);
    progressIdRef.current = null;
    setStreakCount(prev => prev + 1);
    refetch();
  };

  const handleFlag = () => {
    if (flagged || !question) return;
    setFlagged(true);
    flagQuestion(question.id);
    if (flagToastRef.current) clearTimeout(flagToastRef.current);
    setShowFlagToast(true);
    flagToastRef.current = setTimeout(() => setShowFlagToast(false), 2500);
  };

  const handleUnlock = async () => {
    const duration = isCorrect
      ? bankedMs
      : Math.min(bankedMs + cohortDurations.wrong, MAX_BANK_MS);
    await startUnlock(duration);
  };

  if (questionLoading || (!isPractice && unlockLoading)) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!isPractice && isUnlocked) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
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
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'No question available.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const bankedMinutes = Math.round(bankedMs / 60000);
  const wrongTotalMinutes = Math.round(
    Math.min(bankedMs + cohortDurations.wrong, MAX_BANK_MS) / 60000,
  );
  const incrementMinutes = Math.round(cohortDurations.correct / 60000);

  let resultTitle = '';
  if (isCorrect) {
    if (maxReached) {
      resultTitle = 'Max reached! 30 min banked';
    } else if (!isPractice) {
      resultTitle = `Correct! +${incrementMinutes} min added`;
    } else {
      resultTitle = 'Correct!';
    }
  } else {
    if (!isPractice) {
      resultTitle = `Incorrect — ${wrongTotalMinutes} min unlocked`;
    } else {
      resultTitle = 'Incorrect';
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.appName}>Doomlock</Text>
        <View style={styles.headerRow}>
          <View style={styles.badges}>
            <View style={styles.subjectBadge}>
              <Text style={styles.badgeText}>{question.subject}</Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLOR[question.difficulty] },
              ]}>
              <Text style={styles.badgeText}>{question.difficulty}</Text>
            </View>
          </View>
          {!isPractice && (
            <View style={styles.streakInfo}>
              <Text style={styles.streakText}>Q{streakCount}</Text>
              {bankedMs > 0 && (
                <Text style={styles.bankedText}>{formatTime(bankedMs)} banked</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {question.passage && (
          <View style={styles.passageCard}>
            <Text style={styles.passageLabel}>Passage</Text>
            <Text style={styles.passageText}>{question.passage}</Text>
          </View>
        )}

        <View style={styles.questionCard}>
          <View style={styles.questionCardHeader}>
            <Text style={styles.questionLabel}>Question</Text>
            <TouchableOpacity
              onPress={handleFlag}
              disabled={flagged}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}>
              <Text style={[styles.flagButton, flagged && styles.flagButtonDone]}>
                {flagged ? 'Reported' : 'Report'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View
            style={[
              styles.resultCard,
              isCorrect ? styles.resultCorrect : styles.resultWrong,
            ]}>
            <Text style={styles.resultTitle}>{resultTitle}</Text>
            {!isPractice && isCorrect && !maxReached && (
              <Text style={styles.bankTotal}>{bankedMinutes} min total banked</Text>
            )}
            {!isCorrect && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {question.correct_answer.toUpperCase()}
              </Text>
            )}
            <Text style={styles.explanation}>{question.explanation}</Text>

            {showRating && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Rate this question:</Text>
                <View style={styles.ratingButtons}>
                  {(
                    [
                      ['too_easy', 'Too easy'],
                      ['just_right', 'Just right'],
                      ['too_hard', 'Too hard'],
                    ] as [DifficultyRating, string][]
                  ).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.ratingButton}
                      onPress={() => handleRatingTap(value)}
                      activeOpacity={0.7}>
                      <Text style={styles.ratingButtonText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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

        {/* Correct answer in main flow: banking buttons */}
        {submitted && !isPractice && isCorrect && !maxReached && (
          <View style={styles.bankingButtons}>
            <TouchableOpacity
              style={styles.keepGoingButton}
              onPress={handleKeepGoing}
              activeOpacity={0.8}>
              <Text style={styles.keepGoingText}>Keep Going →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cashOutButton}
              onPress={handleUnlock}
              activeOpacity={0.8}>
              <Text style={styles.unlockText}>Cash Out — {bankedMinutes} min</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Wrong answer or max reached: single unlock button */}
        {submitted && !isPractice && (!isCorrect || maxReached) && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlock}
            activeOpacity={0.8}>
            <Text style={styles.unlockText}>
              {maxReached
                ? 'Unlock 30 Minutes'
                : `Unlock ${wrongTotalMinutes} ${wrongTotalMinutes === 1 ? 'Minute' : 'Minutes'}`}
            </Text>
          </TouchableOpacity>
        )}

        {submitted && isPractice && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onPracticeComplete}
            activeOpacity={0.8}>
            <Text style={styles.unlockText}>Done</Text>
          </TouchableOpacity>
        )}
        {showFlagToast && (
          <View style={styles.flagToast}>
            <Text style={styles.flagToastText}>Thanks, we'll review it.</Text>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  streakInfo: {
    alignItems: 'flex-end',
  },
  streakText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.9,
  },
  bankedText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
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
  passageCard: {
    backgroundColor: '#f0f4f8',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  passageLabel: {
    ...Typography.body,
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  passageText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  questionCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  questionLabel: {
    ...Typography.body,
    color: Colors.textLight,
  },
  flagButton: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  flagButtonDone: {
    color: Colors.success,
  },
  flagToast: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'center',
  },
  flagToastText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.background,
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
  bankTotal: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
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
  ratingRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  ratingLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  ratingButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: BorderRadius.button,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ratingButtonText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
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
  bankingButtons: {
    gap: Spacing.xs,
  },
  keepGoingButton: {
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  keepGoingText: {
    ...Typography.button,
    color: Colors.background,
  },
  cashOutButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  unlockButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: Colors.accent,
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
