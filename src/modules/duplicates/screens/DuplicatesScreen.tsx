import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
} from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { SearchInput } from '@shared/components/SearchInput';
import { EmptyState } from '@shared/components/EmptyState';
import { colors, spacing, radius, typography } from '@core/theme';

export function DuplicatesScreen() {
  const [query, setQuery] = useState('');
  const { figurinhas, selecoes, collection } = useStickerStore();

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    return selecoes
      .map(selecao => {
        const duplicates = figurinhas.filter(f => {
          const isDuplicate = (collection[f.id] ?? 'missing') === 'duplicate';
          const matchesSelecao = f.selecao_id === selecao.id;
          const matchesQuery =
            !q ||
            f.numero.toLowerCase().includes(q) ||
            selecao.nome.toLowerCase().includes(q) ||
            selecao.codigo_fifa.toLowerCase().includes(q);
          return isDuplicate && matchesSelecao && matchesQuery;
        });
        return { title: selecao.nome, count: duplicates.length, data: duplicates };
      })
      .filter(s => s.data.length > 0);
  }, [figurinhas, selecoes, collection, query]);

  const total = sections.reduce((acc, s) => acc + s.count, 0);

  const handleShare = async () => {
    const lines = [
      'Minhas figurinhas repetidas:\n',
      ...sections.map(s => `${s.title}\n${s.data.map(f => `  ${f.numero}`).join('\n')}`),
      '\nEnviado pelo Álbum Copa 2026',
    ];
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Repetidas</Text>
        <Text style={styles.subtitle}>
          {total} figurinhas · {sections.length} seleções
        </Text>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar..." />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            emoji="✅"
            title="Nenhuma repetida"
            subtitle="Você não tem figurinhas duplicadas."
          />
        }
        ListFooterComponent={
          sections.length > 0 ? (
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>📲 Compartilhar via WhatsApp</Text>
            </TouchableOpacity>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionFlag}>🏳️</Text>
            <Text style={styles.sectionName}>{section.title}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{section.count} repetidas</Text>
            </View>
          </View>
        )}
        renderItem={({ index, section }) => {
          if (index !== 0) return null;
          return (
            <View style={styles.chipsContainer}>
              {section.data.map(f => (
                <View key={f.id} style={styles.chip}>
                  <Text style={styles.chipText}>{f.numero}</Text>
                </View>
              ))}
            </View>
          );
        }}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionFlag: { fontSize: 18 },
  sectionName: { ...typography.body, fontWeight: '700', color: colors.primary },
  countBadge: {
    backgroundColor: '#FEF9E7',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countText: { fontSize: 11, color: colors.duplicate.text },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: {
    backgroundColor: colors.duplicate.background,
    borderWidth: 1,
    borderColor: colors.duplicate.border,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.duplicate.text },
  shareBtn: {
    backgroundColor: '#25D366',
    borderRadius: radius.lg,
    padding: spacing.md,
    margin: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
