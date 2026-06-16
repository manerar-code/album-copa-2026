import React, { useMemo, useState } from 'react';
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
import { useUserSettingsStore, isTypeTracked } from '@shared/store/userSettingsStore';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { EmptyState } from '@shared/components/EmptyState';
import { GlassCard } from '@shared/components/GlassCard';
import { TradeRegistrationModal } from '../components/TradeRegistrationModal';
import { CromoCard } from '@shared/components/CromoCard';
import { FlagImage } from '@shared/components/FlagImage';
import {
  colors,
  fonts,
  spacing,
  radius,
  teamColors,
  defaultTeamColors,
  teamFlagEmoji,
} from '@core/theme';

export function DuplicatesScreen() {
  const { figurinhas, selecoes, collection, quantities, getDupCount, resetSticker, toggleSticker } =
    useStickerStore();
  const { trackedTypes } = useUserSettingsStore();
  const [tradeModalVisible, setTradeModalVisible] = useState(false);

  const sections = useMemo(() => {
    return selecoes
      .map(selecao => {
        const codigoFifa = selecao.codigo_fifa;
        const duplicates = figurinhas.filter(f => {
          const isDuplicate = (collection[f.id] ?? 'missing') === 'duplicate';
          const matchesSelecao = f.selecao_id === selecao.id;
          const matchesType = isTypeTracked(trackedTypes, f.type);
          return isDuplicate && matchesSelecao && matchesType;
        });
        const count = duplicates.reduce((acc, f) => acc + getDupCount(f.id), 0);
        return {
          title: selecao.nome,
          codigoFifa,
          bandeiraUrl: selecao.bandeira_url,
          flag: teamFlagEmoji[codigoFifa.toUpperCase()] ?? '🏴',
          tc: teamColors[codigoFifa] ?? defaultTeamColors,
          count,
          data: duplicates,
        };
      })
      .filter(s => s.data.length > 0);
  }, [figurinhas, selecoes, collection, quantities, trackedTypes]);

  const total = sections.reduce((acc, s) => acc + s.count, 0);

  const handleShare = async () => {
    const teamLines = sections.map(s => {
      const stickers = s.data
        .map(f => {
          const qty = getDupCount(f.id);
          const suffix = qty > 1 ? ` ×${qty}` : '';
          return `  ${f.numero}${suffix} · ${f.nome}`;
        })
        .join('\n');
      return `${s.flag} ${s.title}\n${stickers}`;
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
    <SafeAreaView style={s.safeArea}>
      <ScreenHeader
        title="🔄 Repetidas"
        subtitle={`${total} figurinhas · ${sections.length} seleções`}
      />

      <View style={s.actionRow}>
        {total > 0 && (
          <TouchableOpacity
            style={[s.shareBtn, s.actionFlex]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={s.shareBtnText} numberOfLines={1}>
              📲 WhatsApp
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.tradeBtn, s.actionFlex]}
          onPress={() => setTradeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={s.tradeBtnText} numberOfLines={1}>
            🤝 Registrar troca
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        style={s.flatList}
        ListHeaderComponent={
          total > 0 ? (
            <GlassCard gold style={s.tradeBanner}>
              <Text style={{ fontSize: 16 }}>🤝</Text>
              <Text style={s.tradeBannerText}>
                Você tem {total} figurinhas para trocar com amigos.
              </Text>
            </GlassCard>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="✅"
            title="Nenhuma repetida"
            subtitle="Você não tem figurinhas duplicadas."
          />
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
              {section.count} repetidas · {section.codigoFifa}
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
                  f1={section.tc.f1}
                  f2={section.tc.f2}
                  state="duplicate"
                  dupCount={getDupCount(f.id)}
                  onPress={() => toggleSticker(f.id)}
                  onPressDupBadge={() => resetSticker(f.id)}
                  width={96}
                />
              ))}
            </View>
          );
        }}
      />
      <TradeRegistrationModal
        visible={tradeModalVisible}
        onClose={() => setTradeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink900 },
  flatList: { backgroundColor: colors.appBg },
  list: { padding: spacing.md, flexGrow: 1 },

  tradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: '3%',
    marginBottom: 16,
  },
  tradeBannerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.goldSoft,
    flex: 1,
  },

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

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionFlex: { flex: 1 },
  shareBtn: {
    backgroundColor: '#25D366',
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tradeBtn: {
    backgroundColor: colors.ink750,
    borderRadius: radius.glass,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  tradeBtnText: { color: colors.goldSoft, fontSize: 14, fontWeight: '700' },
});
