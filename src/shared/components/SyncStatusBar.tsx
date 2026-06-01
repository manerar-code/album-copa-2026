import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSyncStore } from '@shared/store/syncStore';

export function SyncStatusBar(): React.ReactElement | null {
  const status = useSyncStore(s => s.status);
  const pendingCount = useSyncStore(s => s.pendingCount);

  if (status === 'synced') {
    return null;
  }

  const isOffline = status === 'offline';

  const backgroundColor = isOffline ? '#E53935' : '#FDD835';
  const textColor = isOffline ? '#FFFFFF' : '#333333';
  const label = isOffline ? 'Sem conexão' : `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`;

  return (
    <View style={[styles.container, { backgroundColor }]} accessibilityRole="alert" accessibilityLabel={label}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
