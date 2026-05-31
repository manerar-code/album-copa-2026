import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { ProgressBar } from '@shared/components/ProgressBar';
import { colors, spacing, radius, shadows, typography } from '@core/theme';
import { FlagImage } from '@shared/components/FlagImage';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { BottomTabParamList } from '@core/navigation/types';

type HomeNavProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { getStats, selecoes, figurinhas, collection } = useStickerStore();
  const { user } = useAuthStore();
  const stats = getStats();
  const pct = stats.total > 0 ? stats.owned / stats.total : 0;

  const typeStats = useMemo(() => {
    const map = new Map<string, { total: number; owned: number }>();
    for (const f of figurinhas) {
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
  }, [figurinhas, collection]);

  const topTeams = useMemo(() => {
    return selecoes
      .map(s => {
        const stickers = figurinhas.filter(f => f.selecao_id === s.id);
        const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
        const dup = stickers.filter(f => (collection[f.id] ?? 'missing') === 'duplicate').length;
        return { ...s, total: stickers.length, owned, dup };
      })
      .filter(s => s.owned > 0)
      .sort((a, b) => b.owned / (b.total || 1) - a.owned / (a.total || 1))
      .slice(0, 5);
  }, [figurinhas, selecoes, collection]);

  const firstName = user?.name?.split(' ')[0] ?? 'Colecionador';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Olá, {firstName}! 👋</Text>
              <Text style={styles.title}>⚽ Álbum Copa 2026</Text>
            </View>
          </View>

          {/* Card de progresso principal */}
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

          {/* Top seleções */}
          {topTeams.length > 0 && (
            <>
              <SectionTitle
                title="Seleções em destaque"
                action="Ver todas"
                onAction={() => navigation.navigate('Album')}
              />
              {topTeams.map(team => (
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
                  {team.dup > 0 && (
                    <View style={styles.dupBadge}>
                      <Text style={styles.dupBadgeText}>{team.dup}</Text>
                    </View>
                  )}
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingRight: 48, // espaço para o avatar flutuante
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  title: { ...typography.h1, color: colors.white },
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
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dupBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  arrow: { color: colors.border, fontSize: 22 },
});
