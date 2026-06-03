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
import { useUserSettingsStore, displayType } from '@shared/store/userSettingsStore';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { ProgressBar } from '@shared/components/ProgressBar';
import { EmptyState } from '@shared/components/EmptyState';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { FlagImage } from '@shared/components/FlagImage';
import { colors, fonts, spacing, radius, shadows } from '@core/theme';
import type { AlbumListScreenProps } from '@core/navigation/types';
import type { Selecao } from '@shared/types';

export function AlbumListScreen() {
  const navigation = useNavigation<AlbumListScreenProps['navigation']>();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { selecoes, figurinhas, collection, applyCollection, activeUserAlbumId, isInitialized } =
    useStickerStore();
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

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const f of figurinhas) {
      if (f.type && (!trackedTypes || trackedTypes.includes(f.type))) set.add(f.type);
    }
    return Array.from(set).sort();
  }, [figurinhas, trackedTypes]);

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
    const done = owned === total && total > 0;
    return (
      <TouchableOpacity
        style={[s.teamRow, shadows.card]}
        onPress={() =>
          navigation.navigate('TeamDetail', { selecaoId: item.id, selecaoNome: item.nome })
        }
        activeOpacity={0.7}
      >
        <FlagImage codigoFifa={item.codigo_fifa} bandeiraUrl={item.bandeira_url} size={28} />
        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>
              {item.nome}
            </Text>
            {done && <Text style={{ fontSize: 11 }}>✅</Text>}
          </View>
          <View style={s.progressRow}>
            <ProgressBar progress={progress} height={5} color={done ? colors.green : colors.gold} />
            <Text style={s.sub}>
              {owned}/{total} · {item.codigo_fifa}
            </Text>
          </View>
        </View>
        {dup > 0 && (
          <View style={s.dupBadge}>
            <Text style={s.dupBadgeText}>{dup} rep</Text>
          </View>
        )}
        <Text style={s.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader
        title="📖 Álbum"
        subtitle={`${selecoes.length} seleções`}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <View style={s.filterContainer}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar seleção, número, nome..."
        />
        {availableTypes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterScroll}
            contentContainerStyle={s.filterRow}
          >
            <TypeChip label="Todos" active={!selectedType} onPress={() => setSelectedType('')} />
            {availableTypes.map(t => (
              <TypeChip
                key={t}
                label={displayType(t)}
                active={selectedType === t}
                onPress={() => setSelectedType(selectedType === t ? '' : t)}
              />
            ))}
          </ScrollView>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={<EmptyState emoji="🔍" title="Nenhuma seleção encontrada" />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      />
    </SafeAreaView>
  );
}

function TypeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function AlbumListSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.ink900 }}
    >
      <View
        style={{ backgroundColor: colors.ink850, padding: spacing.md, paddingBottom: spacing.md }}
      >
        <SkeletonBox width="50%" height={22} style={{ marginBottom: spacing.sm }} />
        <SkeletonBox
          width="100%"
          height={40}
          borderRadius={radius.row}
          style={{ marginBottom: spacing.sm }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[60, 80, 70].map((w, i) => (
            <SkeletonBox key={i} width={w} height={28} borderRadius={radius.pill} />
          ))}
        </View>
      </View>
      <View
        style={{ padding: spacing.md, backgroundColor: colors.appBg, flex: 1, gap: spacing.sm }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <SkeletonBox key={i} width="100%" height={68} borderRadius={radius.row} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  filterContainer: {
    backgroundColor: colors.ink850,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  list: { padding: spacing.md, backgroundColor: colors.appBg, flexGrow: 1 },

  teamRow: {
    backgroundColor: colors.glass,
    borderRadius: radius.row,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.tx, flex: 1 },
  progressRow: { gap: 6 },
  sub: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.txFaint },
  arrow: { color: colors.txFaint, fontSize: 18 },

  filterScroll: { marginTop: spacing.sm },
  filterRow: { flexDirection: 'row', gap: 6, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: { backgroundColor: 'rgba(231,180,60,0.18)', borderColor: colors.gold },
  chipText: { fontSize: 12, color: colors.txMut, fontWeight: '500' },
  chipTextActive: { color: colors.gold, fontWeight: '700' },

  dupBadge: {
    backgroundColor: 'rgba(231,180,60,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.35)',
  },
  dupBadgeText: { fontSize: 11, fontWeight: '700', color: colors.gold },
});
