# Doomlock — Claude Code Project Context

## What This App Does
Doomlock is a React Native mobile app that blocks social media apps 
and requires the user to correctly answer an SAT practice question 
to earn a 5-minute unlock window. Wrong answers show the correct 
answer with an explanation and earn a shorter unlock (3 min). 
The unlock window is shared across all blocked apps — one question 
per cycle, never two in a row.

## Tech Stack
- React Native 0.85 (TypeScript)
- Supabase (database + auth) 
- Android first, iOS later
- No Expo — bare React Native CLI project

## Key Design Decisions
- Freemium: all SAT subjects free (randomized), subject selection is Pro
- Student-controlled (no parent enforcement at MVP)
- AI-generated SAT questions (not College Board content)
- Wrong answer: replace question, show correct answer + explanation, 
  earn 3 min unlock instead of 5 min
- Correct answer: earn 5 min unlock
- Unlock window is SHARED across all blocked apps (global state)
- One question per unlock cycle — never two questions in a row

## Current Build State
- React Native project scaffolded and running on Android emulator
- App.tsx contains a basic "Hello Doomlock" test screen
- Supabase project created but schema not yet configured
- GitHub: github.com/cbrianj92/doomlock

## Folder Structure — Always Follow This
```
src/
  screens/         # Full screens (QuestionScreen, OnboardingScreen, etc.)
  components/      # Reusable UI pieces (QuestionCard, Timer, AnswerButton)
  services/        # External connections (supabase.ts, blocking.ts)
  hooks/           # Custom React hooks (useQuestion, useTimer, useUnlock)
  utils/           # Helper functions (formatTime, validateAnswer)
  types/           # TypeScript type definitions
  constants/       # Colors, timing values, config
assets/            # Images, fonts, icons
```

## Design System — Always Use These
```
Colors:
  primary: '#1a3a5c'     (dark navy)
  background: '#ffffff'  (white)
  accent: '#2E75B6'      (mid blue)
  success: '#27ae60'     (correct answer green)
  error: '#e74c3c'       (wrong answer red)
  text: '#333333'        (body text)
  textLight: '#888888'   (secondary text)

Typography:
  heading: bold, 24px+
  body: regular, 16px
  button: bold, 18px

Spacing: use multiples of 8 (8, 16, 24, 32, 48)
Border radius: 12px for cards, 8px for buttons
```

## Coding Rules — Always Follow These
- Keep it simple — this is MVP, no over-engineering
- No unnecessary abstractions or design patterns
- No premature optimization
- Functional components only, no class components
- Always use TypeScript types — no 'any'
- StyleSheet.create() for all styles — no inline styles
- One component per file
- Comment complex logic but don't over-comment obvious code
- Handle loading and error states for every Supabase call

## Component Pattern — Always Follow This Structure
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  // define props here
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks at top
  // handlers in middle
  // return JSX at bottom
  return (
    <View style={styles.container}>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default ComponentName;
```

## Key Integration Points — Understand These
- QuestionScreen fetches from Supabase → validates answer → 
  triggers UnlockTimer
- UnlockTimer manages GLOBAL unlock state (AsyncStorage) → 
  checked by all blocked apps before showing question
- Progress is tracked per user in Supabase after every answer
- Supabase auth gates all data access — user must be logged in

## Supabase Schema (planned)
```
questions table:
  id, subject, difficulty, question_text, 
  option_a, option_b, option_c, option_d,
  correct_answer, explanation, created_at

users table: (handled by Supabase Auth)

progress table:
  id, user_id, question_id, is_correct, 
  answered_at, unlock_duration_granted
```

## MVP Build Order — Follow This Sequence
1. Folder structure setup
2. Constants file (colors, timing)
3. Supabase connection service
4. Supabase schema (questions + progress tables)
5. Question screen UI
6. Fetch real question from Supabase
7. Answer validation + explanation display
8. Unlock timer (global state)
9. App blocking integration
10. Onboarding flow
11. Auth (sign up / log in)
12. Progress screen

## Session Rules — Follow These Every Session
- Read this file before doing anything
- Confirm understanding by summarizing current build state
- Ask clarifying questions BEFORE writing code, not during
- Build one thing at a time — complete and test before moving on
- After each file creation, state what still needs to be connected
- Never assume a feature is wired up — explicitly connect everything
- If unsure about a React Native API or package, say so rather 
  than guessing
