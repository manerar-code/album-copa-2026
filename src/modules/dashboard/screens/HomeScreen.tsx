import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { SearchInput } from '@shared/components/SearchInput';
import { ProgressBar } from '@shared/components/ProgressBar';
import { colors, spacing, radius, shadows, typography } from '@app/theme';

export function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { getStats, selecoes, figurinhas, collection } = useStickerStore();
  const stats = getStats();
  const pct = stats.total > 0 ? stats.owned / stats.total : 0;

  // Top 5 teams by completeness
  const teamsWithProgress = selecoes.slice(0, 5).map(s => {
    const stickers = figurinhas.filter(f => f.selecao_id === s.id);
    const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
    const dup = stickers.filter(f => (collection[f.id] ?? 'missing') === 'duplicate').length;
    return { ...s, total: stickers.length, owned, dup };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚽ Álbum Copa 2026</Text>
          <Text style={styles.subtitle}>Sua coleção</Text>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por número, país ou código..."
          />
        </View>

        <View style={styles.content}>
          {/* Progress Card */}
          <View style={[styles.card, shadows.card]}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>Progresso Geral</Text>
                <Text style={styles.progressSub}>
                  {stats.owned} de {stats.total} figurinhas
                </Text>
              </View>
              <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
            </View>
            <ProgressBar progress={pct} height={10} />
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Total" value={stats.total} color={colors.primary} />
            <StatCard label="Possuídas" value={stats.owned} color={colors.secondary} />
            <StatCard label="Faltantes" value={stats.missing} color="#E74C3C" />
            <StatCard label="Repetidas" value={stats.duplicate} color={colors.accent} />
          </View>

          {/* Recent teams */}
          {teamsWithProgress.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Seleções</Text>
              {teamsWithProgress.map(team => (
                <View key={team.id} style={[styles.teamRow, shadows.card]}>
                  <Text style={styles.teamFlag}>🏳️</Text>
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
                      <Text style={styles.dupBadgeText}>{team.dup} rep</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, shadows.card]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.lg },
  title: { ...typography.h1, color: colors.white },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  progressTitle: { ...typography.h3, color: colors.primary },
  progressSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  progressPct: { fontSize: 26, fontWeight: '700', color: colors.secondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, width: '47%' },
  statValue: { fontSize: 30, fontWeight: '700' },
  statLabel: { ...typography.label, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  teamRow: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  teamFlag: { fontSize: 24 },
  teamInfo: { flex: 1, gap: 4 },
  teamName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  teamSub: { ...typography.caption, color: colors.textMuted },
  dupBadge: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dupBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});
