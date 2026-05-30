import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@core/theme';
import { AlbumListScreen } from '@modules/album/screens/AlbumListScreen';
import { TeamDetailScreen } from '@modules/album/screens/TeamDetailScreen';
import type { AlbumStackParamList } from './types';

const Stack = createNativeStackNavigator<AlbumStackParamList>();

export function AlbumStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="AlbumList" component={AlbumListScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({ title: route.params.selecaoNome })}
      />
    </Stack.Navigator>
  );
}
