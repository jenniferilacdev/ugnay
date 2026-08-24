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

/** Appends an `organizationId` query param when an acting scope is set. */
function withOrg(path: string, organizationId?: string | null): string {
  return organizationId ? `${path}?organizationId=${organizationId}` : path;
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

async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: { csrf?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options?.csrf) headers["X-XSRF-TOKEN"] = await getCsrfToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request to ${path} failed`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(message, res.status);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
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

export interface OrganizationSettings {
  portalName: string;
  province: string | null;
  region: string | null;
  timezone: string;
}

export interface Purok {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface OrganizationNode {
  id: string;
  type: "Province" | "City" | "Municipality" | "Barangay";
  code: string;
  slug: string;
  name: string;
  status: string;
  settings: OrganizationSettings | null;
  children: OrganizationNode[];
  puroks: Purok[];
}

export const getApiInfo = (signal?: AbortSignal) =>
  apiGet<ApiInfo>("/api/info", signal);

export const getTenants = (signal?: AbortSignal) =>
  apiGet<Tenant[]>("/api/tenants", signal);

export const getOrganizationTree = (signal?: AbortSignal) =>
  apiGet<OrganizationNode[]>("/api/organizations/tree", signal);

export interface OrganizationSummary {
  id: string;
  parentOrganizationId: string | null;
  type: string;
  code: string;
  slug: string;
  name: string;
  status: string;
}

export const getOrganizations = (type?: string, signal?: AbortSignal) =>
  apiGet<OrganizationSummary[]>(
    `/api/organizations${type ? `?type=${encodeURIComponent(type)}` : ""}`,
    signal,
  );

// --- Officials --------------------------------------------------------------

export interface OfficialTerm {
  id: string;
  organizationId: string;
  organizationName: string;
  position: string;
  committee: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
}

export interface Official {
  id: string;
  fullName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  terms: OfficialTerm[];
}

export interface CreateOfficialInput {
  fullName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  organizationId: string;
  position: string;
  committee?: string | null;
  startDate?: string | null;
}

export const getOfficials = (organizationId?: string | null, signal?: AbortSignal) =>
  apiGet<Official[]>(withOrg("/api/officials", organizationId), signal);

export const createOfficial = (input: CreateOfficialInput) =>
  apiPost<{ id: string }>("/api/officials", input, { csrf: true });

export interface UpdateOfficialInput {
  fullName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  position: string;
  committee?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export const updateOfficial = (id: string, input: UpdateOfficialInput) =>
  apiPost<{ id: string }>(`/api/officials/${id}/update`, input, { csrf: true });

export const deleteOfficial = (id: string) =>
  apiPost<void>(`/api/officials/${id}/delete`, undefined, { csrf: true });

// --- Residents --------------------------------------------------------------

export interface ResidentSummary {
  id: string;
  referenceNumber: string;
  fullName: string;
  sex: string;
  currentBarangay: string | null;
  verificationStatus: string;
  status: string;
}

export interface Residency {
  id: string;
  organizationId: string;
  organizationName: string;
  purok: string | null;
  address: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
}

export interface ResidentSensitive {
  birthDate: string | null;
  birthPlace: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface ResidentClassifications {
  voterId: string | null;
  isSoloParent: boolean;
  soloParentId: string | null;
  isSeniorCitizen: boolean;
  seniorCitizenId: string | null;
  hasDisability: boolean;
  disabilityId: string | null;
  disabilityType: string | null;
  employmentStatus: string;
  employedType: string | null;
  unemployedType: string | null;
}

export interface ResidentProgram {
  id: string;
  code: string;
  name: string;
}

export interface ResidentDetail {
  id: string;
  referenceNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  fullName: string;
  sex: string;
  civilStatus: string;
  occupation: string | null;
  education: string | null;
  verificationStatus: string;
  verificationMethod: string | null;
  verificationRemarks: string | null;
  verifiedAtUtc: string | null;
  status: string;
  sensitive: ResidentSensitive | null;
  classifications: ResidentClassifications;
  assistancePrograms: ResidentProgram[];
  residencies: Residency[];
}

export interface CreateResidentInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  sex?: string | null;
  birthDate?: string | null;
  civilStatus?: string | null;
  organizationId: string;
  purokId?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  voterId?: string | null;
  householdId?: string | null;
  relationship?: string | null;
  createHousehold?: boolean;
  houseNumber?: string | null;
  street?: string | null;
  zone?: string | null;
  isSoloParent?: boolean;
  soloParentId?: string | null;
  isSeniorCitizen?: boolean;
  seniorCitizenId?: string | null;
  hasDisability?: boolean;
  disabilityId?: string | null;
  disabilityType?: string | null;
  employmentStatus?: string | null;
  employedType?: string | null;
  unemployedType?: string | null;
  assistanceProgramIds?: string[];
}

// --- Assistance programs (spec §43) -----------------------------------------

export interface AssistanceProgram {
  id: string;
  code: string;
  name: string;
}

export const getAssistancePrograms = (signal?: AbortSignal) =>
  apiGet<AssistanceProgram[]>("/api/assistance-programs", signal);

export const createAssistanceProgram = (input: { code: string; name: string }) =>
  apiPost<AssistanceProgram>("/api/assistance-programs", input, { csrf: true });

export const removeAssistanceProgram = (id: string) =>
  apiPost<void>(`/api/assistance-programs/${id}/remove`, undefined, { csrf: true });

export const getResidents = (organizationId?: string | null, signal?: AbortSignal) =>
  apiGet<ResidentSummary[]>(withOrg("/api/residents", organizationId), signal);

export const getResident = (id: string, signal?: AbortSignal) =>
  apiGet<ResidentDetail>(`/api/residents/${id}`, signal);

export const createResident = (input: CreateResidentInput) =>
  apiPost<{ id: string; referenceNumber: string }>("/api/residents", input, { csrf: true });

export const verifyResident = (
  id: string,
  input: { status: string; method?: string | null; remarks?: string | null },
) => apiPost<{ id: string }>(`/api/residents/${id}/verify`, input, { csrf: true });

export const transferResident = (
  id: string,
  input: { toOrganizationId: string; address?: string | null },
) => apiPost<{ id: string }>(`/api/residents/${id}/transfer`, input, { csrf: true });

export interface UpdateResidentInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  sex?: string | null;
  birthDate?: string | null;
  civilStatus?: string | null;
  contactPhone?: string | null;
  voterId?: string | null;
}

export const updateResident = (id: string, input: UpdateResidentInput) =>
  apiPost<{ id: string }>(`/api/residents/${id}/update`, input, { csrf: true });

export const deleteResident = (id: string) =>
  apiPost<void>(`/api/residents/${id}/delete`, undefined, { csrf: true });

// --- Households -------------------------------------------------------------

export interface HouseholdSummary {
  id: string;
  referenceNumber: string;
  barangay: string;
  organizationId: string;
  purok: string | null;
  houseNumber: string | null;
  street: string | null;
  zone: string | null;
  headName: string | null;
  memberCount: number;
  status: string;
}

export interface HouseholdMember {
  id: string;
  residentId: string;
  residentName: string;
  referenceNumber: string;
  relationship: string;
  isHead: boolean;
  status: string;
}

export interface HouseholdDetail {
  id: string;
  referenceNumber: string;
  barangay: string;
  organizationId: string;
  purok: string | null;
  address: string | null;
  houseNumber: string | null;
  street: string | null;
  zone: string | null;
  housingType: string | null;
  contactPhone: string | null;
  status: string;
  members: HouseholdMember[];
}

export interface CreateHouseholdInput {
  organizationId: string;
  purokId?: string | null;
  address?: string | null;
  houseNumber?: string | null;
  street?: string | null;
  zone?: string | null;
  housingType?: string | null;
  contactPhone?: string | null;
  headResidentId?: string | null;
}

export const getHouseholds = (organizationId?: string | null, signal?: AbortSignal) =>
  apiGet<HouseholdSummary[]>(withOrg("/api/households", organizationId), signal);

export const getHousehold = (id: string, signal?: AbortSignal) =>
  apiGet<HouseholdDetail>(`/api/households/${id}`, signal);

export const createHousehold = (input: CreateHouseholdInput) =>
  apiPost<{ id: string; referenceNumber: string }>("/api/households", input, { csrf: true });

export interface UpdateHouseholdInput {
  houseNumber?: string | null;
  street?: string | null;
  zone?: string | null;
  housingType?: string | null;
  contactPhone?: string | null;
}

export const updateHousehold = (id: string, input: UpdateHouseholdInput) =>
  apiPost<{ id: string }>(`/api/households/${id}/update`, input, { csrf: true });

export const deleteHousehold = (id: string) =>
  apiPost<void>(`/api/households/${id}/delete`, undefined, { csrf: true });

export const addHouseholdMember = (
  householdId: string,
  input: { residentId: string; relationship: string },
) => apiPost<void>(`/api/households/${householdId}/members`, input, { csrf: true });

export const removeHouseholdMember = (householdId: string, memberId: string) =>
  apiPost<void>(`/api/households/${householdId}/members/${memberId}/remove`, undefined, { csrf: true });

export const changeHouseholdHead = (householdId: string, memberId: string) =>
  apiPost<void>(`/api/households/${householdId}/head`, { memberId }, { csrf: true });

// --- Requests / workflow (spec §31, §37) ------------------------------------

export interface RequestSummary {
  id: string;
  referenceNumber: string;
  category: string;
  title: string;
  status: string;
  priority: string;
  resident: string | null;
  createdAtUtc: string;
}

export interface RequestEvent {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorName: string | null;
  remarks: string | null;
  createdAtUtc: string;
}

export interface RequestDetail {
  id: string;
  referenceNumber: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  organization: string;
  resident: string | null;
  assignedToUserId: string | null;
  createdAtUtc: string;
  completedAtUtc: string | null;
  availableActions: string[];
  timeline: RequestEvent[];
}

export interface CreateRequestInput {
  organizationId: string;
  category: string;
  title: string;
  description?: string | null;
  requestedByResidentId?: string | null;
  priority?: string | null;
}

export const getRequests = (status?: string, signal?: AbortSignal) =>
  apiGet<RequestSummary[]>(
    `/api/requests${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    signal,
  );

export const getRequest = (id: string, signal?: AbortSignal) =>
  apiGet<RequestDetail>(`/api/requests/${id}`, signal);

export const createRequest = (input: CreateRequestInput) =>
  apiPost<{ id: string; referenceNumber: string }>("/api/requests", input, { csrf: true });

export const transitionRequest = (
  id: string,
  input: { action: string; remarks?: string | null },
) => apiPost<{ status: string }>(`/api/requests/${id}/transition`, input, { csrf: true });

// --- Users (directory for assignee pickers) ---------------------------------

export interface UserSummary {
  id: string;
  email: string | null;
  fullName: string | null;
  status?: string;
  barangays?: string[];
  roles?: string[];
}

export interface RoleOption {
  key: string;
  name: string;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  organizationId: string;
  roleKey: string;
}

export const getUsers = (organizationId?: string | null, signal?: AbortSignal) =>
  apiGet<UserSummary[]>(withOrg("/api/users", organizationId), signal);

export const getUserRoles = (signal?: AbortSignal) =>
  apiGet<RoleOption[]>("/api/users/roles", signal);

export const createUser = (input: CreateUserInput) =>
  apiPost<{ id: string }>("/api/users", input, { csrf: true });

// --- Tasks (spec §57) -------------------------------------------------------

export interface TaskItem {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
  createdAtUtc: string;
}

export interface CreateTaskInput {
  organizationId: string;
  title: string;
  notes?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  assignedToUserId?: string | null;
  relatedRecordType?: string | null;
  relatedRecordId?: string | null;
}

export const getTasks = (opts?: { status?: string; mine?: boolean }, signal?: AbortSignal) => {
  const p = new URLSearchParams();
  if (opts?.status) p.set("status", opts.status);
  if (opts?.mine) p.set("mine", "true");
  const q = p.toString();
  return apiGet<TaskItem[]>(`/api/tasks${q ? `?${q}` : ""}`, signal);
};

export const createTask = (input: CreateTaskInput) =>
  apiPost<{ id: string }>("/api/tasks", input, { csrf: true });

export const updateTask = (
  id: string,
  input: {
    status?: string;
    priority?: string;
    dueDate?: string | null;
    assignedToUserId?: string | null;
    notes?: string | null;
  },
) => apiPost<{ status: string }>(`/api/tasks/${id}/update`, input, { csrf: true });

// --- Auth -------------------------------------------------------------------

export interface CurrentUser {
  userId: string;
  email: string | null;
  fullName: string | null;
  tenantId: string | null;
  permissions: string[];
  scopeOrganizationIds: string[];
}

async function getCsrfToken(): Promise<string> {
  const { token } = await apiGet<{ token: string }>("/api/auth/csrf");
  return token;
}

export const login = (email: string, password: string) =>
  apiPost<CurrentUser>("/api/auth/login", { email, password });

export const logout = () => apiPost<void>("/api/auth/logout", undefined, { csrf: true });

/** Returns the signed-in user, or null when not authenticated (401). */
export async function getMe(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    return await apiGet<CurrentUser>("/api/auth/me", signal);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

// --- Audit ------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  timestampUtc: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  ipAddress: string | null;
}

export const getAuditLogs = (signal?: AbortSignal) =>
  apiGet<AuditLogEntry[]>("/api/audit?take=100", signal);
