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
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { SearchInput } from '@shared/components/SearchInput';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { colors, spacing, radius, typography } from '@core/theme';
import { FlagImage } from '@shared/components/FlagImage';

export function DuplicatesScreen() {
  const [query, setQuery] = useState('');
  const { figurinhas, selecoes, collection } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    return selecoes
      .map(selecao => {
        const codigoFifa = selecao.codigo_fifa;
        const duplicates = figurinhas.filter(f => {
          const isDuplicate = (collection[f.id] ?? 'missing') === 'duplicate';
          const matchesSelecao = f.selecao_id === selecao.id;
          const matchesType = !trackedTypes || trackedTypes.includes(f.type);
          const matchesQuery =
            !q ||
            f.numero.toLowerCase().includes(q) ||
            selecao.nome.toLowerCase().includes(q) ||
            selecao.codigo_fifa.toLowerCase().includes(q);
          return isDuplicate && matchesSelecao && matchesType && matchesQuery;
        });
        return {
          title: selecao.nome,
          codigoFifa,
          bandeiraUrl: selecao.bandeira_url,
          count: duplicates.length,
          data: duplicates,
        };
      })
      .filter(s => s.data.length > 0);
  }, [figurinhas, selecoes, collection, query, trackedTypes]);

  const total = sections.reduce((acc, s) => acc + s.count, 0);

  const handleShare = async () => {
    const teamLines = sections.map(s => {
      const stickers = s.data.map(f => `  ${f.numero} · ${f.nome}`).join('\n');
      return `${s.title}\n${stickers}`;
    });
    const message = [
      '🔄 Minhas figurinhas repetidas — Álbum Copa 2026\n',
      ...teamLines,
      `\nTotal: ${total} repetidas em ${sections.length} seleções`,
      'Enviado pelo Álbum Copa 2026 📱',
    ].join('\n');
    await Share.share({ message });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="🔄 Repetidas"
        subtitle={`${total} figurinhas · ${sections.length} seleções`}
      />
      <View style={styles.searchBox}>
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
            <FlagImage
              codigoFifa={section.codigoFifa}
              bandeiraUrl={section.bandeiraUrl}
              size={22}
            />
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
  searchBox: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
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
