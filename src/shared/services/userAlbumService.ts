import { supabase } from './supabase';
import { handleError } from './errorHandler';
import type { UserAlbum } from '@shared/types';

export const userAlbumService = {
  async list(userId: string): Promise<UserAlbum[]> {
    try {
      const { data, error } = await supabase
        .from('user_albums')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    } catch (error) {
      throw handleError(error, 'userAlbumService.list');
    }
  },

  async create(userId: string, name: string): Promise<UserAlbum> {
    try {
      const { data, error } = await supabase
        .from('user_albums')
        .insert({ user_id: userId, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, 'userAlbumService.create');
    }
  },

  async rename(id: string, name: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_albums')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      throw handleError(error, 'userAlbumService.rename');
    }
  },

  async remove(id: string): Promise<void> {
    try {
      // Apaga as figurinhas da coleção antes
      await supabase.from('user_collections').delete().eq('user_album_id', id);
      const { error } = await supabase.from('user_albums').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      throw handleError(error, 'userAlbumService.remove');
    }
  },
};
