import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { StickerCard } from '@modules/album/components/StickerCard';
import { ProgressBar } from '@shared/components/ProgressBar';
import { colors, spacing, typography } from '@core/theme';
import type { TeamDetailScreenProps } from '@core/navigation/types';

const NUM_COLUMNS = 5;

export function TeamDetailScreen({ route }: TeamDetailScreenProps) {
  const { selecaoId } = route.params;
  const { figurinhas, collection } = useStickerStore();

  const teamStickers = figurinhas
    .filter(f => f.selecao_id === selecaoId)
    .sort((a, b) => a.ordem - b.ordem);

  const owned = teamStickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
  const progress = teamStickers.length > 0 ? owned / teamStickers.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        <ProgressBar progress={progress} height={6} />
      </View>
      <View style={styles.legend}>
        <LegendItem color={colors.missing.background} label="Faltante" />
        <LegendItem color={colors.owned.border} label="Tenho" />
        <LegendItem color={colors.duplicate.border} label="Repetida" />
        <Text style={styles.counter}>
          {owned}/{teamStickers.length}
        </Text>
      </View>
      <FlatList
        data={teamStickers}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={({ item }) => (
          <View style={styles.stickerWrapper}>
            <StickerCard figurinhaId={item.id} numero={item.numero} descricao={item.descricao} />
          </View>
        )}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressBar: { backgroundColor: colors.primary },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 4,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { ...typography.caption, color: colors.textMuted },
  counter: { marginLeft: 'auto', ...typography.caption, fontWeight: '700', color: colors.primary },
  grid: { padding: spacing.sm },
  stickerWrapper: { flex: 1 / NUM_COLUMNS, padding: 4 },
});
