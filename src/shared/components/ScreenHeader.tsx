import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { colors, fonts, spacing, radius, gradients } from '@core/theme';

interface Props {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  rightContent?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onHelp,
  onRefresh,
  refreshing,
  rightContent,
}: Props) {
  const { userAlbums, activeUserAlbumId } = useStickerStore();
  const { setShowAlbumsModal } = useAuthStore();
  const activeAlbumName = userAlbums.find(a => a.id === activeUserAlbumId)?.name ?? '';

  return (
    <LinearGradient
      colors={gradients.header.colors}
      start={gradients.header.start}
      end={gradients.header.end}
      style={s.container}
    >
      {/* Row 1: title + icon actions */}
      <View style={s.row}>
        <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {title}
        </Text>
        <View style={s.actions}>
          {onHelp && (
            <TouchableOpacity
              onPress={onHelp}
              style={s.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[s.iconText, { color: colors.gold, fontWeight: '800' }]}>?</Text>
            </TouchableOpacity>
          )}
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={s.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.iconText}>{refreshing ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          )}
          {rightContent}
        </View>
      </View>

      {/* Row 2: subtitle + album chip */}
      <View style={s.row2}>
        {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        {!!activeAlbumName && (
          <TouchableOpacity
            onPress={() => setShowAlbumsModal(true)}
            style={s.albumChip}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={s.albumChipText} numberOfLines={1}>
              {activeAlbumName} ▾
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom border */}
      <View style={s.border} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.tx,
    flex: 1,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16 },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: 12,
    color: colors.txFaint,
    flex: 1,
  },
  albumChip: {
    backgroundColor: 'rgba(231,180,60,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(231,180,60,0.3)',
    maxWidth: 180,
  },
  albumChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.goldSoft,
  },
  border: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.lineSoft,
  },
});
