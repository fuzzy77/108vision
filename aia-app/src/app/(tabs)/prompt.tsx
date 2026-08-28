import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Badge, Card, PrimaryButton, Screen } from '@/components/ui';
import { checkHealth, explain, explainPublic, type ChatResult } from '@/lib/api';
import { getCachedUser, getToken, logout, type AuthUser } from '@/lib/auth';
import { prompt as copy } from '@/lib/content';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function PromptScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ChatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  // null = checking liveness, true = APIs live, false = offline
  const [live, setLive] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([getToken(), getCachedUser(), checkHealth()]).then(
        ([t, u, healthy]) => {
          if (active) {
            setToken(t);
            setUser(u);
            setLive(healthy);
          }
        },
      );
      return () => {
        active = false;
      };
    }, []),
  );

  const onAsk = async () => {
    const message = input.trim();
    if (!message) return;

    if (live === false) {
      setError(copy.offline);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Anonymous if not logged in, tenant-scoped if logged in. Both are gated
    // behind the liveness check so the input only works when the APIs are up.
    const res = token
      ? await explain(message, token, copy.systemInstruction)
      : await explainPublic(message, copy.systemInstruction);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error.message);
    }
  };

  const onLogout = async () => {
    await logout();
    setToken(null);
    setUser(null);
  };

  const offline = live === false;
  const ready = live === true && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <StatusCard live={live} />

        {user ? (
          <Card>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionEmail} numberOfLines={1}>
                {user.email}
              </Text>
              <TouchableOpacity onPress={onLogout} accessibilityRole="button">
                <Text style={styles.logout}>Esci</Text>
              </TouchableOpacity>
            </View>
            <Badge>tenant: {user.tenantId ?? 'non assegnato'}</Badge>
          </Card>
        ) : (
          <Card>
            <Text style={styles.subtitle}>{copy.guestHint}</Text>
            <Link href="/login" style={styles.link}>
              {copy.loginAction}
            </Link>
          </Card>
        )}

        <TextInput
          style={styles.input}
          multiline
          value={input}
          onChangeText={setInput}
          placeholder={offline ? copy.offline : copy.inputPlaceholder}
          placeholderTextColor={colors.ink400}
          editable={ready}
          textAlignVertical="top"
        />

        <PrimaryButton
          label={copy.button}
          onPress={onAsk}
          loading={loading}
          disabled={!input.trim() || !ready}
        />

        {loading ? <ActivityIndicator color={colors.primary700} /> : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <Card>
            <Text style={styles.resultText}>{result.content}</Text>
            <Text style={styles.metaText}>
              {result.model} · {result.tokens} token
            </Text>
          </Card>
        ) : null}

        <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function StatusCard({ live }: { live: boolean | null }) {
  const checking = live === null;
  const online = live === true;
  const label = checking ? copy.checking : online ? copy.online : copy.offline;
  const dotColor = checking
    ? colors.ink400
    : online
      ? colors.success
      : colors.danger;

  return (
    <View style={styles.statusCard}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.extrabold,
    color: colors.ink950,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.ink700,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.ink700,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionEmail: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.ink950,
    flexShrink: 1,
  },
  logout: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.danger,
  },
  link: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary700,
  },
  input: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink950,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.danger,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.ink900,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.ink400,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.ink400,
  },
});
