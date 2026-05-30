import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@app/theme';

export function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
