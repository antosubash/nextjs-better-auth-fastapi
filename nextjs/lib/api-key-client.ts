/**
 * API client for making requests with API keys.
 * Uses the proxy to communicate with the backend API.
 */

export interface ApiKeyRequestOptions extends RequestInit {
  apiKey?: string;
  includeJwt?: boolean;
}

export interface ApiKeyResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export async function callFastApiWithApiKey<T>(
  endpoint: string,
  options: ApiKeyRequestOptions = {}
): Promise<ApiKeyResponse<T>> {
  const { apiKey, includeJwt = false, ...fetchOptions } = options;

  const endpointPath = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `/api/proxy/${endpointPath}`;

  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");

  // Add API key if provided (will be forwarded by proxy)
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  // Note: JWT token is automatically added by the proxy if user is authenticated
  // The includeJwt flag is kept for API compatibility but the proxy handles it

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  // Extract response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let data: T;
  const responseText = await response.text();
  try {
    data = JSON.parse(responseText) as T;
  } catch {
    data = responseText as unknown as T;
  }

  // Return response even if not ok, so UI can display error details
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  };
}

