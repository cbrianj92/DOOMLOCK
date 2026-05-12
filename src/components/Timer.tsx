import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants';
import formatTime from '../utils/formatTime';

interface Props {
  remainingMs: number;
}

const Timer: React.FC<Props> = ({ remainingMs }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Unlocked — time remaining</Text>
      <Text style={styles.time}>{formatTime(remainingMs)}</Text>
      <Text style={styles.subLabel}>All blocked apps are accessible until the timer ends.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.85,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  subLabel: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.75,
    textAlign: 'center',
  },
});

export default Timer;
