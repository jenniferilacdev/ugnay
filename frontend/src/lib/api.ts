// Thin, typed client for the UGNAY ASP.NET Core API.
// The API is the authoritative business layer; the frontend only calls it.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5295";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed`, res.status);
  }

  return (await res.json()) as T;
}

// --- Response shapes (Phase 0) ---------------------------------------------

export interface ApiInfo {
  name: string;
  description: string;
  environment: string;
  version: string;
  utc: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export const getApiInfo = (signal?: AbortSignal) =>
  apiGet<ApiInfo>("/api/info", signal);

export const getTenants = (signal?: AbortSignal) =>
  apiGet<Tenant[]>("/api/tenants", signal);
