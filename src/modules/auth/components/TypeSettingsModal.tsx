import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@core/theme';
import { useStickerStore } from '@modules/album/store/stickerStore';
import {
  useUserSettingsStore,
  FIXED_TYPE_LABELS,
  displayType,
} from '@shared/store/userSettingsStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TypeSettingsModal({ visible, onClose }: Props) {
  const { figurinhas } = useStickerStore();
  const { trackedTypes, setTrackedTypes } = useUserSettingsStore();

  // Tipos configuráveis como labels de exibição (sem os fixos)
  const configurableLabels = useMemo(() => {
    const set = new Set<string>();
    for (const f of figurinhas) {
      if (f.type) {
        const label = displayType(f.type);
        if (!FIXED_TYPE_LABELS.includes(label)) set.add(label);
      }
    }
    return Array.from(set).sort();
  }, [figurinhas]);

  // trackedTypes já armazena labels normalizadas
  const isTracked = (label: string) => !trackedTypes || trackedTypes.includes(label);

  const toggle = async (label: string) => {
    const current = trackedTypes ?? [...configurableLabels, ...FIXED_TYPE_LABELS];
    const next = current.includes(label) ? current.filter(t => t !== label) : [...current, label];
    await setTrackedTypes(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={styles.title}>⚙️ Tipos Controlados</Text>
          <Text style={styles.subtitle}>
            Ative os tipos que deseja incluir nas estatísticas e no álbum.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Locked mandatory types */}
            {FIXED_TYPE_LABELS.map(label => (
              <View key={label} style={styles.row} testID={`locked-${label}`}>
                <View style={[styles.check, styles.checkOn, styles.checkboxLocked]}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.typeLabel}>{label}</Text>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            ))}

            {configurableLabels.length > 0 && <View style={styles.divider} />}

            {configurableLabels.map(label => {
              const on = isTracked(label);
              return (
                <TouchableOpacity key={label} style={styles.row} onPress={() => toggle(label)}>
                  <View
                    style={[styles.check, on ? styles.checkOn : styles.checkOff]}
                    testID={`checkbox-${label}`}
                  >
                    {on && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={[styles.typeLabel, !on && styles.typeLabelOff]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar</Text>
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
    maxHeight: '70%',
  },
  title: { ...typography.h2, color: '#0C1322', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#646F88', marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  checkOff: { borderWidth: 1.5, borderColor: colors.border },
  checkIcon: { color: colors.white, fontSize: 14, fontWeight: '800' },
  typeLabel: { flex: 1, fontSize: 15, color: '#0C1322', fontWeight: '500' },
  typeLabelOff: { color: '#9AA6BE' },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  checkboxLocked: { opacity: 0.6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  lockIcon: { fontSize: 16, marginLeft: 4 },
});
