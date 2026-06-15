import React, { useMemo, useLayoutEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, isTypeTracked } from '@shared/store/userSettingsStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { collectionService } from '@shared/services/collectionService';
import { logger } from '@shared/utils/logger';
import { StickerCard } from '@modules/album/components/StickerCard';
import { ProgressBar } from '@shared/components/ProgressBar';
import { SkeletonBox } from '@shared/components/SkeletonBox';
import { FlagImage } from '@shared/components/FlagImage';
import {
  colors,
  fonts,
  spacing,
  radius,
  gradients,
  teamColors,
  defaultTeamColors,
} from '@core/theme';
import type { TeamDetailScreenProps } from '@core/navigation/types';

const NUM_COLUMNS = 3;
const CARD_W = 96;

export function TeamDetailScreen({ route, navigation }: TeamDetailScreenProps) {
  const { selecaoId } = route.params;
  const { figurinhas, selecoes, collection, activeUserAlbumId, isInitialized } = useStickerStore();
  const { trackedTypes } = useUserSettingsStore();
  const { setHideFloatingAvatar } = useAuthStore();
  const isSyncing = useRef(false);

  // Oculta o avatar flutuante enquanto esta tela estiver em foco
  useFocusEffect(
    useCallback(() => {
      setHideFloatingAvatar(true);
      return () => setHideFloatingAvatar(false);
    }, [setHideFloatingAvatar]),
  );

  const selecao = selecoes.find(s => s.id === selecaoId);
  const codigoFifa = selecao?.codigo_fifa ?? '';

  // Seleção anterior e próxima (baseado na ordem do catálogo)
  const currentIndex = useMemo(
    () => selecoes.findIndex(s => s.id === selecaoId),
    [selecoes, selecaoId],
  );
  const prevSelecao = currentIndex > 0 ? selecoes[currentIndex - 1] : null;
  const nextSelecao =
    currentIndex >= 0 && currentIndex < selecoes.length - 1 ? selecoes[currentIndex + 1] : null;

  // Garante que a coleção está salva localmente antes de navegar.
  // O sync com a nuvem já acontece em tempo real via upsertOne a cada toque —
  // aqui só forçamos um save local extra para não perder nenhuma alteração em voo.
  const syncBeforeNavigate = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      if (activeUserAlbumId) await collectionService.save(collection, activeUserAlbumId);
    } catch (e) {
      logger.warn('TeamDetail: local save before navigate failed', e);
    } finally {
      isSyncing.current = false;
    }
  }, [collection]);

  const goToSelecao = useCallback(
    async (target: typeof nextSelecao) => {
      if (!target) return;
      await syncBeforeNavigate();
      navigation.replace('TeamDetail', { selecaoId: target.id, selecaoNome: target.nome });
    },
    [syncBeforeNavigate, navigation],
  );

  const goBackToList = useCallback(async () => {
    await syncBeforeNavigate();
    navigation.navigate('AlbumList');
  }, [syncBeforeNavigate, navigation]);

  // Injeta botões de navegação no header nativo com estilo uniforme
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      // Centro: bandeira pequena + "Voltar" → volta para lista
      headerTitle: () => (
        <TouchableOpacity
          style={hs.flagBtn}
          onPress={() => void goBackToList()}
          activeOpacity={0.75}
        >
          <FlagImage codigoFifa={codigoFifa} bandeiraUrl={selecao?.bandeira_url} size={18} />
          <Text style={hs.flagBtnLabel}>Voltar</Text>
        </TouchableOpacity>
      ),
      headerTitleAlign: 'center',
      // Esquerda: seleção anterior (ou volta para lista)
      headerLeft: () => (
        <TouchableOpacity
          style={hs.navBtn}
          onPress={() => {
            if (prevSelecao) void goToSelecao(prevSelecao);
            else void goBackToList();
          }}
          activeOpacity={0.7}
        >
          <Text style={hs.navArrow}>‹</Text>
          <Text style={hs.navLabel} numberOfLines={1}>
            {prevSelecao ? prevSelecao.nome : 'Lista'}
          </Text>
        </TouchableOpacity>
      ),
      // Direita: próxima seleção
      headerRight: nextSelecao
        ? () => (
            <TouchableOpacity
              style={hs.navBtnRight}
              onPress={() => void goToSelecao(nextSelecao)}
              activeOpacity={0.7}
            >
              <Text style={hs.navLabel} numberOfLines={1}>
                {nextSelecao.nome}
              </Text>
              <Text style={hs.navArrow}>›</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    navigation,
    codigoFifa,
    selecao?.bandeira_url,
    prevSelecao?.id,
    nextSelecao?.id,
    goToSelecao,
    goBackToList,
  ]);

  const teamStickers = useMemo(
    () =>
      figurinhas
        .filter(f => f.selecao_id === selecaoId)
        .filter(f => isTypeTracked(trackedTypes, f.type))
        .sort((a, b) => a.ordem - b.ordem),
    [figurinhas, selecaoId, trackedTypes],
  );

  if (!isInitialized) return <TeamDetailSkeleton />;

  const owned = teamStickers.filter(f => (collection[f.id] ?? 'missing') !== 'missing').length;
  const pct = teamStickers.length > 0 ? Math.round((owned / teamStickers.length) * 100) : 0;
  const tc = teamColors[codigoFifa] ?? defaultTeamColors;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.header.colors}
        start={gradients.header.start}
        end={gradients.header.end}
        style={s.header}
      >
        <View style={s.headerRow}>
          <FlagImage codigoFifa={codigoFifa} bandeiraUrl={selecao?.bandeira_url} size={36} />
          <View style={s.headerInfo}>
            <Text style={s.teamSub}>
              {codigoFifa} · {owned}/{teamStickers.length} figurinhas
            </Text>
            <ProgressBar
              progress={pct / 100}
              height={5}
              color={pct === 100 ? colors.green : colors.gold}
            />
          </View>
          <Text style={s.teamPct}>{pct}%</Text>
        </View>
        <View style={s.headerBorder} />
      </LinearGradient>

      {/* Sticker grid */}
      <FlatList
        data={teamStickers}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={({ item }) => {
          return (
            <View style={s.stickerWrapper}>
              <StickerCard
                figurinhaId={item.id}
                numero={item.numero}
                descricao={item.descricao}
                codigoFifa={codigoFifa}
                f1={tc.f1}
                f2={tc.f2}
                width={CARD_W}
              />
            </View>
          );
        }}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        style={s.flatList}
      />
    </SafeAreaView>
  );
}

