export interface ApiError {
  message: string;
  status?: number;
}

export async function callFastApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const endpointPath = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `/api/proxy/${endpointPath}`;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
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

  // Handle 204 No Content responses (no body to parse)
  if (response.status === 204) {
    return undefined as T;
  }

  // Read response text first to check if there's any content
  const text = await response.text();

  // If response is empty, return undefined
  if (!text.trim()) {
    return undefined as T;
  }

  // Parse JSON
  return JSON.parse(text) as T;
}
