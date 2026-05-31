import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { authService } from '@modules/auth/services/authService';
import { colors, spacing, radius, typography } from '@core/theme';

const { width } = Dimensions.get('window');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FIFA_IMAGE = require('../../../../assets/fifa-wc-2026.png') as number;

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      onLoginSuccess();
    } catch {
      Alert.alert('Erro', 'Não foi possível fazer login com o Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero com imagem FIFA */}
        <View style={styles.hero}>
          <Image source={FIFA_IMAGE} style={styles.fifaImage} resizeMode="contain" />
          <Text style={styles.appName}>Álbum Copa 2026</Text>
          <Text style={styles.tagline}>Controle sua coleção · Salve na nuvem</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureRow emoji="☁️" text="Coleção salva na nuvem" />
          <FeatureRow emoji="📱" text="Acesse em qualquer dispositivo" />
          <FeatureRow emoji="🔄" text="Sincronização automática" />
          <FeatureRow emoji="⚽" text="1.195 figurinhas do álbum Panini" />
        </View>

        {/* Botão de login */}
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={handleGoogleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <View style={styles.gIcon}>
                  <Text style={styles.gLetter}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            Seus dados são privados e seguros.{'\n'}
            Apenas você acessa sua coleção.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: spacing.lg,
  },
  fifaImage: {
    width: width * 0.65,
    height: width * 0.65,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  features: {
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  bottom: {
    gap: spacing.md,
  },
  googleBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
  },
  googleBtnDisabled: { opacity: 0.7 },
  gIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLetter: { fontSize: 15, fontWeight: '800', color: colors.white },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  terms: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
