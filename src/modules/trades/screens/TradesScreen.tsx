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
  Platform,
  Alert,
} from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { FlagImage } from '@shared/components/FlagImage';
import { CromoCard } from '@shared/components/CromoCard';
import {
  colors,
  fonts,
  spacing,
  radius,
  teamFlagEmoji,
  teamColors,
  defaultTeamColors,
} from '@core/theme';
import { parseTradeList } from '../utils/parseTradeList';
import { formatTradeResult } from '../utils/formatTradeResult';
import type { Figurinha, Selecao } from '@shared/types';
import type { ParseResult } from '../utils/parseTradeList';

interface TradeSection {
  title: string;
  codigoFifa: string;
  bandeira_url: string;
  flag: string;
  tc: { f1: string; f2: string };
  data: Figurinha[];
}

interface ComparisonResult {
  sections: TradeSection[];
  allSections: TradeSection[];
  totalCount: number;
  parsedCount: number;
  catalogMissCount: number;
}

interface TradeState {
  result: ComparisonResult | null;
  parseError: string | null;
  preview: string | null;
}

function runComparison(
  parseResult: ParseResult,
  selecoes: Selecao[],
  figurinhas: Figurinha[],
  collection: Record<string, string>,
): ComparisonResult | null {
  const tradeMap = new Map<string, { selecao: Selecao; figurinhas: Figurinha[] }>();
  const allMap = new Map<string, { selecao: Selecao; figurinhas: Figurinha[] }>();
  let catalogMissCount = 0;

  for (const entry of parseResult.entries) {
    const selecao = selecoes.find(
      s => s.codigo_fifa.toUpperCase() === entry.codigoFifa.toUpperCase(),
    );
    if (!selecao) {
      catalogMissCount++;
      continue;
    }

    // DB stores numero as "{codigoFifa}{number}" (e.g. "BRA1", "BRA10")
    const expectedNumero = `${entry.codigoFifa}${entry.numero}`;
    const figurinha = figurinhas.find(
      f => f.selecao_id === selecao.id && f.numero === expectedNumero,
    );

    if (!figurinha) {
      catalogMissCount++;
      continue;
    }

    if (!allMap.has(selecao.id)) {
      allMap.set(selecao.id, { selecao, figurinhas: [] });
    }
    allMap.get(selecao.id)!.figurinhas.push(figurinha);

    const status = collection[figurinha.id] ?? 'missing';
    if (status !== 'missing') continue;

    if (!tradeMap.has(selecao.id)) {
      tradeMap.set(selecao.id, { selecao, figurinhas: [] });
    }
    tradeMap.get(selecao.id)!.figurinhas.push(figurinha);
  }

  function buildSections(
    map: Map<string, { selecao: Selecao; figurinhas: Figurinha[] }>,
  ): TradeSection[] {
    return Array.from(map.values()).map(({ selecao, figurinhas: figs }) => ({
      title: selecao.nome,
      codigoFifa: selecao.codigo_fifa,
      bandeira_url: selecao.bandeira_url,
      flag: teamFlagEmoji[selecao.codigo_fifa.toUpperCase()] ?? '🏴',
      tc: teamColors[selecao.codigo_fifa] ?? defaultTeamColors,
      data: figs,
    }));
  }

  const sections = buildSections(tradeMap);
  const allSections = buildSections(allMap);
  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);

  return {
    sections,
    allSections,
    totalCount,
    parsedCount: parseResult.entries.length,
    catalogMissCount,
  };
}

