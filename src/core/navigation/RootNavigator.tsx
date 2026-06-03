import React, { useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography, shadows } from '@core/theme';
import { AlbumStack } from './AlbumStack';
import { useAuthStore } from '@modules/auth/store/authStore';
import { authService } from '@modules/auth/services/authService';
import { supabase } from '@shared/services/supabase';
import { LoginScreen } from '@modules/auth/screens/LoginScreen';
import { UserAlbumsModal } from '@modules/auth/components/UserAlbumsModal';
import { TypeSettingsModal } from '@modules/auth/components/TypeSettingsModal';
import { OnboardingModal } from '@modules/onboarding/components/OnboardingModal';
import { OnboardingContext } from '@core/providers/OnboardingContext';
import type { BottomTabParamList } from './types';

import { HomeScreen } from '@modules/dashboard/screens/HomeScreen';
import { MissingScreen } from '@modules/missing/screens/MissingScreen';
import { DuplicatesScreen } from '@modules/duplicates/screens/DuplicatesScreen';
import { StatsScreen } from '@modules/dashboard/screens/StatsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabIcons: Record<string, string> = {
  Home: '🏠',
  Album: '📖',
  Missing: '❌',
  Duplicates: '🔄',
  Stats: '📊',
};

export function RootNavigator() {
  const { user, setUser, showAlbumsModal, setShowAlbumsModal } = useAuthStore();
  const { showOnboarding, completeOnboarding } = useContext(OnboardingContext);
  const [profileVisible, setProfileVisible] = useState(false);
  const [typeSettingsVisible, setTypeSettingsVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  const displayName = user.name;

  const openProfile = () => {
    setNickname(user.name);
    setEditing(false);
    setProfileVisible(true);
  };

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
    if (Platform.OS === 'web') {
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
          setProfileVisible(false);
          setUser(null);
          await authService.signOut().catch(() => {});
        },
      },
    ]);
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
              {tabIcons[route.name]}
            </Text>
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            height: 83,
            paddingTop: 10,
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Album" component={AlbumStack} options={{ title: 'Álbum' }} />
        <Tab.Screen name="Missing" component={MissingScreen} options={{ title: 'Faltantes' }} />
        <Tab.Screen
          name="Duplicates"
          component={DuplicatesScreen}
          options={{ title: 'Repetidas' }}
        />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      </Tab.Navigator>

      {/* Avatar flutuante */}
      <TouchableOpacity style={styles.avatarBtn} onPress={openProfile} activeOpacity={0.8}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de perfil */}
      <Modal visible={profileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!editing) setProfileVisible(false);
            }}
          />
          <View style={[styles.profileCard, shadows.strong]}>
            {/* Avatar grande */}
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

            {/* Nome / apelido */}
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
                setProfileVisible(false);
                setTypeSettingsVisible(true);
              }}
            >
              <Text style={styles.settingsBtnText}>⚙️ Tipos controlados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setEditing(false);
                setProfileVisible(false);
              }}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>🚪 Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <UserAlbumsModal
        visible={showAlbumsModal}
        onClose={() => setShowAlbumsModal(false)}
        userId={user.id}
      />

      <TypeSettingsModal
        visible={typeSettingsVisible}
        onClose={() => setTypeSettingsVisible(false)}
      />

      <OnboardingModal visible={showOnboarding} onComplete={completeOnboarding} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    position: 'absolute',
    top: 52,
    right: spacing.md,
    zIndex: 100,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.accent,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarInitial: { fontSize: 15, fontWeight: '800', color: colors.primary },

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
    color: colors.textPrimary,
    textAlign: 'center',
  },
  editIcon: { fontSize: 14 },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 1,
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minWidth: 64,
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
  signOutBtn: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  signOutText: { fontSize: 14, fontWeight: '600', color: colors.error },
});
