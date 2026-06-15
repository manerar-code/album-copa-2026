import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
  ScrollView,
  Platform,
} from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { FlagImage } from '@shared/components/FlagImage';
import { colors, fonts, spacing, radius } from '@core/theme';
import { parseTradeList } from '../utils/parseTradeList';
import { formatTradeResult } from '../utils/formatTradeResult';
import type { Figurinha, Selecao } from '@shared/types';

type ViewState = 'input' | 'result';

interface TradeSection {
  title: string;
  codigoFifa: string;
  bandeira_url: string;
  data: Figurinha[];
}

interface ComparisonResult {
  sections: TradeSection[];
  totalCount: number;
  parsedCount: number;
  catalogMissCount: number;
}

function stripZeros(num: string): string {
  const s = num.replace(/^0+/, '');
  return s === '' ? '0' : s;
}

function runComparison(
  inputText: string,
  selecoes: Selecao[],
  figurinhas: Figurinha[],
  collection: Record<string, string>,
): ComparisonResult | null {
  const parseResult = parseTradeList(inputText, selecoes);
  if (parseResult.hasNoPrefix || parseResult.entries.length === 0) return null;

  const sectionMap = new Map<string, { selecao: Selecao; figurinhas: Figurinha[] }>();
  let catalogMissCount = 0;

  for (const entry of parseResult.entries) {
    const selecao = selecoes.find(
      s => s.codigo_fifa.toUpperCase() === entry.codigoFifa.toUpperCase(),
    );
    if (!selecao) {
      catalogMissCount++;
      continue;
    }

    const figurinha = figurinhas.find(
      f => f.selecao_id === selecao.id && stripZeros(f.numero) === stripZeros(entry.numero),
    );

    if (!figurinha) {
      catalogMissCount++;
      continue;
    }

    const status = collection[figurinha.id] ?? 'missing';
    if (status !== 'missing') continue;

    if (!sectionMap.has(selecao.id)) {
      sectionMap.set(selecao.id, { selecao, figurinhas: [] });
    }
    sectionMap.get(selecao.id)!.figurinhas.push(figurinha);
  }

  const sections: TradeSection[] = Array.from(sectionMap.values()).map(
    ({ selecao, figurinhas: figs }) => ({
      title: selecao.nome,
      codigoFifa: selecao.codigo_fifa,
      bandeira_url: selecao.bandeira_url,
      data: figs,
    }),
  );

  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);

  return {
    sections,
    totalCount,
    parsedCount: parseResult.entries.length,
    catalogMissCount,
  };
}

