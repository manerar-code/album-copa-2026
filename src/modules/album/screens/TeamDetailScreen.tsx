import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { StickerCard } from '@modules/album/components/StickerCard';
import { ProgressBar } from '@shared/components/ProgressBar';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { colors, spacing, radius, typography } from '@core/theme';
import type { TeamDetailScreenProps } from '@core/navigation/types';

const NUM_COLUMNS = 5;

export function TeamDetailScreen({ route }: TeamDetailScreenProps) {
  const { selecaoId } = route.params;
  const { figurinhas, collection, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  const teamStickers = useMemo(() =>
    figurinhas
      .filter(f => f.selecao_id === selecaoId)
      .filter(f => !trackedTypes || trackedTypes.includes(f.type))
      .sort((a, b) => a.ordem - b.ordem),
    [figurinhas, selecaoId, trackedTypes],
  );

  if (!isInitialized) return <TeamDetailSkeleton />;

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

function TeamDetailSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ backgroundColor: colors.primary }}>
        <SkeletonBox width="100%" height={6} borderRadius={0} />
      </View>
      <View style={{ flexDirection: 'row', padding: spacing.sm + 4, gap: spacing.md, backgroundColor: colors.white }}>
        <SkeletonBox width={80} height={16} />
        <SkeletonBox width={60} height={16} />
        <SkeletonBox width={70} height={16} />
      </View>
      <View style={{ padding: spacing.sm, flexDirection: 'row', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(i => (
          <View key={i} style={{ width: '20%', padding: 4 }}>
            <SkeletonBox width="100%" height={60} borderRadius={radius.sm} />
          </View>
        ))}
      </View>
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
