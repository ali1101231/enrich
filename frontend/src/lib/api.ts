const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("koldify-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Auth ----
export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register(email: string, password: string, displayName?: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<AuthUser>("/auth/me");
  },
};

// ---- Admin ----
export const adminApi = {
  listUsers() {
    return request<{ items: AuthUser[] }>("/admin/users");
  },
  listKeys() {
    return request<{ items: Array<{ id: string; label: string; isActive: boolean; activeUsers: number; maxUsers: number }> }>("/admin/keys");
  },
  createKey(label: string, rawKey: string) {
    return request<{ id: string }>("/admin/keys", {
      method: "POST",
      body: JSON.stringify({ label, rawKey }),
    });
  },
  setKeyActive(keyId: string, isActive: boolean) {
    return request<void>(`/admin/keys/${encodeURIComponent(keyId)}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
};
