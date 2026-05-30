import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@app/theme';
import { AlbumListScreen } from '@modules/album/screens/AlbumListScreen';
import { TeamDetailScreen } from '@modules/album/screens/TeamDetailScreen';
import type { AlbumStackParamList } from './types';

const Stack = createStackNavigator<AlbumStackParamList>();

export function AlbumStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="AlbumList"
        component={AlbumListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({ title: route.params.selecaoNome })}
      />
    </Stack.Navigator>
  );
}
