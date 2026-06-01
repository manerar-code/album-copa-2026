import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@core/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
}

const ITEMS = [
  {
    color: colors.missing.background,
    border: colors.missing.border,
    text: colors.missing.text,
    label: 'Faltando',
    desc: 'Você ainda não tem esta figurinha.',
  },
  {
    color: colors.owned.background,
    border: colors.owned.border,
    text: colors.owned.text,
    label: 'Colada ✓',
    desc: 'Figurinha já colada no álbum.',
  },
  {
    color: colors.duplicate.background,
    border: colors.duplicate.border,
    text: colors.duplicate.text,
    label: 'Repetida ★',
    desc: 'Você tem mais de uma desta figurinha.',
  },
  {
    color: colors.missing.background,
    border: colors.error,
    text: colors.error,
    label: '🔴 Troca disponível',
    desc: 'Esta figurinha está faltando neste álbum, mas existe como repetida em outro álbum seu. Você pode colá-la sem precisar comprar!',
  },
];

export function HelpModal({ visible, onClose, onRestartTutorial }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.title}>❓ Como funciona</Text>
          <Text style={styles.subtitle}>Toque em uma figurinha para alternar o status:</Text>
          <Text style={styles.cycle}>Faltando → Colada → Repetida → Faltando</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {ITEMS.map(item => (
              <View key={item.label} style={styles.row}>
                <View style={[styles.sample, { backgroundColor: item.color, borderColor: item.border }]}>
                  <Text style={[styles.sampleText, { color: item.text }]}>123</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {onRestartTutorial && (
            <TouchableOpacity style={styles.tutorialBtn} onPress={onRestartTutorial}>
              <Text style={styles.tutorialBtnText}>📖 Ver tutorial</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Entendi!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 2 },
  cycle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  list: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  sample: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sampleText: { fontSize: 13, fontWeight: '800' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  rowDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  tutorialBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tutorialBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
