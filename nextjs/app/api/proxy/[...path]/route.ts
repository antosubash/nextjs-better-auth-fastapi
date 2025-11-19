import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { PROXY_ERRORS } from "@/lib/constants";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("api/proxy");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PATCH");
}

async function handleAuthTokenRequest() {
  const session = await betterAuthService.session.getSession();
  if (!session?.session) {
    return NextResponse.json({ error: PROXY_ERRORS.NOT_AUTHENTICATED }, { status: 401 });
  }
  const tokenResponse = await betterAuthService.session.getToken();
  if (!tokenResponse?.token) {
    return NextResponse.json({ error: PROXY_ERRORS.FAILED_TO_GENERATE_TOKEN }, { status: 500 });
  }
  return NextResponse.json(tokenResponse);
}

function buildRequestUrl(pathSegments: string[], searchParams: string): string {
  const endpoint = `/${pathSegments.join("/")}`;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiBaseUrl}${endpoint}`;
  return searchParams ? `${url}?${searchParams}` : url;
}

function setContentTypeHeaders(requestHeaders: Headers, contentType: string): void {
  const isMultipart = contentType.includes("multipart/form-data");
  if (!isMultipart) {
    requestHeaders.set("Content-Type", "application/json");
  } else {
    requestHeaders.set("Content-Type", contentType);
  }
}

async function addAuthenticationHeaders(
  requestHeaders: Headers,
  apiKey: string | null
): Promise<NextResponse | null> {
  if (apiKey) {
    requestHeaders.set("X-API-Key", apiKey);
  }

  try {
    const session = await betterAuthService.session.getSession();
    if (session?.session) {
      const tokenResponse = await betterAuthService.session.getToken();
      if (tokenResponse?.token) {
        requestHeaders.set("Authorization", `Bearer ${tokenResponse.token}`);
      }
    }
  } catch {
    if (!apiKey) {
      return NextResponse.json({ error: PROXY_ERRORS.NOT_AUTHENTICATED }, { status: 401 });
    }
  }

  if (!apiKey && !requestHeaders.has("Authorization")) {
    return NextResponse.json({ error: PROXY_ERRORS.NOT_AUTHENTICATED }, { status: 401 });
  }

  return null;
}

async function buildRequestBody(
  request: NextRequest,
  method: string,
  isMultipart: boolean
): Promise<ArrayBuffer | string | undefined> {
  if (method === "GET" || method === "DELETE") {
    return undefined;
  }

  if (isMultipart) {
    return await request.arrayBuffer();
  }

  const body = await request.text();
  return body || undefined;
}

async function handleProxyResponse(response: Response): Promise<NextResponse> {
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      statusText: response.statusText,
    });
  }

  // Check if response is an image or binary content
  const contentType = response.headers.get("content-type") || "";
  const isImage = contentType.startsWith("image/");
  const isBinary =
    contentType.startsWith("application/octet-stream") || contentType.includes("binary") || isImage;

  if (isBinary) {
    // Handle binary responses (images, files, etc.)
    const arrayBuffer = await response.arrayBuffer();
    const contentLength = response.headers.get("content-length");
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    // Cache control for images
    if (isImage) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }

    return new NextResponse(arrayBuffer, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Handle JSON/text responses
  const responseData = await response.text();
  let jsonData: unknown;
  try {
    jsonData = JSON.parse(responseData);
  } catch {
    jsonData = responseData;
  }

  return NextResponse.json(jsonData, {
    status: response.status,
    statusText: response.statusText,
  });
}

function handleProxyError(error: unknown): NextResponse {
  logger.error("Proxy request failed", error);

  if (error instanceof Error) {
    const errorMessage = error.message || "";
    const causeMessage = error.cause instanceof Error ? error.cause.message : "";
    const fullError = `${errorMessage} ${causeMessage}`.trim();

    if (fullError.includes("ECONNREFUSED")) {
      return NextResponse.json({ error: PROXY_ERRORS.BACKEND_UNAVAILABLE }, { status: 503 });
    }
    return NextResponse.json(
      { error: `${PROXY_ERRORS.PROXY_REQUEST_FAILED}: ${errorMessage}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: PROXY_ERRORS.FAILED_TO_PROXY_REQUEST }, { status: 500 });
}

async function handleProxyRequest(request: NextRequest, pathSegments: string[], method: string) {
  try {
    // Handle special case: auth/get-token - requires session
    if (
      pathSegments.length === 2 &&
      pathSegments[0] === "auth" &&
      pathSegments[1] === "get-token"
    ) {
      return await handleAuthTokenRequest();
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = buildRequestUrl(pathSegments, searchParams);

    const requestHeaders = new Headers();
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    setContentTypeHeaders(requestHeaders, contentType);

    const apiKey = request.headers.get("X-API-Key");
    const authError = await addAuthenticationHeaders(requestHeaders, apiKey);
    if (authError) {
      return authError;
    }

    const body = await buildRequestBody(request, method, isMultipart);

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body,
    };

    const response = await fetch(fullUrl, requestOptions);
    return await handleProxyResponse(response);
  } catch (error) {
    return handleProxyError(error);
  }
}
