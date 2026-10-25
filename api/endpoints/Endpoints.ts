import { API_BASE_URL } from "@/api/baseUrl/BaseUrl"

export type UserRole = "creator" | "recruiter";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error(
      `Cannot connect to the server. Check that your backend is running at ${API_BASE_URL}.`,
    );
  }

  const data = (await response.json().catch(() => ({}))) as
    | (T & ApiErrorBody)
    | ApiErrorBody;

  if (!response.ok) {
    throw new Error(
      ("error" in data && data.error) ||
        ("message" in data && data.message) ||
        `Request failed (${response.status})`,
    );
  }

  return data as T;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthUser>("/api/auth/register", payload),
  login: (payload: LoginPayload) =>
    request<AuthUser>("/api/auth/login", payload),
  logout: () => request<{ ok: boolean }>("/api/auth/logout"),
};
