"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, login, logout } from "@/lib/api";

const ME_KEY = ["auth", "me"] as const;

/** Current signed-in user (null when not authenticated). */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: ({ signal }) => getMe(signal),
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      login(vars.email, vars.password),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
      // Re-fetch data that depends on the authenticated session.
      qc.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ queryKey: ["organizations"] });
    },
  });
}
