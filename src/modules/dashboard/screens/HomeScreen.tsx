import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { ProgressBar } from '@shared/components/ProgressBar';
import { GlassCard } from '@shared/components/GlassCard';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { HelpModal } from '@shared/components/HelpModal';
import { FlagImage } from '@shared/components/FlagImage';
import { OnboardingContext } from '@core/providers/OnboardingContext';
import { colors, fonts, spacing, radius, gradients, shadows } from '@core/theme';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { BottomTabParamList } from '@core/navigation/types';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { selecoes, figurinhas, collection, applyCollection, activeUserAlbumId, isInitialized } =
    useStickerStore();
  const { user } = useAuthStore();
  const { trackedTypes } = useUserSettingsStore();
  const { restartTutorial } = useContext(OnboardingContext);
  const [refreshing, setRefreshing] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!activeUserAlbumId) return;
    setRefreshing(true);
    try {
      const cloud = await cloudCollectionService.load(activeUserAlbumId);
      await applyCollection(cloud);
    } finally {
      setRefreshing(false);
    }
  }, [activeUserAlbumId, applyCollection]);

  const trackedFigurinhas = useMemo(() => {
    if (!trackedTypes) return figurinhas;
    return figurinhas.filter(f => trackedTypes.includes(f.type));
  }, [figurinhas, trackedTypes]);

  const stats = useMemo(() => {
    const total = trackedFigurinhas.length;
    let owned = 0;
    let duplicate = 0;
    for (const f of trackedFigurinhas) {
      const status = collection[f.id] ?? 'missing';
      if (status === 'owned') owned++;
      else if (status === 'duplicate') duplicate++;
    }
    return { total, owned, duplicate, missing: total - owned - duplicate };
  }, [trackedFigurinhas, collection]);

  const pct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

  const teamsWithDuplicates = useMemo(() => {
    return selecoes
      .map(s => {
        const stickers = trackedFigurinhas.filter(f => f.selecao_id === s.id);
        const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
        const dup = stickers.filter(f => (collection[f.id] ?? 'missing') === 'duplicate').length;
        return { ...s, total: stickers.length, owned, dup };
      })
      .filter(s => s.dup > 0)
      .sort((a, b) => b.dup - a.dup);
  }, [trackedFigurinhas, selecoes, collection]);

  const firstName = user?.name?.split(' ')[0] ?? 'Colecionador';

  if (!isInitialized) return <HomeSkeleton />;

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        {/* Header */}
        <HomeHeader
          firstName={firstName}
          onHelp={() => setHelpVisible(true)}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />

        <View style={s.body}>
          {/* Progress card */}
          <GlassCard gold style={s.progressCard}>
            <View style={s.progressTop}>
              <View>
                <Text style={s.progressLabel}>PROGRESSO GERAL</Text>
                <Text style={s.progressCount}>
                  {stats.owned.toLocaleString('pt-BR')} de {stats.total.toLocaleString('pt-BR')}{' '}
                  figurinhas
                </Text>
              </View>
              <Text style={s.progressPct}>{pct}%</Text>
            </View>
            <ProgressBar progress={pct / 100} height={8} />
          </GlassCard>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            <StatTile emoji="📦" value={stats.total} label="Total" color={colors.goldSoft} />
            <StatTile emoji="✅" value={stats.owned} label="Tenho" color={colors.green} />
            <StatTile emoji="❌" value={stats.missing} label="Faltam" color={colors.red} />
            <StatTile emoji="🔄" value={stats.duplicate} label="Repetidas" color={colors.gold} />
          </View>

          {/* Teams with duplicates */}
          {teamsWithDuplicates.length > 0 && (
            <>
              <SectionLabel
                title="Repetidas por Seleção"
                action="Ver todas"
                onAction={() => navigation.navigate('Duplicates')}
              />
              {teamsWithDuplicates.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={s.teamRow}
                  onPress={() => navigation.navigate('Album')}
                  activeOpacity={0.7}
                >
                  <FlagImage
                    codigoFifa={team.codigo_fifa}
                    bandeiraUrl={team.bandeira_url}
                    size={26}
                  />
                  <View style={s.teamInfo}>
                    <Text style={s.teamName}>{team.nome}</Text>
                    <Text style={s.teamSub}>
                      {team.owned}/{team.total} · {team.codigo_fifa}
                    </Text>
                    <ProgressBar
                      progress={team.total > 0 ? team.owned / team.total : 0}
                      height={4}
                    />
                  </View>
                  <View style={s.dupBadge}>
                    <Text style={s.dupBadgeText}>{team.dup} rep</Text>
                  </View>
                  <Text style={s.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <HelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        onRestartTutorial={restartTutorial}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────

interface HomeHeaderProps {
  firstName: string;
  onHelp: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

function HomeHeader({ firstName, onHelp, onRefresh, refreshing }: HomeHeaderProps) {
  const { userAlbums, activeUserAlbumId } = useStickerStore();
  const { setShowAlbumsModal } = useAuthStore();
  const albumName = userAlbums.find(a => a.id === activeUserAlbumId)?.name ?? '';

  return (
    <LinearGradient
      colors={gradients.header.colors}
      start={gradients.header.start}
      end={gradients.header.end}
      style={s.header}
    >
      <View style={s.headerRow1}>
        <View style={s.headerLeft}>
          <View style={s.soccerChip}>
            <Text style={{ fontSize: 19 }}>⚽</Text>
          </View>
          <View>
            <Text style={s.headerGreet}>Olá, {firstName}!</Text>
            <Text style={s.headerSub}>Álbum Copa 2026</Text>
          </View>
        </View>
        <View style={s.headerRight} testID="header-right">
          <View style={s.headerActions}>
            <TouchableOpacity
              style={[s.iconBtn, { borderColor: 'rgba(231,180,60,0.4)' }]}
              onPress={onHelp}
            >
              <Text style={[s.iconTxt, { color: colors.gold, fontWeight: '800' }]}>?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={onRefresh} disabled={refreshing}>
              <Text style={s.iconTxt}>{refreshing ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.headerChipRow}>
            {!!albumName && (
              <TouchableOpacity style={s.albumChip} onPress={() => setShowAlbumsModal(true)}>
                <Text style={s.albumChipText} numberOfLines={1}>
                  {albumName} ▾
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={s.headerBorder} />
    </LinearGradient>
  );
}

function StatTile({
  emoji,
  value,
  label,
  color,
}: {
  emoji: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <GlassCard style={s.statTile}>
      <Text style={s.statEmoji}>{emoji}</Text>
      <Text style={[s.statValue, { color }]}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={s.statLabel}>{label.toUpperCase()}</Text>
    </GlassCard>
  );
}

function SectionLabel({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HomeSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.ink900 }}
    >
      <View
        style={{ backgroundColor: colors.ink850, padding: spacing.md, paddingBottom: spacing.xl }}
      >
        <SkeletonBox width="60%" height={24} style={{ marginBottom: spacing.sm }} />
        <SkeletonBox width="40%" height={14} style={{ marginBottom: spacing.md }} />
        <SkeletonBox width="100%" height={88} borderRadius={radius.glass} />
      </View>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[0, 1, 2, 3].map(i => (
            <SkeletonBox key={i} width="47%" height={90} borderRadius={radius.glass} />
          ))}
        </View>
        <SkeletonBox width="100%" height={64} borderRadius={radius.row} />
        <SkeletonBox width="100%" height={64} borderRadius={radius.row} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  container: { flex: 1, backgroundColor: colors.appBg },

  // Header
  header: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18, position: 'relative' },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  soccerChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,180,60,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.25)',
  },
  headerGreet: { fontFamily: fonts.display, fontSize: 20, color: colors.tx, letterSpacing: -0.4 },
  headerSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.txFaint, marginTop: 4 },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 9, paddingRight: 56 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: { fontSize: 14 },
  headerChipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  albumChip: {
    backgroundColor: 'rgba(231,180,60,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.3)',
  },
  albumChipText: { fontSize: 12, fontWeight: '700', color: colors.goldSoft },
  headerBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.lineSoft,
  },

  // Body
  body: { padding: spacing.md, gap: spacing.md },
  progressCard: { padding: '4%' },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 11,
  },
  progressLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.txFaint,
    letterSpacing: 1.4,
  },
  progressCount: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.tx, marginTop: 4 },
  progressPct: { fontFamily: fonts.display, fontSize: 34, color: colors.gold, letterSpacing: -1 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: { padding: 15, borderRadius: radius.glass, width: '47%' },
  statEmoji: { fontSize: 18, marginBottom: 10 },
  statValue: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.txFaint,
    letterSpacing: 1.4,
    marginTop: 3,
  },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.txFaint, letterSpacing: 1.4 },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.gold },

  teamRow: {
    backgroundColor: colors.glass,
    borderRadius: radius.row,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  teamInfo: { flex: 1, gap: 4 },
  teamName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.tx },
  teamSub: { fontFamily: fonts.mono, fontSize: 11, color: colors.txMut },
  dupBadge: {
    backgroundColor: 'rgba(231,180,60,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.35)',
  },
  dupBadgeText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  arrow: { color: colors.txFaint, fontSize: 22 },
});
