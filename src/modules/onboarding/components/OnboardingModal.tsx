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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius, gradients } from '@core/theme';
import { GlassCard } from '@shared/components/GlassCard';
import { GoldButton } from '@shared/components/GoldButton';
import { CromoCard } from '@shared/components/CromoCard';
import type { StickerStatus } from '@shared/types';

interface OnboardingModalProps {
  visible: boolean;
  onComplete(): void;
}

type SlideIndex = 0 | 1 | 2;

// ── Slide 1 ────────────────────────────────────────────────
const DEMO_STATES: StickerStatus[] = ['missing', 'owned', 'duplicate'];
const DEMO_CHIPS: { k: StickerStatus; e: string; t: string; c: string }[] = [
  { k: 'missing', e: '❌', t: 'Faltando', c: colors.red },
  { k: 'owned', e: '✅', t: 'Tenho', c: colors.green },
  { k: 'duplicate', e: '🔄', t: 'Repetida', c: colors.gold },
];

function Slide1() {
  const [idx, setIdx] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % 3), 1800);
    return () => clearInterval(t);
  }, []);
  const state = DEMO_STATES[idx];

  return (
    <View style={s.slide}>
      <Text style={s.slideTitle}>Como marcar figurinhas</Text>
      <Text style={s.slideDesc}>
        Toque em uma figurinha para alternar{'\n'}entre os três estados.
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <CromoCard
          numero="42"
          descricao="A. Ferreira"
          pos="ATA"
          flag="🇧🇷"
          f1="#1f8a4c"
          f2="#0c4225"
          state={state}
          dupCount={2}
          width={130}
        />
      </View>
      <Text style={s.tapHint}>👆 Toque na figurinha para alternar</Text>

      <View style={s.chipsRow}>
        {DEMO_CHIPS.map(chip => {
          const on = chip.k === state;
          return (
            <View
              key={chip.k}
              style={[
                s.stateChip,
                { borderColor: on ? chip.c : colors.line },
                on && {
                  shadowColor: chip.c,
                  shadowRadius: 8,
                  shadowOpacity: 0.4,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                },
              ]}
            >
              <Text style={{ fontSize: 13 }}>{chip.e}</Text>
              <Text style={[s.chipLabel, { color: on ? chip.c : colors.txMut }]}>{chip.t}</Text>
            </View>
          );
        })}
      </View>

      <Text style={s.cycleText}>Falta → Tenho → Repetida → Falta</Text>
      <Text style={s.cycleSubtext}>O ciclo completo com um só toque.</Text>
    </View>
  );
}

// ── Slide 2 ────────────────────────────────────────────────
const CARDS_2: [string, string, string][] = [
  [
    '☁️',
    'Sincronize seu progresso',
    'Seus dados ficam salvos na nuvem e sincronizados em todos os seus dispositivos.',
  ],
  [
    '🔄',
    'Nunca perca seus dados',
    'Mesmo sem internet, suas alterações são salvas e sincronizadas automaticamente.',
  ],
  [
    '📱',
    'Múltiplos dispositivos',
    'Use no celular e no tablet com o mesmo login — seu progresso sempre atualizado.',
  ],
];

