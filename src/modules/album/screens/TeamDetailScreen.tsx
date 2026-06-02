import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { StickerCard } from '@modules/album/components/StickerCard';
import { ProgressBar } from '@shared/components/ProgressBar';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import {
  colors,
  fonts,
  spacing,
  radius,
  gradients,
  teamColors,
  defaultTeamColors,
  teamFlagEmoji,
} from '@core/theme';
import type { TeamDetailScreenProps } from '@core/navigation/types';

const NUM_COLUMNS = 3;
const CARD_W = 96;

export function TeamDetailScreen({ route }: TeamDetailScreenProps) {
  const { selecaoId, selecaoNome } = route.params;
  const { figurinhas, selecoes, collection, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  const selecao = selecoes.find(s => s.id === selecaoId);

  const teamStickers = useMemo(
    () =>
      figurinhas
        .filter(f => f.selecao_id === selecaoId)
        .filter(f => !trackedTypes || trackedTypes.includes(f.type))
        .sort((a, b) => a.ordem - b.ordem),
    [figurinhas, selecaoId, trackedTypes],
  );

  if (!isInitialized) return <TeamDetailSkeleton />;

  const owned = teamStickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
  const pct = teamStickers.length > 0 ? Math.round((owned / teamStickers.length) * 100) : 0;
  const codigoFifa = selecao?.codigo_fifa ?? '';
  const tc = teamColors[codigoFifa] ?? defaultTeamColors;
  const flagEmoji = teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.header.colors}
        start={gradients.header.start}
        end={gradients.header.end}
        style={s.header}
      >
        <View style={s.headerRow}>
          <View style={s.flagBox}>
            <Text style={{ fontSize: 24 }}>{flagEmoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.teamName}>{selecaoNome}</Text>
            <Text style={s.teamSub}>
              {codigoFifa} · {owned} de {teamStickers.length} figurinhas
            </Text>
          </View>
          <Text style={s.teamPct}>{pct}%</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <ProgressBar
            progress={pct / 100}
            height={6}
            color={pct === 100 ? colors.green : colors.gold}
          />
        </View>
        <View style={s.headerBorder} />
      </LinearGradient>

      {/* Sticker grid */}
      <FlatList
        data={teamStickers}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={({ item }) => {
          return (
            <View style={s.stickerWrapper}>
              <StickerCard
                figurinhaId={item.id}
                numero={item.numero}
                descricao={item.descricao}
                codigoFifa={codigoFifa}
                f1={tc.f1}
                f2={tc.f2}
                width={CARD_W}
              />
            </View>
          );
        }}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        style={s.flatList}
      />
    </SafeAreaView>
  );
}

function TeamDetailSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.ink900 }}
    >
      <View
        style={{ backgroundColor: colors.ink850, padding: spacing.md, paddingBottom: spacing.lg }}
      >
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={0}
          style={{ marginBottom: spacing.sm }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SkeletonBox width={80} height={16} />
          <SkeletonBox width={60} height={16} />
          <SkeletonBox width={70} height={16} />
        </View>
      </View>
      <View
        style={{
          padding: spacing.sm,
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: colors.appBg,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={{ width: '33.3%', padding: 7 }}>
            <SkeletonBox width="100%" height={CARD_W * 1.31} borderRadius={radius.cromo} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink900 },
  header: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16, position: 'relative' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flagBox: {
    width: 44,
    height: 44,
    borderRadius: radius.flagTile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  teamName: { fontFamily: fonts.display, fontSize: 22, color: colors.tx, letterSpacing: -0.4 },
  teamSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.txFaint, marginTop: 2 },
  teamPct: { fontFamily: fonts.display, fontSize: 24, color: colors.gold, letterSpacing: -1 },
  headerBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.lineSoft,
  },
  flatList: { backgroundColor: colors.appBg },
  grid: { padding: 14 },
  stickerWrapper: { flex: 1 / NUM_COLUMNS, padding: 7, alignItems: 'center' },
});