export function TradesScreen() {
  const { selecoes, figurinhas, collection, album, getStats } = useStickerStore();
  const [inputText, setInputText] = useState('');

  const stats = useMemo(() => getStats(), [collection]);
  const albumName = album?.nome ?? 'Álbum Copa 2026';

  const tradeState = useMemo<TradeState | null>(() => {
    const text = inputText.trim();
    if (!text) return null;

    const parsed = parseTradeList(text);

    if (parsed.hasNoPrefix) {
      return {
        result: null,
        parseError:
          'Nenhum código de país encontrado. Peça ao seu amigo para enviar a lista com o código da seleção (ex: BRA01, URU: 1, 2).',
        preview: null,
      };
    }

    if (parsed.entries.length === 0) return null;

    const selecaoSet = new Set(parsed.entries.map(e => e.codigoFifa));
    const preview = `${parsed.entries.length} figurinhas encontradas em ${selecaoSet.size} seleção(ões)`;
    const result = runComparison(parsed, selecoes, figurinhas, collection);

    return { result, parseError: null, preview };
  }, [inputText, selecoes, figurinhas, collection]);

  function handleClearText() {
    Alert.alert('Apagar lista?', 'Todo o texto será removido.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => setInputText('') },
    ]);
  }

  async function handleShare() {
    if (!tradeState?.result) return;
    const matches = tradeState.result.sections.map(s => ({
      selecao: selecoes.find(sel => sel.codigo_fifa === s.codigoFifa)!,
      figurinhas: s.data,
    }));
    await Share.share({ message: formatTradeResult(matches, albumName) });
  }

  const sections = tradeState?.result?.sections ?? [];
  const allSections = tradeState?.result?.allSections ?? [];
  const totalCount = tradeState?.result?.totalCount ?? 0;

  const listHeader = (
    <View>
      {stats.missing === 0 && (
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            🏆 Você não tem nenhuma figurinha faltando — álbum completo!
          </Text>
        </View>
      )}
      <View style={s.labelRow}>
        <Text style={s.label}>Lista de repetidas do amigo</Text>
        {inputText.length > 0 && (
          <TouchableOpacity onPress={handleClearText} activeOpacity={0.7}>
            <Text style={s.clearBtnText}>✕ Limpar</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={s.textInput}
        multiline
        numberOfLines={8}
        placeholder="Cole aqui a lista de repetidas do seu amigo (ex: BRA01 BRA02, URU: 1, 2)"
        placeholderTextColor={colors.txFaint}
        value={inputText}
        onChangeText={text => setInputText(text.toUpperCase())}
        textAlignVertical="top"
        accessibilityLabel="Lista de repetidas"
      />
      {tradeState?.preview && <Text style={s.preview}>✓ {tradeState.preview}</Text>}
      {tradeState?.parseError && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{tradeState.parseError}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader
        title="🤝 Trocas"
        subtitle={
          totalCount > 0
            ? `Você precisa de ${totalCount} figurinha${totalCount !== 1 ? 's' : ''}`
            : 'Cole a lista de repetidas do amigo'
        }
      />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          totalCount > 0 ? (
            <View style={s.footer}>
              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                <Text style={s.shareBtnText}>📲 Enviar pelo WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          tradeState !== null && tradeState.result !== null ? (
            <View>
              <EmptyState
                emoji="🤷"
                title="Nenhuma figurinha em comum"
                subtitle="Você já tem todas as figurinhas da lista do seu amigo."
              />
              {allSections.length > 0 && (
                <View style={s.informadasBlock}>
                  <Text style={s.informadasTitle}>
                    Figurinhas informadas ({allSections.reduce((acc, s) => acc + s.data.length, 0)})
                  </Text>
                  {allSections.map(section => (
                    <View key={section.codigoFifa}>
                      <View style={s.sectionHeader}>
                        <FlagImage
                          codigoFifa={section.codigoFifa}
                          bandeiraUrl={section.bandeira_url}
                          size={20}
                        />
                        <Text style={s.sectionName}>{section.title}</Text>
                        <Text style={s.sectionCount}>{section.data.length} fig.</Text>
                      </View>
                      <View style={s.cromoGrid}>
                        {section.data.map(f => (
                          <CromoCard
                            key={f.id}
                            numero={f.numero}
                            descricao={f.descricao}
                            flag={section.flag}
                            f1={section.tc.f1}
                            f2={section.tc.f2}
                            state="owned"
                            width={96}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
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
          return (
            <View style={s.cromoGrid}>
              {section.data.map(f => (
                <CromoCard
                  key={f.id}
                  numero={f.numero}
                  descricao={f.descricao}
                  flag={section.flag}
                  f1={section.tc.f1}
                  f2={section.tc.f2}
                  state="missing"
                  width={96}
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
  list: { padding: spacing.md, flexGrow: 1 },

  infoBox: {
    backgroundColor: colors.glass,
    borderRadius: radius.glass,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: { color: colors.goldSoft, fontFamily: fonts.bodySemiBold, fontSize: 13 },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.txMut,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtnText: { color: colors.error, fontFamily: fonts.body, fontSize: 12 },

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

  preview: { color: colors.green, fontFamily: fonts.body, fontSize: 12, marginBottom: spacing.sm },

  errorBox: {
    backgroundColor: 'rgba(255,93,82,0.12)',
    borderRadius: radius.glass,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: { color: '#FF5D52', fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },

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
    gap: 14,
    marginBottom: spacing.md,
    justifyContent: 'flex-start',
  },

  informadasBlock: { marginTop: spacing.lg },
  informadasTitle: {
    color: colors.txMut,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },

  footer: { marginTop: spacing.md },
  shareBtn: {
    backgroundColor: '#25D366',
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
