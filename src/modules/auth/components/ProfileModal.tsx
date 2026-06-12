import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, radius, typography, shadows } from '@core/theme';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authService } from '@modules/auth/services/authService';
import { supabase } from '@shared/services/supabase';
import { accountDeletionService } from '@modules/auth/services/accountDeletionService';
import { TypeSettingsModal } from './TypeSettingsModal';
import { AccountDeletionModal } from './AccountDeletionModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, setUser, setPendingDeletion } = useAuthStore();
  const [typeSettingsVisible, setTypeSettingsVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (visible) {
      setNickname(user?.name || '');
      setEditing(false);
      setTypeSettingsVisible(false);
      setDeletionModalVisible(false);
      setPrivacyVisible(false);
    }
  }, [visible, user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user) return null;

  const displayName = user.name;

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nickname.trim() },
      });
      if (error) throw error;
      setUser({ ...user, name: nickname.trim() });
      setEditing(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o apelido. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const confirmed = window.confirm('Sair da conta? Coleção salva na nuvem.');
      if (!confirmed) return;
      await authService.signOut().catch(() => {});
      // eslint-disable-next-line no-undef
      window.location.href = window.location.origin;
      return;
    }
    Alert.alert('Sair da conta', 'Sua coleção fica salva na nuvem. Deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          onClose();
          setUser(null);
          await authService.signOut().catch(() => {});
        },
      },
    ]);
  };

  const handleRequestDeletion = async () => {
    setDeletionLoading(true);
    try {
      const result = await accountDeletionService.requestDeletion(user.id, user.email, user.name);
      setPendingDeletion(result);
      setDeletionModalVisible(false);
      Alert.alert('Solicitação enviada', 'Sua conta será excluída em 30 dias.');
    } catch {
      Alert.alert('Erro', 'Não foi possível solicitar a exclusão. Tente novamente.');
    } finally {
      setDeletionLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!editing) onClose();
            }}
          />
          <View style={[styles.profileCard, shadows.strong]}>
            <View style={styles.profileAvatarWrap}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, styles.avatarFallbackLg]}>
                  <Text style={styles.avatarInitialLg}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>

            {editing ? (
              <View style={styles.editRow} testID="edit-row">
                <TextInput
                  style={styles.nicknameInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Seu apelido"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveNickname}
                  testID="nickname-input"
                />
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveNickname}
                  disabled={saving}
                  testID="save-button"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.profileEmail}>{user.email}</Text>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => {
                onClose();
                setTypeSettingsVisible(true);
              }}
            >
              <Text style={styles.settingsBtnText}>⚙️ Tipos controlados</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.privacyBtn} onPress={() => setPrivacyVisible(true)}>
              <Text style={styles.privacyBtnText}>📋 Política de Privacidade</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setEditing(false);
                onClose();
              }}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>🚪 Sair da conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deletionBtn}
              onPress={() => setDeletionModalVisible(true)}
            >
              <Text style={styles.deletionBtnText} testID="request-deletion-btn">
                Solicitar exclusão de conta
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TypeSettingsModal
        visible={typeSettingsVisible}
        onClose={() => setTypeSettingsVisible(false)}
      />

      <AccountDeletionModal
        visible={deletionModalVisible}
        loading={deletionLoading}
        onConfirm={handleRequestDeletion}
        onCancel={() => setDeletionModalVisible(false)}
      />

      <PrivacyPolicyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,35,66,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 92,
    paddingRight: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: 260,
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileAvatarWrap: { position: 'relative' },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  avatarFallbackLg: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialLg: { fontSize: 28, fontWeight: '800', color: colors.white },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profileName: {
    ...typography.h3,
    color: '#0C1322',
    textAlign: 'center',
  },
  editIcon: { fontSize: 14 },
  editRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 4,
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.primary,
    minWidth: 0,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    flexShrink: 0,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  profileEmail: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 4 },
  closeBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  settingsBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  settingsBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  privacyBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  privacyBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  signOutBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  signOutText: { fontSize: 14, fontWeight: '600', color: colors.error },
  deletionBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deletionBtnText: { fontSize: 13, fontWeight: '600', color: colors.error },
});
