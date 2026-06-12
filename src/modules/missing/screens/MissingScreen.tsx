import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, isTypeTracked } from '@shared/store/userSettingsStore';
import { SearchInput } from '@shared/components/SearchInput';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { CromoCard } from '@shared/components/CromoCard';
import { FlagImage } from '@shared/components/FlagImage';
import { colors, fonts, spacing, teamColors, defaultTeamColors, teamFlagEmoji } from '@core/theme';
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
          const matchesType = isTypeTracked(trackedTypes, f.type);
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
          flag: teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴',
          teamColors: teamColors[codigoFifa] ?? defaultTeamColors,
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
      logger.log('export:clipboard', { missingCount: total });
    } catch {
      showFeedback('error');
      logger.error('export:clipboard:error');
    }
  }, [collection, selecoes, figurinhas, album, total, showFeedback]);

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader
        title="❌ Faltantes"
        subtitle={`${total} figurinhas · ${sections.length} seleções`}
        rightContent={
          <TouchableOpacity
            onPress={handleExport}
            disabled={total === 0}
            style={s.exportBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Exportar lista de faltantes"
          >
            <Text style={[s.exportBtnText, total === 0 && { opacity: 0.3 }]}>📋</Text>
          </TouchableOpacity>
        }
      />

      {feedback && (
        <View style={[s.feedbackBar, feedback === 'error' && s.feedbackBarError]}>
          <Text style={s.feedbackText}>
            {feedback === 'success' ? '✅ Lista copiada!' : '❌ Erro ao copiar'}
          </Text>
        </View>
      )}

      <View style={s.searchBox}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar figurinha que falta…"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        style={s.flatList}
        ListEmptyComponent={
          <EmptyState emoji="🎉" title="Nenhuma faltante!" subtitle="Você completou o álbum!" />
        }
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <FlagImage
              codigoFifa={section.codigoFifa}
              bandeiraUrl={section.bandeiraUrl}
              size={20}
            />
            <Text style={s.sectionName}>{section.title}</Text>
            <Text style={s.sectionCount}>
              {section.count} faltando · {section.codigoFifa}
            </Text>
          </View>
        )}
        renderItem={({ index, section }) => {
          if (index !== 0) return null;
          return (
            <View style={s.cromoGrid}>
              {section.data.map(f => (
                <CromoCard
                  key={f.id}
                  numero={f.numero}
                  descricao={f.descricao}
                  flag={section.flag}
                  f1={section.teamColors.f1}
                  f2={section.teamColors.f2}
                  state="missing"
                  width={72}
                />
              ))}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  searchBox: {
    backgroundColor: colors.ink850,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  flatList: { backgroundColor: colors.appBg },
  list: { padding: spacing.md, flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.tx, flex: 1 },
  sectionCount: { fontFamily: fonts.mono, fontSize: 10, color: colors.txFaint },

  cromoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginBottom: spacing.md,
  },

  exportBtn: { padding: 4 },
  exportBtnText: { fontSize: 18 },

  feedbackBar: { backgroundColor: colors.green, paddingVertical: 6, paddingHorizontal: spacing.md },
  feedbackBarError: { backgroundColor: colors.red },
  feedbackText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
