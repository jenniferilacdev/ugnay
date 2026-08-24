"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const KEY = "ugnay.actingOrg";

type ScopeContextValue = {
  /** The organization the user is currently focusing on (a city or barangay), or null for their full scope. */
  actingOrgId: string | null;
  setActingOrgId: (id: string | null) => void;
};

const ScopeContext = createContext<ScopeContextValue | null>(null);

export function ScopeProvider({
  userId,
  children,
}: {
  userId?: string;
  children: ReactNode;
}) {
  // Persist per account so a selection made by one account can't leak into
  // another signed into the same browser (which could point outside its scope).
  const storageKey = `${KEY}.${userId ?? "anon"}`;

  // The provider only mounts client-side (behind the auth gate), so reading
  // localStorage in a lazy initializer is safe and avoids a setState-in-effect.
  const [actingOrgId, setState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(storageKey),
  );

  const setActingOrgId = useCallback(
    (id: string | null) => {
      setState(id);
      if (id) window.localStorage.setItem(storageKey, id);
      else window.localStorage.removeItem(storageKey);
    },
    [storageKey],
  );

  return (
    <ScopeContext.Provider value={{ actingOrgId, setActingOrgId }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useActingScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useActingScope must be used within a ScopeProvider");
  return ctx;
}