export function TradesScreen() {
  const { selecoes, figurinhas, collection, album, getStats } = useStickerStore();
  const [viewState, setViewState] = useState<ViewState>('input');
  const [inputText, setInputText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const stats = useMemo(() => getStats(), [collection]);
  const albumName = album?.nome ?? 'Álbum Copa 2026';

  const parsePreview = useMemo(() => {
    if (!inputText.trim()) return null;
    const parsed = parseTradeList(inputText, selecoes);
    if (parsed.hasNoPrefix) return null;
    if (parsed.entries.length === 0) return null;
    const selecaoSet = new Set(parsed.entries.map(e => e.codigoFifa));
    return `${parsed.entries.length} figurinhas encontradas em ${selecaoSet.size} seleção(ões)`;
  }, [inputText, selecoes]);

  function handleComparar() {
    const parsed = parseTradeList(inputText, selecoes);

    if (parsed.hasNoPrefix) {
      setParseError(
        'Nenhum código de país encontrado. Peça ao seu amigo para enviar a lista com o código da seleção (ex: BRA01, URU: 1, 2).',
      );
      return;
    }

    if (parsed.entries.length === 0) {
      setParseError('Nenhuma figurinha reconhecida. Verifique o formato da lista.');
      return;
    }

    setParseError(null);
    const comparison = runComparison(inputText, selecoes, figurinhas, collection);
    setResult(comparison);
    setViewState('result');
  }

  function handleReset() {
    setInputText('');
    setParseError(null);
    setResult(null);
    setViewState('input');
  }

  async function handleShare() {
    if (!result) return;
    const matches = result.sections.map(s => ({
      selecao: selecoes.find(sel => sel.codigo_fifa === s.codigoFifa)!,
      figurinhas: s.data,
    }));
    const message = formatTradeResult(matches, albumName);
    await Share.share({ message });
  }

  if (viewState === 'result') {
    const sections = result?.sections ?? [];
    const totalCount = result?.totalCount ?? 0;

    return (
      <SafeAreaView style={s.safeArea}>
        <ScreenHeader
          title="🤝 Trocas"
          subtitle={
            totalCount > 0 ? `Você precisa de ${totalCount} figurinhas` : 'Nenhuma em comum'
          }
        />

        {sections.length === 0 ? (
          <ScrollView contentContainerStyle={s.emptyContainer}>
            <EmptyState
              emoji="🤷"
              title="Nenhuma figurinha em comum"
              subtitle="Tente com outra lista de repetidas."
            />
            <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={s.resetBtnText}>Nova comparação</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <View style={s.sectionHeader}>
                <FlagImage
                  codigoFifa={section.codigoFifa}
                  bandeiraUrl={section.bandeira_url}
                  size={20}
                />
                <Text style={s.sectionName}>{section.title}</Text>
                <Text style={s.sectionCount}>{section.data.length} fig.</Text>
              </View>
            )}
            renderItem={({ index, section }) => {
              if (index !== 0) return null;
              const numbers = section.data.map((f: Figurinha) => f.numero).join(', ');
              return (
                <View style={s.numberRow}>
                  <Text style={s.numberText}>{numbers}</Text>
                </View>
              );
            }}
            ListFooterComponent={
              <View style={s.footer}>
                <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                  <Text style={s.shareBtnText}>📲 Enviar pelo WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                  <Text style={s.resetBtnText}>Nova comparação</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // Input view
  const hasNoMissing = stats.missing === 0;

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader title="🤝 Trocas" subtitle="Cole a lista de repetidas do amigo" />

      <ScrollView contentContainerStyle={s.inputContainer} keyboardShouldPersistTaps="handled">
        {hasNoMissing && (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              🏆 Você não tem nenhuma figurinha faltando — álbum completo!
            </Text>
          </View>
        )}

        <Text style={s.label}>Lista de repetidas do amigo</Text>
        <TextInput
          style={s.textInput}
          multiline
          numberOfLines={8}
          placeholder="Cole aqui a lista de repetidas do seu amigo (ex: BRA01 BRA02, URU: 1, 2)"
          placeholderTextColor={colors.txFaint}
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
          accessibilityLabel="Lista de repetidas"
        />

        {parsePreview && !parseError && <Text style={s.preview}>✓ {parsePreview}</Text>}

        {parseError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{parseError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.compareBtn, !inputText.trim() && s.compareBtnDisabled]}
          onPress={handleComparar}
          activeOpacity={0.8}
          disabled={!inputText.trim()}
          accessibilityLabel="Comparar"
        >
          <Text style={s.compareBtnText}>Comparar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  inputContainer: { padding: spacing.md, flexGrow: 1 },

  infoBox: {
    backgroundColor: colors.glass,
    borderRadius: radius.glass,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: { color: colors.goldSoft, fontFamily: fonts.bodySemiBold, fontSize: 13 },

  label: {
    color: colors.txMut,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  textInput: {
    backgroundColor: colors.ink800,
    borderRadius: radius.glass,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.tx,
    fontFamily: fonts.mono,
    fontSize: Platform.OS === 'web' ? 16 : 13,
    padding: spacing.md,
    minHeight: 140,
    marginBottom: spacing.sm,
  },

  preview: {
    color: colors.green,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: spacing.sm,
  },

  errorBox: {
    backgroundColor: 'rgba(255,93,82,0.12)',
    borderRadius: radius.glass,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: { color: '#FF5D52', fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },

  compareBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  compareBtnDisabled: { opacity: 0.4 },
  compareBtnText: { color: colors.ink900, fontFamily: fonts.bodyBold, fontSize: 15 },

  // Result view
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  footer: { marginTop: spacing.md, gap: spacing.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.tx, flex: 1 },
  sectionCount: { fontFamily: fonts.mono, fontSize: 10, color: colors.txFaint },

  numberRow: {
    backgroundColor: colors.ink800,
    borderRadius: radius.glass,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  numberText: { fontFamily: fonts.mono, fontSize: 13, color: colors.txMut, lineHeight: 20 },

  shareBtn: {
    backgroundColor: '#25D366',
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  resetBtn: {
    backgroundColor: colors.glass,
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  resetBtnText: { color: colors.txMut, fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
