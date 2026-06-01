import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@core/theme';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, FIXED_TYPES, displayType } from '@shared/store/userSettingsStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TypeSettingsModal({ visible, onClose }: Props) {
  const { figurinhas } = useStickerStore();
  const { trackedTypes, setTrackedTypes } = useUserSettingsStore();

  // Apenas tipos configuráveis (sem os fixos)
  const configurableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const f of figurinhas) if (f.type && !FIXED_TYPES.includes(f.type)) set.add(f.type);
    return Array.from(set).sort();
  }, [figurinhas]);

  const isTracked = (type: string) => !trackedTypes || trackedTypes.includes(type);

  const toggle = async (type: string) => {
    const allTypes = [...configurableTypes, ...FIXED_TYPES];
    const current = trackedTypes ?? allTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
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
            {configurableTypes.map(type => {
              const on = isTracked(type);
              return (
                <TouchableOpacity key={type} style={styles.row} onPress={() => toggle(type)}>
                  <View style={[styles.check, on ? styles.checkOn : styles.checkOff]}>
                    {on && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={[styles.typeLabel, !on && styles.typeLabelOff]}>
                    {displayType(type)}
                  </Text>
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
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
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
  checkOff: { borderColor: colors.border },
  checkIcon: { color: colors.white, fontSize: 14, fontWeight: '800' },
  typeLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  typeLabelOff: { color: colors.textMuted },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
