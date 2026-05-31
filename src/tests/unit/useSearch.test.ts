import { renderHook, act } from '@testing-library/react-native';
import { useSearch } from '@modules/search/hooks/useSearch';
import { useStickerStore } from '@modules/album/store/stickerStore';

jest.useFakeTimers();

const mockSelecoes = [
  { id: 's1', album_id: 'a1', nome: 'Brasil', codigo_fifa: 'BRA', ordem: 1, bandeira_url: '' },
  { id: 's2', album_id: 'a1', nome: 'Argentina', codigo_fifa: 'ARG', ordem: 2, bandeira_url: '' },
];
const mockFigurinhas = [
  {
    id: 'f1',
    album_id: 'a1',
    selecao_id: 's1',
    numero: '001',
    nome: '',
    type: '',
    descricao: '',
    ordem: 1,
  },
  {
    id: 'f2',
    album_id: 'a1',
    selecao_id: 's1',
    numero: '014',
    nome: '',
    type: '',
    descricao: '',
    ordem: 14,
  },
  {
    id: 'f3',
    album_id: 'a1',
    selecao_id: 's2',
    numero: '021',
    nome: '',
    type: '',
    descricao: '',
    ordem: 1,
  },
];

beforeEach(() => {
  useStickerStore.setState({ selecoes: mockSelecoes, figurinhas: mockFigurinhas });
});

describe('useSearch', () => {
  it('returns empty results when query is empty', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.results).toHaveLength(0);
  });

  it('finds sticker by number', async () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setQuery('014');
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].figurinha.numero).toBe('014');
  });

  it('finds stickers by country name', async () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setQuery('Brasil');
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.results).toHaveLength(2);
  });

  it('finds stickers by FIFA code', async () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setQuery('ARG');
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].selecao.codigo_fifa).toBe('ARG');
  });

  it('debounces search by 300ms', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setQuery('Bra');
    });
    // Before debounce
    expect(result.current.results).toHaveLength(0);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    // After debounce
    expect(result.current.results.length).toBeGreaterThan(0);
  });
});
