import { API_CONFIG } from "./constants";

export interface ApiError {
  message: string;
  status?: number;
}

async function getBearerToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/token");
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export async function callFastApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getBearerToken();
  
  if (!token) {
    throw new Error("Not authenticated");
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    if (response.status === 403) {
      throw new Error("Token expired");
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

