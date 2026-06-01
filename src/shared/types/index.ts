export type StickerStatus = 'missing' | 'owned' | 'duplicate';

export interface Album {
  id: string;
  nome: string;
  versao: number;
}

export interface Selecao {
  id: string;
  album_id: string;
  nome: string;
  codigo_fifa: string;
  ordem: number;
  bandeira_url: string;
}

export interface Figurinha {
  id: string;
  album_id: string;
  selecao_id: string;
  numero: string;
  nome: string;
  type: string;
  descricao: string;
  ordem: number;
}

export interface StickerState {
  figurinha_id: string;
  status: StickerStatus;
}

export type UserCollection = Record<string, StickerStatus>;

export interface UserAlbum {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}
