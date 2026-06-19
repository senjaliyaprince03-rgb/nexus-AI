import { api, setToken, clearToken, getToken } from "./api";
import { getSafeSessionStorage } from "@/lib/storage";
import type { AuthSessionResponse, CurrentUserResponse, User } from "@/types/api";

export type VerificationEmailResponse = {
  message: string;
  verify_url?: string;
};

function persistSession(session: AuthSessionResponse): void {
  if (typeof window === "undefined") return;
  setToken(session.access_token);
  getSafeSessionStorage().setItem("nexusai_refresh", session.refresh_token);
}

export async function login(email: string, password: string): Promise<AuthSessionResponse> {
  const data = await api.post<AuthSessionResponse>("/api/auth/login", { email, password });
  persistSession(data);
  return data;
}

export async function register(
  email: string,
  password: string,
  workspace_name?: string,
): Promise<AuthSessionResponse> {
  const data = await api.post<AuthSessionResponse>("/api/auth/register", {
    email,
    password,
    workspace_name,
  });
  persistSession(data);
  return data;
}

export async function firebaseGoogleLogin(idToken: string): Promise<AuthSessionResponse> {
  const data = await api.post<AuthSessionResponse>("/api/auth/firebase-google", {
    id_token: idToken,
  });
  persistSession(data);
  return data;
}

export async function firebaseGithubLogin(idToken: string): Promise<AuthSessionResponse> {
  const data = await api.post<AuthSessionResponse>("/api/auth/firebase-github", {
    id_token: idToken,
  });
  persistSession(data);
  return data;
}

export async function getMe(): Promise<CurrentUserResponse> {
  return api.get<CurrentUserResponse>("/api/auth/me");
}

export async function sendVerificationEmail(): Promise<VerificationEmailResponse> {
  return api.post<VerificationEmailResponse>("/api/auth/send-verification");
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return api.get<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function logout(): void {
  if (typeof window !== "undefined") {
    clearToken();
    getSafeSessionStorage().removeItem("nexusai_refresh");
    window.location.href = "/login";
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getToken();
}
