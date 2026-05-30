import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps as StackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Album: undefined;
  Missing: undefined;
  Duplicates: undefined;
};

export type AlbumStackParamList = {
  AlbumList: undefined;
  TeamDetail: { selecaoId: string; selecaoNome: string };
};

export type HomeScreenProps = BottomTabScreenProps<BottomTabParamList, 'Home'>;
export type MissingScreenProps = BottomTabScreenProps<BottomTabParamList, 'Missing'>;
export type DuplicatesScreenProps = BottomTabScreenProps<BottomTabParamList, 'Duplicates'>;

export type AlbumListScreenProps = CompositeScreenProps<
  StackScreenProps<AlbumStackParamList, 'AlbumList'>,
  BottomTabScreenProps<BottomTabParamList>
>;

export type TeamDetailScreenProps = StackScreenProps<AlbumStackParamList, 'TeamDetail'>;
