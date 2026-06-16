import React, { useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { parseTradeList } from '@modules/trades/utils/parseTradeList';
import { resolveEntries } from '@modules/duplicates/utils/resolveEntries';
import { GoldButton } from '@shared/components/GoldButton';
import { colors, fonts, radius, spacing } from '@core/theme';

interface TradeRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TradeRegistrationModal({ visible, onClose }: TradeRegistrationModalProps) {
  const [sentText, setSentText] = useState('');
  const [recebidoText, setRecebidoText] = useState('');
  const [saving, setSaving] = useState(false);

  const { figurinhas, selecoes, registerTrade } = useStickerStore(
    useShallow(s => ({
      figurinhas: s.figurinhas,
      selecoes: s.selecoes,
      registerTrade: s.registerTrade,
    })),
  );

  const handleClose = () => {
    setSentText('');
    setRecebidoText('');
    setSaving(false);
    onClose();
  };

  const sentParse = useMemo(() => parseTradeList(sentText), [sentText]);
  const receivedParse = useMemo(() => parseTradeList(recebidoText), [recebidoText]);

  const sentIds = useMemo(
    () => resolveEntries(sentParse.entries, figurinhas, selecoes),
    [sentParse, figurinhas, selecoes],
  );

  const receivedIds = useMemo(
    () => resolveEntries(receivedParse.entries, figurinhas, selecoes),
    [receivedParse, figurinhas, selecoes],
  );

  const canConfirm = useMemo(
    () => sentParse.entries.length > 0 || receivedParse.entries.length > 0,
    [sentParse, receivedParse],
  );
  const hasSummary = sentText.trim().length > 0 || recebidoText.trim().length > 0;

  const sentLabel =
    sentIds.length === sentParse.entries.length
      ? `${sentIds.length}`
      : `${sentIds.length}/${sentParse.entries.length}`;
  const receivedLabel =
    receivedIds.length === receivedParse.entries.length
      ? `${receivedIds.length}`
      : `${receivedIds.length}/${receivedParse.entries.length}`;

  const handleConfirm = async () => {
    if (!canConfirm || saving) return;
    setSaving(true);
    try {
      await registerTrade(sentIds, receivedIds);
    } finally {
      setSaving(false);
      handleClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <Text style={s.title}>🤝 Registrar troca</Text>

          <Text style={s.label}>Enviei</Text>
          <TextInput
            style={s.input}
            multiline
            numberOfLines={4}
            placeholder="Ex: BRA01 BRA02, URU: 1, 2"
            placeholderTextColor={colors.txFaint}
            value={sentText}
            onChangeText={t => setSentText(t.toUpperCase())}
            textAlignVertical="top"
          />

          <Text style={s.label}>Recebi</Text>
          <TextInput
            style={s.input}
            multiline
            numberOfLines={4}
            placeholder="Ex: ARG03 FRA: 7, 8"
            placeholderTextColor={colors.txFaint}
            value={recebidoText}
            onChangeText={t => setRecebidoText(t.toUpperCase())}
            textAlignVertical="top"
          />

          {hasSummary && (
            <Text style={s.summary}>
              {sentLabel} enviadas · {receivedLabel} recebidas
            </Text>
          )}

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose} disabled={saving}>
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <GoldButton
              label="Confirmar"
              onPress={handleConfirm}
              loading={saving}
              disabled={!canConfirm}
              style={s.confirmBtn}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.ink800,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.tx,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.txMut,
    marginBottom: spacing.xs,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.ink750,
    color: colors.tx,
    fontFamily: fonts.mono,
    fontSize: Platform.OS === 'web' ? 16 : 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.goldSoft,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: radius.btn,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 52,
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.tx,
  },
  confirmBtn: {
    flex: 1,
  },
});
