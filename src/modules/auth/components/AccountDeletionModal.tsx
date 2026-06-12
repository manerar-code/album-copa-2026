import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, fonts } from '@core/theme';

interface Props {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AccountDeletionModal({ visible, loading, onConfirm, onCancel }: Props) {
  const [inputValue, setInputValue] = useState('');

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  const handleConfirm = () => {
    if (inputValue !== 'EXCLUIR') return;
    setInputValue('');
    onConfirm();
  };

  const isConfirmed = inputValue === 'EXCLUIR';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Excluir conta</Text>
          <TouchableOpacity onPress={handleCancel} disabled={loading}>
            <Text style={styles.closeBtn}>Fechar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.gracePeriodTitle}>Período de carência de 30 dias</Text>

          <Text style={styles.bodyText}>
            Ao solicitar a exclusão, sua conta será desativada imediatamente e todos os seus dados
            serão permanentemente excluídos após 30 dias.
          </Text>

          <Text style={styles.bodyText}>
            Durante esse período, você pode cancelar a exclusão fazendo login no aplicativo e
            tocando em "Cancelar" no banner de exclusão.
          </Text>

          <Text style={styles.bodyText}>
            Após o período de carência, sua conta, coleção de figurinhas, álbuns e todas as
            informações associadas serão irreversivelmente removidas.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.confirmLabel}>
            Digite <Text style={styles.confirmLabelBold}>EXCLUIR</Text> para confirmar:
          </Text>

          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="EXCLUIR"
            placeholderTextColor={colors.txFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            testID="confirm-input"
          />

          <TouchableOpacity
            style={[styles.confirmBtn, !isConfirmed && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!isConfirmed || loading}
            testID="confirm-deletion-btn"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.confirmBtnText}>Confirmar exclusão</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
            testID="cancel-deletion-btn"
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.ink900,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.tx,
  },
  closeBtn: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.gold,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  gracePeriodTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.txMut,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  confirmLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.tx,
    marginBottom: spacing.sm,
  },
  confirmLabelBold: {
    fontFamily: fonts.bodyBold,
    color: colors.red,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: fonts.monoBold,
    color: colors.tx,
    backgroundColor: colors.ink800,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  confirmBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.white,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.txMut,
  },
});
