export interface AuthUser {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
}

export const auth = {
  async login(username: string, password: string): Promise<void> {
    const body = new URLSearchParams({ username, password });
    const res = await fetch("/api/auth/cookie/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    await assertOk(res);
  },

  async logout(): Promise<void> {
    const res = await fetch("/api/auth/cookie/logout", {
      method: "POST",
      credentials: "include",
    });
    await assertOk(res);
  },

  async me(): Promise<AuthUser> {
    const res = await fetch("/api/users/me", {
      method: "GET",
      credentials: "include",
    });
    await assertOk(res);
    return res.json() as Promise<AuthUser>;
  },

  async devLogin(): Promise<void> {
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      credentials: "include",
    });
    await assertOk(res);
  },
};
