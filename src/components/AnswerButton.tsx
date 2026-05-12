import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants';
import { AnswerOption } from '../types';

interface Props {
  letter: AnswerOption;
  text: string;
  onPress: (letter: AnswerOption) => void;
  selected: boolean;
  disabled: boolean;
}

const LABEL = { a: 'A', b: 'B', c: 'C', d: 'D' };

const AnswerButton: React.FC<Props> = ({ letter, text, onPress, selected, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.selected]}
      onPress={() => onPress(letter)}
      disabled={disabled}
      activeOpacity={0.7}>
      <View style={[styles.letterBadge, selected && styles.letterBadgeSelected]}>
        <Text style={[styles.letter, selected && styles.letterSelected]}>
          {LABEL[letter]}
        </Text>
      </View>
      <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={3}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dde3ea',
    borderRadius: BorderRadius.button,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background,
  },
  selected: {
    borderColor: Colors.accent,
    backgroundColor: '#EBF3FB',
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  letterBadgeSelected: {
    backgroundColor: Colors.accent,
  },
  letter: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  letterSelected: {
    color: Colors.background,
  },
  text: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  textSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default AnswerButton;
