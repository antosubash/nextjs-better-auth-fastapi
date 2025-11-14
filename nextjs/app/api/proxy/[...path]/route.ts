import { betterAuthService } from "@/lib/better-auth-service/index";
import { NextRequest, NextResponse } from "next/server";
import { PROXY_ERRORS } from "@/lib/constants";

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

async function handleProxyRequest(request: NextRequest, pathSegments: string[], method: string) {
  try {
    // Handle special case: auth/get-token - requires session
    if (
      pathSegments.length === 2 &&
      pathSegments[0] === "auth" &&
      pathSegments[1] === "get-token"
    ) {
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

    const endpoint = `/${pathSegments.join("/")}`;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${apiBaseUrl}${endpoint}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    const requestHeaders = new Headers();
    requestHeaders.set("Content-Type", "application/json");

    // Check for API key first (allows API key authentication without session)
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey) {
      requestHeaders.set("X-API-Key", apiKey);
    }

    // Try to get JWT token from session (optional if API key is present)
    try {
      const session = await betterAuthService.session.getSession();
      if (session?.session) {
        const tokenResponse = await betterAuthService.session.getToken();
        if (tokenResponse?.token) {
          requestHeaders.set("Authorization", `Bearer ${tokenResponse.token}`);
        }
      }
    } catch {
      // Session/JWT is optional if API key is provided
      if (!apiKey) {
        return NextResponse.json({ error: PROXY_ERRORS.NOT_AUTHENTICATED }, { status: 401 });
      }
    }

    // Require either API key or JWT token
    if (!apiKey && !requestHeaders.has("Authorization")) {
      return NextResponse.json({ error: PROXY_ERRORS.NOT_AUTHENTICATED }, { status: 401 });
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (method !== "GET" && method !== "DELETE") {
      const body = await request.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    const response = await fetch(fullUrl, requestOptions);

    // Handle 204 No Content responses (no body allowed)
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        statusText: response.statusText,
      });
    }

    const responseData = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(responseData);
    } catch {
      jsonData = responseData;
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error("Proxy request failed:", error);

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
}
