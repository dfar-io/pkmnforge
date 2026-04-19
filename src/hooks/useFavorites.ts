import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pkmnforge.favorites.v1";

const read = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
};

/**
 * Manages favorite Pokémon (by dex id) in localStorage.
 * Syncs across tabs via the `storage` event so multiple windows stay in sync.
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* storage unavailable */
    }
  }, [favorites]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setFavorites(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  /** Replace all favorites wholesale (used by import/restore). */
  const replaceAll = useCallback((next: number[]) => {
    const clean = Array.from(
      new Set(next.filter((n) => Number.isInteger(n) && n > 0)),
    );
    setFavorites(clean);
  }, []);

  return { favorites, isFavorite, toggleFavorite, replaceAll };
};
