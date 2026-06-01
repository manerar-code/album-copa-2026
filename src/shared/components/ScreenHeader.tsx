import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { colors, spacing, radius, typography } from '@core/theme';

interface Props {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  rightContent?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onHelp, onRefresh, refreshing, rightContent }: Props) {
  const { userAlbums, activeUserAlbumId } = useStickerStore();
  const { setShowAlbumsModal } = useAuthStore();
  const activeAlbumName = userAlbums.find(a => a.id === activeUserAlbumId)?.name ?? '';

  return (
    <View style={styles.container}>
      {/* Linha 1: título + ações */}
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {title}
        </Text>
        <View style={styles.actions}>
          {onHelp && (
            <TouchableOpacity onPress={onHelp} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.iconText}>❓</Text>
            </TouchableOpacity>
          )}
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.iconText}>{refreshing ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          )}
          {rightContent}
        </View>
      </View>

      {/* Linha 2: subtitle + album chip */}
      <View style={styles.row2}>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {!!activeAlbumName && (
          <TouchableOpacity onPress={() => setShowAlbumsModal(true)} style={styles.albumChip} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <Text style={styles.albumChipText} numberOfLines={1}>{activeAlbumName} ▾</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingRight: 56, // espaço para avatar flutuante
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 18 },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  albumChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: 180,
  },
  albumChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
