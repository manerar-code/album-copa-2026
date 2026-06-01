import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { ProgressBar } from '@shared/components/ProgressBar';
import { EmptyState } from '@shared/components/EmptyState';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { colors, spacing, radius, shadows, typography } from '@core/theme';
import { FlagImage } from '@shared/components/FlagImage';
import type { AlbumListScreenProps } from '@core/navigation/types';
import type { Selecao } from '@shared/types';

export function AlbumListScreen() {
  const navigation = useNavigation<AlbumListScreenProps['navigation']>();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { selecoes, figurinhas, collection, applyCollection, syncUserId, activeUserAlbumId, userAlbums, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

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

  // Tipos distintos disponíveis na base
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const f of figurinhas) {
      if (f.type && (!trackedTypes || trackedTypes.includes(f.type))) set.add(f.type);
    }
    return Array.from(set).sort();
  }, [figurinhas, trackedTypes]);

  // IDs das seleções que têm pelo menos 1 figurinha do tipo selecionado
  const selecaoIdsComTipo = useMemo(() => {
    if (!selectedType) return null;
    const ids = new Set<string>();
    for (const f of figurinhas) {
      if (f.type === selectedType) ids.add(f.selecao_id);
    }
    return ids;
  }, [selectedType, figurinhas]);

  if (!isInitialized) return <AlbumListSkeleton />;

  const filtered = selecoes.filter(s => {
    const matchesText =
      s.nome.toLowerCase().includes(query.toLowerCase()) ||
      s.codigo_fifa.toLowerCase().includes(query.toLowerCase());
    const matchesType = !selecaoIdsComTipo || selecaoIdsComTipo.has(s.id);
    return matchesText && matchesType;
  });

  const getTeamStats = (selecaoId: string) => {
    const stickers = figurinhas
      .filter(f => f.selecao_id === selecaoId)
      .filter(f => !trackedTypes || trackedTypes.includes(f.type));
    const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
    const dup = stickers.filter(f => (collection[f.id] ?? 'missing') === 'duplicate').length;
    return { total: stickers.length, owned, dup };
  };

  const renderItem = ({ item }: { item: Selecao }) => {
    const { total, owned, dup } = getTeamStats(item.id);
    const progress = total > 0 ? owned / total : 0;
    return (
      <TouchableOpacity
        style={[styles.teamRow, shadows.card]}
        onPress={() =>
          navigation.navigate('TeamDetail', { selecaoId: item.id, selecaoNome: item.nome })
        }
        activeOpacity={0.7}
      >
        <FlagImage codigoFifa={item.codigo_fifa} bandeiraUrl={item.bandeira_url} size={28} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.nome}</Text>
          <Text style={styles.sub}>
            {owned}/{total} · {item.codigo_fifa}
          </Text>
          <ProgressBar progress={progress} height={4} />
        </View>
        {dup > 0 && (
          <View style={styles.dupBadge}>
            <Text style={styles.dupBadgeText}>{dup} rep</Text>
          </View>
        )}
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="📖 Álbum"
        subtitle={`${selecoes.length} seleções`}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <View style={styles.filterContainer}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar seleção, número, nome..."
        />
        {availableTypes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedType && styles.chipActive]}
              onPress={() => setSelectedType('')}
            >
              <Text style={[styles.chipText, !selectedType && styles.chipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {availableTypes.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedType === t && styles.chipActive]}
                onPress={() => setSelectedType(selectedType === t ? '' : t)}
              >
                <Text style={[styles.chipText, selectedType === t && styles.chipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState emoji="🔍" title="Nenhuma seleção encontrada" />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
      />
    </SafeAreaView>
  );
}

function AlbumListSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <View style={{ backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.md }}>
        <SkeletonBox width="50%" height={22} style={{ marginBottom: spacing.sm }} />
        <SkeletonBox width="100%" height={40} borderRadius={radius.md} style={{ marginBottom: spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SkeletonBox width={60} height={28} borderRadius={radius.full} />
          <SkeletonBox width={80} height={28} borderRadius={radius.full} />
          <SkeletonBox width={70} height={28} borderRadius={radius.full} />
        </View>
      </View>
      <View style={{ padding: spacing.md, backgroundColor: colors.background, flex: 1, gap: spacing.sm }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <SkeletonBox key={i} width="100%" height={68} borderRadius={radius.md} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  filterContainer: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  list: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  teamRow: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flag: { fontSize: 24 },
  info: { flex: 1, gap: 4 },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textMuted },
  arrow: { color: '#ccc', fontSize: 22 },
  filterScroll: {
    marginTop: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  dupBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dupBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});
