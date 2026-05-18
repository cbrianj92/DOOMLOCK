# Doomlock

Block social media apps until you answer a real SAT or ACT practice question. Every correct answer earns screen time. Study more. Scroll less.

**Platform:** Android (React Native) — iOS planned for a future phase.

---

## Repo Structure

```
/android        Native Android project (Kotlin, Gradle)
                  BlockingModule.kt                   — JS bridge to write blocked app list to SharedPreferences
                  DoomlockAccessibilityService.kt     — intercepts blocked app opens, manages unlock timer

/src
  /screens      Full-screen React Native components
                  QuestionScreen.tsx                  — core question/answer/banking UI
                  OnboardingScreen.tsx                — first-run setup flow
                  AuthScreen.tsx                      — sign up / log in (Supabase Auth)
                  ProgressScreen.tsx                  — answer history, accuracy, subject breakdown
                  SettingsScreen.tsx                  — blocked app toggles, difficulty selection
                  SubjectSelectionScreen.tsx          — Pro subject picker (SAT/ACT subjects)

  /components   Reusable UI pieces
                  AnswerButton.tsx                    — answer choice row
                  TabBar.tsx                          — bottom navigation (Practice / Progress / Settings)
                  Timer.tsx                           — countdown display for active unlock window

  /services     External integrations and AsyncStorage wrappers
                  supabase.ts                         — Supabase client setup
                  auth.ts                             — session helpers
                  blocking.ts                         — syncs blocked app list to native layer
                  blockedApps.ts                      — AsyncStorage CRUD for blocked app list
                  cohort.ts                           — A/B/C cohort assignment for unlock durations
                  difficultyPreference.ts             — AsyncStorage CRUD for difficulty setting
                  flagQuestion.ts                     — writes to question_flags table
                  progress.ts                         — saves and queries progress records
                  proFeatures.ts                      — logs Pro feature taps for analytics
                  session.ts                          — entry point detection (direct vs accessibility-triggered)

  /hooks        Custom React hooks
                  useQuestion.ts                      — fetches a random question from Supabase
                  useUnlock.ts                        — manages global unlock timer state

  /utils        Helper functions
                  formatTime.ts                       — ms to m:ss display string

  /types        TypeScript type definitions
  /constants    Colors, spacing, typography, timing values

/scripts        Question bank tooling — see scripts/README.md
/docs           GitHub Pages landing page — see docs/README.md
/assets         Icons and design option files
```

---

## Tech Stack

- **React Native 0.85** (TypeScript, bare CLI — no Expo)
- **Supabase** — PostgreSQL database + Auth
- **Android Accessibility Service** — app blocking (required for Android 14+)
- **AsyncStorage + SharedPreferences** — shared unlock timer state between JS and native

## Dev Setup

Requires Node.js, Java 17, Android Studio, and Android SDK. See the [React Native environment setup docs](https://reactnative.dev/docs/set-up-your-environment).

```bash
npm install
npx react-native run-android
```

## Question Bank

289 AI-generated SAT/ACT practice questions across Math, Reading, Writing, English, and Science at Easy, Medium, and Hard difficulty. Already seeded in Supabase. See [`/scripts`](scripts/README.md) if the database needs to be rebuilt.
