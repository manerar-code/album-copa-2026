import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, displayType } from '@shared/store/userSettingsStore';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { ProgressBar } from '@shared/components/ProgressBar';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { FlagImage } from '@shared/components/FlagImage';
import { colors, spacing, radius, shadows, typography } from '@core/theme';

export function StatsScreen() {
  const { figurinhas, selecoes, collection, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  // Estatísticas por tipo
  const typeStats = useMemo(() => {
    const map = new Map<string, { total: number; owned: number; duplicate: number }>();
    for (const f of figurinhas) {
      if (trackedTypes && !trackedTypes.includes(f.type)) continue;
      const t = displayType(f.type) || 'Sem tipo';
      const status = collection[f.id] ?? 'missing';
      const e = map.get(t) ?? { total: 0, owned: 0, duplicate: 0 };
      e.total++;
      if (status === 'owned') e.owned++;
      if (status === 'duplicate') e.duplicate++;
      map.set(t, e);
    }
    return Array.from(map.entries())
      .map(([type, s]) => ({
        type,
        ...s,
        pct: s.total > 0 ? (s.owned + s.duplicate) / s.total : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [figurinhas, collection, trackedTypes]);

  // Estatísticas por seleção
  const teamStats = useMemo(() => {
    return selecoes
      .map(s => {
        const stickers = figurinhas.filter(f => f.selecao_id === s.id);
        const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
        const dup = stickers.filter(f => (collection[f.id] ?? 'missing') === 'duplicate').length;
        const pct = stickers.length > 0 ? owned / stickers.length : 0;
        return { ...s, total: stickers.length, owned, dup, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [figurinhas, selecoes, collection]);

  if (!isInitialized) return <StatsSkeleton />;

  const totalOwned = teamStats.reduce((a, t) => a + t.owned, 0);
  const totalStickers = teamStats.reduce((a, t) => a + t.total, 0);
  const complete = teamStats.filter(t => t.pct === 1).length;

  const sections = [
    {
      title: `Por Tipo (${typeStats.length})`,
      data: typeStats,
      renderItem: ({ item }: { item: (typeof typeStats)[0] }) => (
        <View style={[styles.row, shadows.card]}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{item.type}</Text>
            <Text style={styles.rowSub}>
              {item.owned + item.duplicate} de {item.total} · {item.duplicate} rep
            </Text>
            <ProgressBar progress={item.pct} height={4} />
          </View>
          <Text style={styles.rowPct}>{Math.round(item.pct * 100)}%</Text>
        </View>
      ),
    },
    {
      title: `Por Seleção (${selecoes.length})`,
      data: teamStats,
      renderItem: ({ item }: { item: (typeof teamStats)[0] }) => (
        <View style={[styles.row, shadows.card]}>
          <FlagImage codigoFifa={item.codigo_fifa} bandeiraUrl={item.bandeira_url} size={24} />
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{item.nome}</Text>
            <Text style={styles.rowSub}>
              {item.owned}/{item.total} · {item.dup} rep · {item.codigo_fifa}
            </Text>
            <ProgressBar progress={item.pct} height={4} />
          </View>
          <Text style={styles.rowPct}>{Math.round(item.pct * 100)}%</Text>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="📊 Estatísticas" />
      <SectionList
        sections={sections as never[]}
        keyExtractor={(item: unknown, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.summaryRow}>
              <SummaryCard label="Figurinhas" value={`${totalOwned}/${totalStickers}`} />
              <SummaryCard
                label="Progresso"
                value={`${Math.round((totalOwned / (totalStickers || 1)) * 100)}%`}
              />
              <SummaryCard label="100% completas" value={String(complete)} />
            </View>
          </View>
        }

        renderSectionHeader={({ section: { title } }: { section: { title: string } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({
          item,
          section,
        }: {
          item: unknown;
          section: { renderItem: (args: { item: unknown }) => React.ReactNode };
        }) => section.renderItem({ item }) as React.ReactElement}
      />
    </SafeAreaView>
  );
}

function StatsSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <View style={{ backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.lg }}>
        <SkeletonBox width="50%" height={24} style={{ marginBottom: spacing.md }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SkeletonBox width="30%" height={64} borderRadius={radius.md} />
          <SkeletonBox width="30%" height={64} borderRadius={radius.md} />
          <SkeletonBox width="30%" height={64} borderRadius={radius.md} />
        </View>
      </View>
      <View style={{ backgroundColor: colors.background, flex: 1, paddingTop: spacing.sm }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <SkeletonBox
            key={i}
            width="90%"
            height={64}
            borderRadius={radius.md}
            style={{ alignSelf: 'center', marginBottom: spacing.sm }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  list: { flexGrow: 1, paddingBottom: spacing.xl },
  summarySection: { backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: colors.white },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textMuted },
  rowPct: { fontSize: 14, fontWeight: '700', color: colors.primary, width: 38, textAlign: 'right' },
});
