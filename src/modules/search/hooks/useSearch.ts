import { useState, useEffect, useMemo, useRef } from 'react';
import { useStickerStore } from '@modules/album/store/stickerStore';
import type { Figurinha, Selecao } from '@shared/types';

export interface SearchResult {
  figurinha: Figurinha;
  selecao: Selecao;
}

const DEBOUNCE_MS = 300;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { figurinhas, selecoes } = useStickerStore();

  // Debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Build index map once (selecaoId → selecao)
  const selecaoMap = useMemo(() => {
    const map = new Map<string, Selecao>();
    for (const s of selecoes) map.set(s.id, s);
    return map;
  }, [selecoes]);

  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    return figurinhas
      .filter(f => {
        const selecao = selecaoMap.get(f.selecao_id);
        if (!selecao) return false;
        return (
          f.numero.toLowerCase().includes(q) ||
          selecao.nome.toLowerCase().includes(q) ||
          selecao.codigo_fifa.toLowerCase().includes(q)
        );
      })
      .map(f => ({ figurinha: f, selecao: selecaoMap.get(f.selecao_id)! }))
      .slice(0, 50); // max 50 results for performance
  }, [debouncedQuery, figurinhas, selecaoMap]);

  return { query, setQuery, results, hasQuery: debouncedQuery.trim().length > 0 };
}
