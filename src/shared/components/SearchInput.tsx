import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@core/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChangeText, placeholder = 'Buscar...' }: SearchInputProps) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>🔍</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.txFaint}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.row,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: { fontSize: 15 },
  input: {
    flex: 1,
    color: colors.tx,
    fontSize: 16,
  },
});
