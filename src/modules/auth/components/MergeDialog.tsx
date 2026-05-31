import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@core/theme';

export type MergeChoice = 'merge' | 'local' | 'cloud';

interface MergeDialogProps {
  visible: boolean;
  localCount: number;
  cloudCount: number;
  onChoice: (choice: MergeChoice) => void;
}

export function MergeDialog({ visible, localCount, cloudCount, onChoice }: MergeDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>☁️</Text>
          <Text style={styles.title}>Coleção encontrada</Text>
          <Text style={styles.subtitle}>Você tem figurinhas salvas localmente e na nuvem.</Text>

          <View style={styles.counts}>
            <CountBadge label="Neste celular" count={localCount} color={colors.secondary} />
            <CountBadge label="Na nuvem" count={cloudCount} color="#4285F4" />
          </View>

          <Text style={styles.question}>O que deseja fazer?</Text>

          <TouchableOpacity style={[styles.btn, styles.btnMerge]} onPress={() => onChoice('merge')}>
            <Text style={styles.btnTextLight}>🔀 Mesclar as duas coleções</Text>
            <Text style={styles.btnHint}>Mantém o status mais completo de cada figurinha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnLocal]} onPress={() => onChoice('local')}>
            <Text style={styles.btnTextDark}>📱 Usar coleção deste celular</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnCloud]} onPress={() => onChoice('cloud')}>
            <Text style={styles.btnTextDark}>☁️ Usar coleção da nuvem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CountBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.countBadge}>
      <Text style={[styles.countNum, { color }]}>{count}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: { fontSize: 48 },
  title: { ...typography.h2, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  counts: { flexDirection: 'row', gap: spacing.lg },
  countBadge: { alignItems: 'center', gap: 4 },
  countNum: { fontSize: 32, fontWeight: '800' },
  countLabel: { ...typography.caption, color: colors.textMuted },
  question: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btn: {
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  btnMerge: { backgroundColor: colors.primary },
  btnLocal: { backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#DDE3EA' },
  btnCloud: { backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#DDE3EA' },
  btnTextLight: { fontSize: 15, fontWeight: '700', color: colors.white },
  btnTextDark: { fontSize: 15, fontWeight: '600', color: colors.primary },
  btnHint: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
});
