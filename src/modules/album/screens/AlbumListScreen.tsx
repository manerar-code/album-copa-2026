import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { SearchInput } from '@shared/components/SearchInput';
import { ProgressBar } from '@shared/components/ProgressBar';
import { EmptyState } from '@shared/components/EmptyState';
import { colors, spacing, radius, shadows, typography } from '@app/theme';
import type { AlbumListScreenProps } from '@app/navigation/types';
import type { Selecao } from '@shared/types';

export function AlbumListScreen() {
  const navigation = useNavigation<AlbumListScreenProps['navigation']>();
  const [query, setQuery] = useState('');
  const { selecoes, figurinhas, collection } = useStickerStore();

  const filtered = selecoes.filter(
    s =>
      s.nome.toLowerCase().includes(query.toLowerCase()) ||
      s.codigo_fifa.toLowerCase().includes(query.toLowerCase()),
  );

  const getTeamStats = (selecaoId: string) => {
    const stickers = figurinhas.filter(f => f.selecao_id === selecaoId);
    const owned = stickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
    return { total: stickers.length, owned };
  };

  const renderItem = ({ item }: { item: Selecao }) => {
    const { total, owned } = getTeamStats(item.id);
    const progress = total > 0 ? owned / total : 0;
    return (
      <TouchableOpacity
        style={[styles.teamRow, shadows.card]}
        onPress={() => navigation.navigate('TeamDetail', { selecaoId: item.id, selecaoNome: item.nome })}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>🏳️</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{item.nome}</Text>
          <Text style={styles.sub}>{owned}/{total} · {item.codigo_fifa}</Text>
          <ProgressBar progress={progress} height={4} />
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Álbum</Text>
        <Text style={styles.subtitle}>{selecoes.length} seleções</Text>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar seleção..." />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState emoji="🔍" title="Nenhuma seleção encontrada" />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  header: { backgroundColor: colors.primary, padding: spacing.md, paddingBottom: spacing.lg },
  title: { ...typography.h1, color: colors.white },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  list: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  teamRow: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  flag: { fontSize: 24 },
  info: { flex: 1, gap: 4 },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textMuted },
  arrow: { color: '#ccc', fontSize: 22 },
});
