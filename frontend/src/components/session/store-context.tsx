"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { type Store } from "@/lib/types";

const FALLBACK_STORE: Store = { name: "Toko", type: "" };

type StoreState = {
  store: Store;
  isLoaded: boolean;
  loadError: string;
  reload: () => Promise<void>;
  update: (changes: Pick<Store, "name" | "type">) => Promise<Store>;
};

const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const state = useContext(StoreContext);
  if (!state) throw new Error("useStore must be used inside StoreProvider");
  return state;
}

export function storeInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "T";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(FALLBACK_STORE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    setLoadError("");
    try {
      const data = await api<{ store: Store }>("store");
      setStore(data.store);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const update = useCallback(async (changes: Pick<Store, "name" | "type">) => {
    const data = await api<{ store: Store }>("store", "PATCH", changes);
    setStore(data.store);
    setLoadError("");
    return data.store;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  return (
    <StoreContext.Provider
      value={{ store, isLoaded, loadError, reload, update }}
    >
      {children}
    </StoreContext.Provider>
  );
}
