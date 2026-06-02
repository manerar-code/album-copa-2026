import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '@modules/auth/services/authService';
import { BrandMedallion, Wordmark } from '@shared/components/BrandMedallion';
import { GlassCard } from '@shared/components/GlassCard';
import { GoldButton } from '@shared/components/GoldButton';
import { colors, fonts, spacing, gradients } from '@core/theme';

const FEATURES: [string, string][] = [
  ['☁️', 'Coleção salva na nuvem'],
  ['📱', 'Acesse em qualquer dispositivo'],
  ['🔄', 'Sincronização automática'],
  ['⚽', '1.195 figurinhas do álbum Panini'],
];

const CONFETTI: [string, number, number, number, boolean][] = [
  ['#FF5D52', -14, 40, 0, false],
  ['#2BD17E', 300, 30, 90, true],
  ['#5B9BFF', 20, 250, 30, false],
  ['#E7B43C', 285, 200, 60, true],
];

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
      // silently fail — user stays on login screen
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.appBg.colors}
      start={gradients.appBg.start}
      end={gradients.appBg.end}
      style={s.root}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          {CONFETTI.map(([color, left, top, rotate, circle], i) => (
            <View
              key={i}
              style={[
                s.confettiDot,
                {
                  backgroundColor: color,
                  left,
                  top,
                  borderRadius: circle ? 4 : 2,
                  transform: [{ rotate: `${rotate}deg` }],
                },
              ]}
            />
          ))}
          <BrandMedallion size={128} />
          <View style={{ marginTop: 22 }}>
            <Wordmark />
          </View>
          <Text style={s.tagline}>Controle sua coleção · Salve na nuvem</Text>
        </View>

        {/* Feature list */}
        <GlassCard gold style={s.featuresCard}>
          {FEATURES.map(([icon, text], i) => (
            <FeatureRow key={i} icon={icon} text={text} last={i === FEATURES.length - 1} />
          ))}
        </GlassCard>

        <View style={s.spacer} />

        {/* Login button */}
        <TouchableOpacity
          style={s.googleBtnWrapper}
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          <GoldButton
            label="Entrar com Google"
            onPress={handleGoogleLogin}
            loading={loading}
            style={s.fullWidth}
          />
        </TouchableOpacity>

        <Text style={s.legal}>
          🔒 Seus dados são privados e seguros.{'\n'}Apenas você acessa sua coleção.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureRow({ icon, text, last }: { icon: string; text: string; last: boolean }) {
  return (
    <View style={[s.featureRow, !last && s.featureRowBorder]}>
      <View style={s.featureIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={s.featureText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingBottom: 40,
  },
  hero: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 44,
    marginBottom: 0,
  },
  confettiDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    opacity: 0.8,
  },
  tagline: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    color: colors.txMut,
    marginTop: 12,
  },
  featuresCard: {
    marginTop: 30,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,180,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.22)',
  },
  featureText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tx,
    flex: 1,
  },
  spacer: { flex: 1, minHeight: 24 },
  googleBtnWrapper: { marginBottom: 16 },
  fullWidth: { width: '100%' },
  legal: {
    fontFamily: fonts.body,
    textAlign: 'center',
    fontSize: 11.5,
    color: colors.txFaint,
    lineHeight: 18,
    paddingBottom: spacing.md,
  },
});
