import React, { useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { colors, spacing } from '@core/theme';
import { AlbumStack } from './AlbumStack';
import { useAuthStore } from '@modules/auth/store/authStore';
import { accountDeletionService } from '@modules/auth/services/accountDeletionService';
import { LoginScreen } from '@modules/auth/screens/LoginScreen';
import { UserAlbumsModal } from '@modules/auth/components/UserAlbumsModal';
import { ProfileModal } from '@modules/auth/components/ProfileModal';
import { OnboardingModal } from '@modules/onboarding/components/OnboardingModal';
import { OnboardingContext } from '@core/providers/OnboardingContext';
import type { BottomTabParamList } from './types';
import { HomeScreen } from '@modules/dashboard/screens/HomeScreen';
import { MissingScreen } from '@modules/missing/screens/MissingScreen';
import { DuplicatesScreen } from '@modules/duplicates/screens/DuplicatesScreen';
import { StatsScreen } from '@modules/dashboard/screens/StatsScreen';
import { TradesScreen } from '@modules/trades/screens/TradesScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const tabIcons: Record<string, string> = {
  Home: '🏠',
  Album: '📖',
  Missing: '🔍',
  Duplicates: '🔄',
  Trades: '🤝',
  Stats: '📊',
};

export function RootNavigator() {
  const {
    user,
    showAlbumsModal,
    setShowAlbumsModal,
    hideFloatingAvatar,
    pendingDeletion,
    setPendingDeletion,
  } = useAuthStore();
  const { showOnboarding, completeOnboarding } = useContext(OnboardingContext);
  const [profileVisible, setProfileVisible] = useState(false);
  if (!user) return <LoginScreen />;

  const handleCancelDeletion = async () => {
    try {
      await accountDeletionService.cancelDeletion(user.id);
      setPendingDeletion(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível cancelar a exclusão. Tente novamente.');
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  return (
    <View style={{ flex: 1 }}>
      {pendingDeletion && !pendingDeletion.cancelledAt && (
        <View style={s.graceBanner}>
          <Text style={s.graceBannerText}>
            Conta com exclusão agendada para {formatDate(pendingDeletion.scheduledDeleteAt)}
          </Text>
          <TouchableOpacity onPress={handleCancelDeletion} testID="cancel-deletion-banner">
            <Text style={s.graceBannerCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
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
              height: 60,
              paddingTop: 4,
              paddingBottom: 4,
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
          <Tab.Screen name="Trades" component={TradesScreen} options={{ title: 'Trocas' }} />
          <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
        </Tab.Navigator>

        {!hideFloatingAvatar && (
          <TouchableOpacity
            style={s.avatarBtn}
            onPress={() => setProfileVisible(true)}
            activeOpacity={0.8}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
        <UserAlbumsModal
          visible={showAlbumsModal}
          onClose={() => setShowAlbumsModal(false)}
          userId={user.id}
        />
        <OnboardingModal visible={showOnboarding} onComplete={completeOnboarding} />
      </NavigationContainer>
    </View>
  );
}

const s = StyleSheet.create({
  avatarBtn: { position: 'absolute', top: 52, right: spacing.md, zIndex: 100 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, borderColor: colors.accent },
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
  graceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 200,
  },
  graceBannerText: { fontSize: 12, fontWeight: '600', color: colors.white, flex: 1 },
  graceBannerCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    marginLeft: spacing.sm,
    textDecorationLine: 'underline',
  },
});