function Slide2() {
  return (
    <View style={s.slide}>
      <Text style={s.slideTitle}>Crie sua conta</Text>
      <View style={{ gap: 13, width: '100%' }}>
        {CARDS_2.map(([icon, title, desc], i) => (
          <GlassCard key={i} style={s.benefitCard}>
            <View style={s.benefitIcon}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.benefitTitle}>{title}</Text>
              <Text style={s.benefitDesc}>{desc}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
      <Text style={s.footNote}>
        Faça login com sua conta Google nas configurações do app para ativar a sincronia.
      </Text>
    </View>
  );
}

// ── Slide 3 ────────────────────────────────────────────────
const TABS_3: [string, string, string][] = [
  ['🏠', 'Home', 'Visão geral do seu progresso'],
  ['📖', 'Álbum', 'Todas as seleções e figurinhas'],
  ['🔍', 'Faltantes', 'Figurinhas que ainda precisa'],
  ['🔄', 'Repetidas', 'Figurinhas para trocar'],
  ['📊', 'Stats', 'Estatísticas detalhadas'],
];

function Slide3() {
  return (
    <View style={s.slide}>
      <Text style={s.slideTitle}>Conheça o App</Text>
      <Text style={s.slideDesc}>Navegue pelas 5 abas na parte inferior da tela.</Text>
      <View style={{ gap: 10, width: '100%' }}>
        {TABS_3.map(([icon, name, desc], i) => (
          <GlassCard key={i} style={s.tabRow}>
            <View style={s.tabIcon}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <Text style={s.tabName}>{name}</Text>
            <Text style={s.tabDesc}>{desc}</Text>
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

const slides = [Slide1, Slide2, Slide3];

// ── Shell ──────────────────────────────────────────────────
export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState<SlideIndex>(0);
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (!prevVisibleRef.current && visible) setCurrentSlide(0);
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
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, currentSlide]);

  const handleNext = useCallback(() => {
    if (currentSlide < 2) setCurrentSlide(prev => (prev + 1) as SlideIndex);
  }, [currentSlide]);

  const SlideComponent = slides[currentSlide];
  const isLast = currentSlide === 2;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <LinearGradient
        colors={gradients.appBg.colors}
        start={gradients.appBg.start}
        end={gradients.appBg.end}
        style={s.root}
      >
        {/* Top bar */}
        <View style={s.topBar} testID="top-bar">
          <TouchableOpacity onPress={onComplete} testID="skip-button">
            <Text style={s.skipText}>Pular</Text>
          </TouchableOpacity>
          <View style={s.stepPill}>
            <Text style={s.stepText}>Passo {currentSlide + 1} de 3</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>

        {/* Slide content */}
        <View style={s.content} testID="content-area">
          <SlideComponent />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          {/* Dots */}
          <View style={s.dots}>
            {[0, 1, 2].map(n => (
              <View key={n} style={[s.dot, currentSlide === n && s.dotActive]} />
            ))}
          </View>
          <GoldButton
            label={isLast ? 'Concluir' : 'Próximo'}
            onPress={isLast ? onComplete : handleNext}
            style={s.primaryBtn}
          />
        </View>
      </LinearGradient>
    </Modal>
  );
}

const { width: SW } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 60 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 8,
  },
  skipText: { fontSize: 13, fontWeight: '700', color: colors.txFaint },
  stepPill: {
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepText: { fontSize: 12, color: colors.txMut, fontWeight: '600' },
  content: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  slide: { alignItems: 'center' },
  slideTitle: {
    fontFamily: fonts.display,
    fontSize: 25,
    color: colors.tx,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.txMut,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 30,
  },
  tapHint: { fontFamily: fonts.body, fontSize: 12, color: colors.txFaint, marginBottom: 16 },
  chipsRow: { flexDirection: 'row', gap: 9, justifyContent: 'center', marginBottom: 24 },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: colors.glass,
  },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  cycleText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.goldSoft,
    letterSpacing: 0.3,
  },
  cycleSubtext: { fontFamily: fonts.body, fontSize: 13, color: colors.txMut, marginTop: 6 },
  benefitCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 15,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,180,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.2)',
    flexShrink: 0,
  },
  benefitTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.tx, marginBottom: 3 },
  benefitDesc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.txMut, lineHeight: 18 },
  footNote: {
    textAlign: 'center',
    fontSize: 12.5,
    color: colors.txFaint,
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    borderRadius: 14,
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.line,
    flexShrink: 0,
  },
  tabName: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.tx, width: 88 },
  tabDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.txMut, flex: 1 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glass2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  primaryBtn: { width: SW - 48 },
});
