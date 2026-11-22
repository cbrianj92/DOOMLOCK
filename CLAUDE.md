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

## Technical Decisions Made During Build
- **App blocking approach**: Android Accessibility Service, NOT Usage Stats API.
  Android 14+ blocks activity launches from background services — accessibility 
  services are exempt. Requires user to enable in Settings → Accessibility.
  Use `typeAllMask` + `android:isAccessibilityTool="true"` for API 34+ compatibility.
- **Timer expiry**: Scheduled via `Handler.postDelayed` inside the accessibility 
  service so it can launch Doomlock mid-session from the service context.
- **Shared state**: Unlock expiry written to both AsyncStorage (JS) and 
  SharedPreferences (native) so the accessibility service can read it without 
  going through the JS bridge.
- **Supabase keys**: Uses publishable keys (`sb_publishable_...`), not anon keys.
  Variable name is `SUPABASE_PUBLISHABLE_KEY`. Works identically in `createClient()`.
- **targetSdkVersion**: 36 (Android 16). Emulator runs API 37.
- **AsyncStorage version**: Pinned to v1.23.1 — v2.x has a KMP dependency 
  (`storage-android`) that breaks the Android build.
- **URL polyfill**: `react-native-url-polyfill` imported in `index.js` (not 
  `supabase.ts`) with `unstable_enablePackageExports: true` in Metro config.
- **Blocked apps list** (stored in SharedPreferences as `blocked_packages`):
  - Instagram: `com.instagram.android`
  - TikTok: `com.zhiliaoapp.musically`
  - YouTube: `com.google.android.youtube`
  - Twitter/X: `com.twitter.android`
  - Snapchat: `com.snapchat.android`
  - Facebook: `com.facebook.katana`
  - Reddit: `com.reddit.frontpage`

## Development Workflow — GitHub Only (since Nov 2026)
There is no local dev machine. All work happens in Claude sessions that
commit to this repo; GitHub Actions builds the app.
- `.github/workflows/android-build.yml` runs on every push and PR:
  typecheck, lint, Jest, then `assembleRelease` + `bundleRelease`.
- Pushes to `main` publish the APK + AAB to the `latest-build`
  GitHub release (prerelease). Install the APK straight from a phone;
  upload the AAB to Play Console.
- `versionCode` = the workflow run number (passed as `-PversionCode`).
- Release signing key lives ONLY in repo secrets
  (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, alias `doomlock`).
  Never commit a keystore. Without the secrets, release builds are
  signed with the debug key.
- Verify changes by checking the Actions run, not by assuming they work.
  Real-device behavior (accessibility onboarding, blocking) still needs
  a human test on a phone.

## Current Build State (Nov 2026)
MVP (all 12 steps) + pre-beta build complete; paused May 19, 2026.
- Banking mechanic (30-min cap), question flagging, Settings tab
  (blocked-app toggles + difficulty), 289 SAT/ACT questions seeded
- Under-13 age gate, account deletion, "Pro coming soon" on subject selection
- Samsung accessibility-onboarding fix shipped but NOT verified on a real device
- Open question: Accessibility Service alone vs. adding VPN-based blocking
  as a fallback for Samsung/Xiaomi
- GitHub: github.com/cbrianj92/DOOMLOCK (note: repo name is uppercase)
- Landing page, Privacy Policy, Terms served from `docs/` via GitHub Pages

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

## Supabase Schema
Source of truth: `supabase/migrations/` (baseline captured from the live
project on 2026-11-22). Any schema change = a new migration file in that
folder, applied to the live project, committed in the same PR.
- Project ref: `qarrsjolwnhmoqtcikmc` (Free plan — pauses after ~7 days idle)
- Tables: questions, users (beta cohort A/B/C), progress, session_log,
  pro_feature_taps, question_flags, deletion_requests, beta_signups — all RLS
- `get_random_question(p_difficulty text default null)` returns one random question
- Question content lives in `scripts/batches/*.json` (289 questions),
  loaded with `npm run seed`

## MVP Build Order — Follow This Sequence
1. ✅ Folder structure setup
2. ✅ Constants file (colors, timing)
3. ✅ Supabase connection service
4. ✅ Supabase schema (questions + progress tables)
5. ✅ Question screen UI
6. ✅ Fetch real question from Supabase
7. ✅ Answer validation + explanation display
8. ✅ Unlock timer (global state)
9. ✅ App blocking integration
10. ✅ Onboarding flow
11. ✅ Auth (sign up / log in)
12. ✅ Progress screen

## Session Rules — Follow These Every Session
- Read this file before doing anything
- Confirm understanding by summarizing current build state
- Ask clarifying questions BEFORE writing code, not during
- Build one thing at a time — complete and test before moving on
- After each file creation, state what still needs to be connected
- Never assume a feature is wired up — explicitly connect everything
- If unsure about a React Native API or package, say so rather 
  than guessing
