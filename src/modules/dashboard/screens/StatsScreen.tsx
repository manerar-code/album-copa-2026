import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';

import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, displayType } from '@shared/store/userSettingsStore';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { GlassCard } from '@shared/components/GlassCard';
import { ProgressBar } from '@shared/components/ProgressBar';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { FlagImage } from '@shared/components/FlagImage';
import { colors, fonts, spacing, radius, shadows } from '@core/theme';

export function StatsScreen() {
  const { figurinhas, selecoes, collection, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  const typeStats = useMemo(() => {
    const map = new Map<string, { total: number; owned: number; duplicate: number }>();
    for (const f of figurinhas) {
      if (trackedTypes && f.type && !trackedTypes.includes(f.type)) continue;
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
  const overallPct = totalStickers > 0 ? Math.round((totalOwned / totalStickers) * 100) : 0;

  const sections = [
    {
      title: `Por Tipo (${typeStats.length})`,
      data: typeStats,
      renderItem: ({ item }: { item: (typeof typeStats)[0] }) => (
        <View style={[s.row, shadows.card]}>
          <View style={s.rowInfo}>
            <Text style={s.rowTitle}>{item.type}</Text>
            <Text style={s.rowSub}>
              {item.owned + item.duplicate} de {item.total} · {item.duplicate} rep
            </Text>
            <ProgressBar progress={item.pct} height={4} />
          </View>
          <Text style={[s.rowPct, { color: item.pct >= 1 ? colors.green : colors.gold }]}>
            {Math.round(item.pct * 100)}%
          </Text>
        </View>
      ),
    },
    {
      title: `Por Seleção (${selecoes.length})`,
      data: teamStats,
      renderItem: ({ item }: { item: (typeof teamStats)[0] }) => (
        <View style={[s.row, shadows.card]}>
          <FlagImage codigoFifa={item.codigo_fifa} bandeiraUrl={item.bandeira_url} size={34} />
          <View style={s.rowInfo}>
            <Text style={s.rowTitle}>{item.nome}</Text>
            <Text style={s.rowSub}>
              {item.owned}/{item.total} · {item.dup} rep · {item.codigo_fifa}
            </Text>
            <ProgressBar progress={item.pct} height={4} />
          </View>
          <Text style={[s.rowPct, { color: item.pct >= 1 ? colors.green : colors.gold }]}>
            {Math.round(item.pct * 100)}%
          </Text>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader title="📊 Estatísticas" />
      <SectionList
        sections={sections as never[]}
        keyExtractor={(item: unknown, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        style={s.flatList}
        ListHeaderComponent={
          <View style={s.summarySection}>
            <Text style={s.sectionLabel}>Resumo</Text>
            <View style={s.summaryRow}>
              <SummaryCard
                label="Figurinhas"
                value={`${totalOwned}/${totalStickers}`}
                color={colors.goldSoft}
              />
              <SummaryCard label="Progresso" value={`${overallPct}%`} color={colors.gold} />
              <SummaryCard label="Completas" value={String(complete)} color={colors.green} />
            </View>
          </View>
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderSectionHeader={({ section }: any) => (
          <Text style={s.sectionLabel}>{section.title}</Text>
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

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <GlassCard style={s.summaryCard}>
      <Text style={[s.summaryValue, { color }]}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </GlassCard>
  );
}

function StatsSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.ink900 }}
    >
      <View
        style={{ backgroundColor: colors.ink850, padding: spacing.md, paddingBottom: spacing.lg }}
      >
        <SkeletonBox width="50%" height={24} style={{ marginBottom: spacing.md }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SkeletonBox width="30%" height={64} borderRadius={radius.glass} />
          <SkeletonBox width="30%" height={64} borderRadius={radius.glass} />
          <SkeletonBox width="30%" height={64} borderRadius={radius.glass} />
        </View>
      </View>
      <View style={{ backgroundColor: colors.appBg, flex: 1, paddingTop: spacing.sm }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <SkeletonBox
            key={i}
            width="90%"
            height={64}
            borderRadius={radius.row}
            style={{ alignSelf: 'center', marginBottom: spacing.sm }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  flatList: { backgroundColor: colors.appBg },
  list: { flexGrow: 1, paddingBottom: spacing.xl },

  summarySection: {
    backgroundColor: colors.ink850,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.glass,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.5 },
  summaryLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.txFaint,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.txFaint,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.appBg,
  },

  row: {
    backgroundColor: colors.glass,
    borderRadius: radius.row,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.tx },
  rowSub: { fontFamily: fonts.mono, fontSize: 11, color: colors.txMut },
  rowPct: {
    fontFamily: fonts.display,
    fontSize: 15,
    width: 40,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
});
