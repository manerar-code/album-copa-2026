import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore } from '@shared/store/userSettingsStore';
import { SearchInput } from '@shared/components/SearchInput';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { colors, spacing, radius, typography } from '@core/theme';
import { FlagImage } from '@shared/components/FlagImage';
import { formatMissingList } from '../utils/formatMissingList';
import { logger } from '@shared/utils/logger';

export function MissingScreen() {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const { figurinhas, selecoes, collection, album } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    return selecoes
      .map(selecao => {
        const codigoFifa = selecao.codigo_fifa;
        const missing = figurinhas.filter(f => {
          const isMissing = (collection[f.id] ?? 'missing') === 'missing';
          const matchesSelecao = f.selecao_id === selecao.id;
          const matchesType = !trackedTypes || trackedTypes.includes(f.type);
          const matchesQuery =
            !q ||
            f.numero.toLowerCase().includes(q) ||
            selecao.nome.toLowerCase().includes(q) ||
            selecao.codigo_fifa.toLowerCase().includes(q);
          return isMissing && matchesSelecao && matchesType && matchesQuery;
        });
        return {
          title: selecao.nome,
          codigoFifa,
          bandeiraUrl: selecao.bandeira_url,
          count: missing.length,
          data: missing,
        };
      })
      .filter(s => s.data.length > 0);
  }, [figurinhas, selecoes, collection, query, trackedTypes]);

  const total = sections.reduce((acc, s) => acc + s.count, 0);

  const showFeedback = useCallback((type: 'success' | 'error') => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const handleExport = useCallback(async () => {
    const formattedText = formatMissingList(
      collection,
      selecoes,
      figurinhas,
      album?.nome ?? 'Álbum',
    );
    try {
      await Clipboard.setStringAsync(formattedText);
      showFeedback('success');
      logger.log('export:clipboard', { missingCount: total, filteredBySelecao: false });
    } catch {
      showFeedback('error');
      logger.error('export:clipboard:error');
    }
  }, [collection, selecoes, figurinhas, album, total, showFeedback]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="❌ Faltantes"
        subtitle={`${total} figurinhas · ${sections.length} seleções`}
        rightContent={
          <TouchableOpacity
            onPress={handleExport}
            disabled={total === 0}
            style={styles.exportBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Exportar lista de faltantes"
          >
            <Text style={[styles.exportBtnText, total === 0 && styles.exportBtnDisabled]}>
              📋
            </Text>
          </TouchableOpacity>
        }
      />
      {feedback && (
        <View style={[styles.feedbackBar, feedback === 'error' && styles.feedbackBarError]}>
          <Text style={styles.feedbackText}>
            {feedback === 'success' ? '✅ Lista copiada!' : '❌ Erro ao copiar'}
          </Text>
        </View>
      )}
      <View style={styles.searchBox}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar..." />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState emoji="🎉" title="Nenhuma faltante!" subtitle="Você completou o álbum!" />
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
              <Text style={styles.countText}>{section.count} faltantes</Text>
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
    backgroundColor: '#E8E8E8',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countText: { fontSize: 11, color: colors.textSecondary },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  exportBtn: { padding: 4 },
  exportBtnText: { fontSize: 18 },
  exportBtnDisabled: { opacity: 0.3 },
  feedbackBar: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  feedbackBarError: {
    backgroundColor: '#F44336',
  },
  feedbackText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
