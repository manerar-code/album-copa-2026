import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Dimensions,
} from 'react-native';
import { colors, spacing, radius, typography } from '@core/theme';
import type { StickerStatus } from '@shared/types';

interface OnboardingModalProps {
  visible: boolean;
  onComplete(): void;
}

type SlideIndex = 0 | 1 | 2;

const stateInfo: { label: string; status: StickerStatus }[] = [
  { label: 'Faltando', status: 'missing' },
  { label: 'Tenho', status: 'owned' },
  { label: 'Repetida', status: 'duplicate' },
];

const tabBarItems = [
  { icon: '🏠', label: 'Home', description: 'Visão geral do seu progresso' },
  { icon: '📖', label: 'Álbum', description: 'Todas as seleções e figurinhas' },
  { icon: '🔍', label: 'Faltantes', description: 'Figurinhas que ainda precisa' },
  { icon: '🔁', label: 'Repetidas', description: 'Figurinhas para trocar' },
  { icon: '📊', label: 'Stats', description: 'Estatísticas detalhadas' },
];

function DemoStickerCard() {
  const [demoStatus, setDemoStatus] = useState<StickerStatus>('missing');

  const stateColors: Record<StickerStatus, { background: string; text: string; border?: string }> = {
    missing: { background: colors.missing.background, text: colors.missing.text },
    owned: { background: colors.owned.background, text: colors.owned.text, border: colors.owned.border },
    duplicate: { background: colors.duplicate.background, text: colors.duplicate.text, border: colors.duplicate.border },
  };

  const cycleState = () => {
    setDemoStatus(prev => {
      if (prev === 'missing') return 'owned';
      if (prev === 'owned') return 'duplicate';
      return 'missing';
    });
  };

  const current = stateColors[demoStatus];

  return (
    <View style={styles.demoCardContainer}>
      <TouchableOpacity
        style={[
          styles.demoCard,
          { backgroundColor: current.background },
          current.border ? { borderWidth: 2, borderColor: current.border } : undefined,
        ]}
        onPress={cycleState}
        activeOpacity={0.7}
        testID="demo-sticker-card"
      >
        <Text style={[styles.demoCardNumber, { color: current.text }]}>#42</Text>
        <Text style={[styles.demoCardLabel, { color: current.text }]}>Neymar Jr.</Text>
      </TouchableOpacity>
      <Text style={styles.demoHint}>Toque na figurinha para alternar</Text>
      <View style={styles.stateIndicator}>
        {stateInfo.map(info => (
          <View
            key={info.status}
            style={[
              styles.stateDot,
              {
                backgroundColor: stateColors[info.status].background,
                borderColor: stateColors[info.status].border || stateColors[info.status].text,
                borderWidth: demoStatus === info.status ? 2 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.stateDotText,
                { color: stateColors[info.status].text, fontWeight: demoStatus === info.status ? '700' : '400' },
              ]}
            >
              {info.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Slide1() {
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Como marcar figurinhas</Text>
      <Text style={styles.slideDescription}>
        Toque em uma figurinha para alternar entre os estados:
      </Text>
      <DemoStickerCard />
      <Text style={styles.slideDescription}>
        Missing → Owned → Duplicate → Missing{'\n'}O ciclo completo com um toque!
      </Text>
    </View>
  );
}

function Slide2() {
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Crie sua conta</Text>
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>☁️</Text>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>Sincronize seu progresso</Text>
            <Text style={styles.benefitDesc}>
              Seus dados ficam salvos na nuvem e sincronizados em todos os seus dispositivos.
            </Text>
          </View>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔄</Text>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>Nunca perca seus dados</Text>
            <Text style={styles.benefitDesc}>
              Mesmo sem internet, suas alterações são salvas e sincronizadas automaticamente.
            </Text>
          </View>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📱</Text>
          <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>Múltiplos dispositivos</Text>
            <Text style={styles.benefitDesc}>
              Use no celular e no tablet com o mesmo login — seu progresso sempre atualizado.
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.slideDescription}>
        Faça login com sua conta Google nas configurações do app para ativar a sincronia.
      </Text>
    </View>
  );
}

function Slide3() {
  return (
    <View style={styles.slide}>
      <Text style={styles.slideTitle}>Conheça o App</Text>
      <Text style={styles.slideDescription}>
        Navegue pelas 5 abas na parte inferior da tela:
      </Text>
      <View style={styles.tabBarPreview}>
        {tabBarItems.map(tab => (
          <View key={tab.label} style={styles.tabItem} testID={`tab-item-${tab.label}`}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={styles.tabLabel}>{tab.label}</Text>
            <Text style={styles.tabDesc}>{tab.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const slides = [Slide1, Slide2, Slide3];
const slideLabels = ['Slide 1 de 3', 'Slide 2 de 3', 'Slide 3 de 3'];

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState<SlideIndex>(0);

  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (!prevVisibleRef.current && visible) {
      setCurrentSlide(0);
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const onBackPress = () => {
      if (currentSlide > 0) {
        setCurrentSlide(prev => (prev - 1) as SlideIndex);
        return true;
      }
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [visible, currentSlide]);

  const handleNext = useCallback(() => {
    if (currentSlide < 2) {
      setCurrentSlide(prev => (prev + 1) as SlideIndex);
    }
  }, [currentSlide]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const SlideComponent = slides[currentSlide];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleComplete} testID="skip-button">
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>{slideLabels[currentSlide]}</Text>
          <View style={styles.skipPlaceholder} />
        </View>

        <View style={styles.content}>
          <SlideComponent />
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[styles.dot, currentSlide === i && styles.dotActive]}
              />
            ))}
          </View>

          {currentSlide < 2 ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              testID="next-button"
            >
              <Text style={styles.primaryButtonText}>Próximo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleComplete}
              testID="complete-button"
            >
              <Text style={styles.primaryButtonText}>Concluir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
  skipPlaceholder: {
    width: 50,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
  },
  slideTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  demoCardContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  demoCard: {
    width: 120,
    height: 140,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  demoCardNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  demoCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  demoHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  stateIndicator: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stateDot: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  stateDotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  benefitIcon: {
    fontSize: 28,
    marginRight: spacing.md,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  benefitDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tabBarPreview: {
    width: '100%',
    gap: spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tabIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  tabLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    width: 80,
  },
  tabDesc: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: SCREEN_WIDTH - spacing.lg * 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.h3,
    color: colors.white,
  },
});
