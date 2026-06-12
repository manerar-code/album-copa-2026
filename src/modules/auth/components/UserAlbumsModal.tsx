import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { crossPlatformAlert } from '@shared/utils/crossPlatformAlert';
import { colors, spacing, radius, typography } from '@core/theme';
import { userAlbumService } from '@shared/services/userAlbumService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { useShallow } from 'zustand/react/shallow';
import { useStickerStore } from '@modules/album/store/stickerStore';
import type { UserAlbum } from '@shared/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function UserAlbumsModal({ visible, onClose, userId }: Props) {
  const {
    userAlbums,
    setUserAlbums,
    activeUserAlbumId,
    setActiveUserAlbum,
    applyCollection,
    allCollections,
    setAllCollections,
  } = useStickerStore(
    useShallow(s => ({
      userAlbums: s.userAlbums,
      setUserAlbums: s.setUserAlbums,
      activeUserAlbumId: s.activeUserAlbumId,
      setActiveUserAlbum: s.setActiveUserAlbum,
      applyCollection: s.applyCollection,
      allCollections: s.allCollections,
      setAllCollections: s.setAllCollections,
    })),
  );
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (album: UserAlbum) => {
    if (album.id === activeUserAlbumId) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      let col = allCollections[album.id];
      if (!col) {
        col = await cloudCollectionService.load(album.id);
        setAllCollections({ ...allCollections, [album.id]: col });
      }
      setActiveUserAlbum(album.id);
      await applyCollection(col);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const created = await userAlbumService.create(userId, name);
      setUserAlbums([...userAlbums, created]);
      setNewName('');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setLoading(true);
    try {
      await userAlbumService.rename(id, name);
      setUserAlbums(userAlbums.map(a => (a.id === id ? { ...a, name } : a)));
      setEditingName('');
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (album: UserAlbum) => {
    if (userAlbums.length === 1) {
      crossPlatformAlert('Atenção', 'Você precisa ter pelo menos uma coleção.');
      return;
    }
    crossPlatformAlert(
      'Excluir coleção',
      `Excluir "${album.name}"? Todos os dados serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await userAlbumService.remove(album.id);
              const remaining = userAlbums.filter(a => a.id !== album.id);
              setUserAlbums(remaining);
              const newAll = { ...allCollections };
              delete newAll[album.id];
              setAllCollections(newAll);
              if (activeUserAlbumId === album.id) {
                const next = remaining[0];
                const col = await cloudCollectionService.load(next.id);
                setActiveUserAlbum(next.id);
                await applyCollection(col);
              }
            } catch (e: unknown) {
              const message =
                e instanceof Error ? e.message : 'Não foi possível excluir a coleção.';
              crossPlatformAlert('Erro', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalRoot}>
        {/* Backdrop — fecha ao tocar fora */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          testID="albums-overlay"
        />
        {/* Sheet — plain View, sem TouchableOpacity para não interceptar toques filhos */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrapper}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>Minhas Coleções</Text>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {userAlbums.map(album => (
                <View key={album.id} style={styles.row}>
                  {editingId === album.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.input}
                        value={editingId === album.id ? editingName : ''}
                        onChangeText={setEditingName}
                        placeholder="Nome da coleção"
                        placeholderTextColor={colors.textMuted}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={() => handleRename(album.id)}
                        testID="rename-input"
                      />
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() => handleRename(album.id)}
                        disabled={loading}
                      >
                        <Text style={styles.actionSave}>Salvar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                        <Text style={styles.actionCancel}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.albumRow}
                      onPress={() => handleSelect(album)}
                      disabled={loading}
                    >
                      <Text style={styles.check}>
                        {activeUserAlbumId === album.id ? '✓' : '  '}
                      </Text>
                      <Text
                        style={[
                          styles.albumName,
                          activeUserAlbumId === album.id && styles.albumNameActive,
                        ]}
                      >
                        {album.name?.trim() || 'Coleção sem nome'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingName(album.name);
                          setEditingId(album.id);
                        }}
                        style={styles.iconBtn}
                      >
                        <Text style={styles.iconText}>✏️</Text>
                      </TouchableOpacity>
                      {userAlbums.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleDelete(album)}
                          style={styles.iconBtn}
                        >
                          <Text style={styles.iconText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.newRow}>
              <TextInput
                style={styles.newInput}
                placeholder="Nome da nova coleção..."
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
              />
              <TouchableOpacity
                style={[styles.createBtn, !newName.trim() && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || loading}
              >
                <Text style={styles.createBtnText}>+ Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kavWrapper: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: { ...typography.h2, color: '#0C1322', marginBottom: spacing.md },
  list: { maxHeight: 200 },
  row: { marginBottom: spacing.sm },
  albumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  check: { fontSize: 16, color: colors.secondary, width: 24, fontWeight: '700' },
  albumName: { flex: 1, fontSize: 16, color: '#0C1322' },
  albumNameActive: { fontWeight: '700', color: colors.primary },
  iconBtn: { padding: 4, marginLeft: spacing.sm },
  iconText: { fontSize: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 16,
    color: colors.primary,
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionSave: { color: colors.white, fontWeight: '700', fontSize: 14 },
  actionCancel: { color: colors.textMuted, fontSize: 16 },
  newRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  newInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.primary,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
