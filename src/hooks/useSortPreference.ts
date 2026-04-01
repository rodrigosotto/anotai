import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

import type { SortOrder } from "../types/note";

const SORT_KEY = "notes_sort_order";
const DEFAULT_SORT: SortOrder = "newest";

function isValidSort(value: string | null): value is SortOrder {
  return value === "newest" || value === "oldest" || value === "alpha";
}

/**
 * Persiste a preferência de ordenação usando SecureStore.
 * Mais seguro que AsyncStorage pois usa o keychain do sistema operacional.
 */
export function useSortPreference() {
  const [sort, setSortState] = useState<SortOrder>(DEFAULT_SORT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SORT_KEY)
      .then((value) => {
        if (isValidSort(value)) {
          setSortState(value);
        }
      })
      .catch(() => {
        // Mantém o valor padrão em caso de falha
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setSort = useCallback(async (newSort: SortOrder) => {
    setSortState(newSort);
    try {
      await SecureStore.setItemAsync(SORT_KEY, newSort);
    } catch {
      // Persitência falhou silenciosamente; estado em memória ainda atualizado
    }
  }, []);

  return { sort, setSort, isLoaded };
}
