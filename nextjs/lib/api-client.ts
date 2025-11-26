export interface ApiError {
  message: string;
  status?: number;
}

const extractErrorMessage = (response: Response, text: string): string => {
  let errorMessage = response.statusText;
  if (text) {
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.detail || errorJson.error || errorJson.message || text;
    } catch {
      errorMessage = text;
    }
  }
  return errorMessage;
};

const handleApiError = (response: Response, text: string): never => {
  const errorMessage = extractErrorMessage(response, text);

  if (response.status === 401) {
    throw new Error(errorMessage || "Authentication failed");
  }
  if (response.status === 403) {
    throw new Error(errorMessage || "Token expired");
  }
  throw new Error(errorMessage || `API request failed: ${response.statusText}`);
};

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

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!response.ok) {
    handleApiError(response, text);
  }

  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
