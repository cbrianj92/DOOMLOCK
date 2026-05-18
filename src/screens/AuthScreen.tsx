import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Spacing, Typography } from '../constants';
import { signIn, signUp } from '../services/auth';

interface Props {
  onComplete: () => void;
}

type Mode = 'signup' | 'login';

const AuthScreen: React.FC<Props> = ({ onComplete }) => {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const toggleMode = () => {
    setMode(m => (m === 'signup' ? 'login' : 'signup'));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: signInError } = await signIn(email.trim(), password);
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      onComplete();
    } else {
      const { session, error: signUpError } = await signUp(email.trim(), password);
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // Supabase requires email confirmation by default — no session until confirmed
      if (!session) {
        setConfirmationSent(true);
        return;
      }
      onComplete();
    }
  };

  if (confirmationSent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.logo}>DOOMLOCK</Text>
          <Text style={styles.heading}>Check Your Email</Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to {email}. Click the link to activate
            your account, then log in here.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setConfirmationSent(false);
              setMode('login');
            }}>
            <Text style={styles.buttonText}>Go to Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior="height">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>DOOMLOCK</Text>
          <Text style={styles.heading}>
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          {error !== null && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signup' ? 'Create Account' : 'Log In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {mode === 'signup'
              ? 'Already have an account? Log in'
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  logo: {
    ...Typography.heading,
    fontSize: 32,
    color: Colors.primary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  heading: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.text,
  },
  form: {
    gap: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: '#dde2e8',
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.background,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  toggleText: {
    ...Typography.body,
    color: Colors.accent,
  },
  confirmBody: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});

export default AuthScreen;
