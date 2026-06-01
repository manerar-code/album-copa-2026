import React, { useMemo, useState, useCallback, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { ProgressBar } from '@shared/components/ProgressBar';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { HelpModal } from '@shared/components/HelpModal';
import { OnboardingContext } from '@core/providers/OnboardingContext';
import { colors, spacing, radius, shadows, typography } from '@core/theme';
import { FlagImage } from '@shared/components/FlagImage';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { BottomTabParamList } from '@core/navigation/types';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { selecoes, figurinhas, collection, applyCollection, userAlbums, activeUserAlbumId, isInitialized } = useStickerStore();
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

  // Figurinhas filtradas pelos tipos selecionados
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

  const pct = stats.total > 0 ? stats.owned / stats.total : 0;

  const typeStats = useMemo(() => {
    const map = new Map<string, { total: number; owned: number }>();
    for (const f of trackedFigurinhas) {
      if (!f.type) continue;
      const status = collection[f.id] ?? 'missing';
      const entry = map.get(f.type) ?? { total: 0, owned: 0 };
      entry.total++;
      if (status !== 'missing') entry.owned++;
      map.set(f.type, entry);
    }
    return Array.from(map.entries())
      .map(([type, s]) => ({ type, ...s }))
      .sort((a, b) => b.owned / (b.total || 1) - a.owned / (a.total || 1));
  }, [trackedFigurinhas, collection]);

  // Seleções com repetidas
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
      >
        {/* Header */}
        <ScreenHeader
          title={`⚽ Olá, ${firstName}!`}
          subtitle="Álbum Copa 2026"
          onHelp={() => setHelpVisible(true)}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />

        {/* Card de progresso */}
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>PROGRESSO GERAL</Text>
                <Text style={styles.progressCount}>
                  {stats.owned} de {stats.total} figurinhas
                </Text>
              </View>
              <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
            </View>
            <ProgressBar progress={pct} height={10} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Total" value={stats.total} color={colors.primary} icon="📦" />
            <StatCard label="Tenho" value={stats.owned} color={colors.secondary} icon="✅" />
            <StatCard label="Faltam" value={stats.missing} color={colors.red} icon="❌" />
            <StatCard label="Repetidas" value={stats.duplicate} color={colors.accent} icon="🔄" />
          </View>

          {/* Por tipo */}
          {typeStats.length > 0 && (
            <>
              <SectionTitle title="Por Tipo" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScroll}
              >
                {typeStats.map(({ type, total, owned }) => (
                  <TypeCard key={type} label={type} owned={owned} total={total} />
                ))}
              </ScrollView>
            </>
          )}

          {/* Repetidas por seleção */}
          {teamsWithDuplicates.length > 0 && (
            <>
              <SectionTitle
                title="Repetidas por Seleção"
                action="Ver todas"
                onAction={() => navigation.navigate('Duplicates')}
              />
              {teamsWithDuplicates.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamRow, shadows.card]}
                  onPress={() => navigation.navigate('Album')}
                  activeOpacity={0.7}
                >
                  <FlagImage
                    codigoFifa={team.codigo_fifa}
                    bandeiraUrl={team.bandeira_url}
                    size={26}
                  />
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.nome}</Text>
                    <Text style={styles.teamSub}>
                      {team.owned}/{team.total} · {team.codigo_fifa}
                    </Text>
                    <ProgressBar
                      progress={team.total > 0 ? team.owned / team.total : 0}
                      height={4}
                    />
                  </View>
                  <View style={styles.dupBadge}>
                    <Text style={styles.dupBadgeText}>{team.dup} rep</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} onRestartTutorial={restartTutorial} />
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.statCard, shadows.card]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TypeCard({ label, owned, total }: { label: string; owned: number; total: number }) {
  const pct = total > 0 ? owned / total : 0;
  return (
    <View style={[styles.typeCard, shadows.card]}>
      <Text style={styles.typeValue}>{owned}</Text>
      <Text style={styles.typeLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.typeTotal}>de {total}</Text>
      <ProgressBar progress={pct} height={3} />
    </View>
  );
}

function HomeSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <View style={{ backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.xl }}>
        <SkeletonBox width="60%" height={24} style={{ marginBottom: spacing.sm }} />
        <SkeletonBox width="40%" height={14} style={{ marginBottom: spacing.md }} />
        <SkeletonBox width="100%" height={88} borderRadius={radius.lg} />
      </View>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <SkeletonBox width="47%" height={90} borderRadius={radius.lg} />
          <SkeletonBox width="47%" height={90} borderRadius={radius.lg} />
          <SkeletonBox width="47%" height={90} borderRadius={radius.lg} />
          <SkeletonBox width="47%" height={90} borderRadius={radius.lg} />
        </View>
        <SkeletonBox width="100%" height={64} borderRadius={radius.md} />
        <SkeletonBox width="100%" height={64} borderRadius={radius.md} />
        <SkeletonBox width="100%" height={64} borderRadius={radius.md} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, backgroundColor: colors.background },
  progressSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  progressCount: { ...typography.body, color: colors.white, fontWeight: '600' },
  progressPct: { fontSize: 32, fontWeight: '800', color: colors.accent },
  content: { padding: spacing.md, gap: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '47%',
    alignItems: 'flex-start',
    gap: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.primary },
  typeScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  typeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 110,
    marginRight: spacing.sm,
    gap: 2,
  },
  typeValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  typeLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  typeTotal: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  teamRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamInfo: { flex: 1, gap: 3 },
  teamName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  teamSub: { ...typography.caption, color: colors.textMuted },
  dupBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dupBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  arrow: { color: colors.border, fontSize: 22 },
});
