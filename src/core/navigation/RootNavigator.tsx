import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '@core/theme';
import { AlbumStack } from './AlbumStack';
import type { BottomTabParamList } from './types';

// Screens
import { HomeScreen } from '@modules/dashboard/screens/HomeScreen';
import { MissingScreen } from '@modules/missing/screens/MissingScreen';
import { DuplicatesScreen } from '@modules/duplicates/screens/DuplicatesScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabIcons: Record<string, string> = {
  Home: '🏠',
  Album: '📖',
  Missing: '❌',
  Duplicates: '🔄',
};

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{tabIcons[route.name]}</Text>
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { height: 83, paddingTop: 10 },
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
      </Tab.Navigator>
    </NavigationContainer>
  );
}