function TeamDetailSkeleton() {
  return (
    <SafeAreaView
      accessible
      accessibilityLabel="Carregando..."
      style={{ flex: 1, backgroundColor: colors.ink900 }}
    >
      <View
        style={{ backgroundColor: colors.ink850, padding: spacing.md, paddingBottom: spacing.lg }}
      >
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={0}
          style={{ marginBottom: spacing.sm }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SkeletonBox width={80} height={16} />
          <SkeletonBox width={60} height={16} />
          <SkeletonBox width={70} height={16} />
        </View>
      </View>
      <View
        style={{
          padding: spacing.sm,
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: colors.appBg,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={{ width: '33.3%', padding: 7 }}>
            <SkeletonBox width="100%" height={CARD_W * 1.31} borderRadius={radius.cromo} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink900 },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, position: 'relative' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerInfo: { flex: 1, gap: 6 },
  teamSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.txFaint },
  teamPct: { fontFamily: fonts.display, fontSize: 22, color: colors.gold, letterSpacing: -1 },
  headerBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.lineSoft,
  },
  flatList: { backgroundColor: colors.appBg, flex: 1 },
  grid: { padding: 14 },
  stickerWrapper: { flex: 1 / NUM_COLUMNS, padding: 7, alignItems: 'center' },
});

// Estilos dos botões de navegação no header nativo (esquerdo e direito, mesmo padrão)
const hs = StyleSheet.create({
  // Bandeira central — toque volta para lista
  flagBtn: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flagBtnLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  // Botão esquerdo (‹ nome)
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 110,
    overflow: 'hidden',
  },
  // Botão direito (nome ›)
  navBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 110,
    overflow: 'hidden',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    flexShrink: 1,
  },
  navArrow: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '600',
    lineHeight: 24,
    flexShrink: 0,
  },
});
