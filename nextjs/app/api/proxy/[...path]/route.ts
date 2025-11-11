import { betterAuthService } from "@/lib/better-auth-service/index";
import { NextRequest, NextResponse } from "next/server";
import { PROXY_ERRORS } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PATCH");
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string,
) {
  try {
    const session = await betterAuthService.session.getSession();

    if (!session?.session) {
      return NextResponse.json(
        { error: PROXY_ERRORS.NOT_AUTHENTICATED },
        { status: 401 }
      );
    }

    const tokenResponse = await betterAuthService.session.getToken();

    if (!tokenResponse?.token) {
      return NextResponse.json(
        { error: PROXY_ERRORS.FAILED_TO_GENERATE_TOKEN },
        { status: 500 },
      );
    }

    const endpoint = `/${pathSegments.join("/")}`;
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${apiBaseUrl}${endpoint}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    const requestHeaders = new Headers();
    requestHeaders.set("Authorization", `Bearer ${tokenResponse.token}`);
    requestHeaders.set("Content-Type", "application/json");

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
      const causeMessage =
        error.cause instanceof Error ? error.cause.message : "";
      const fullError = `${errorMessage} ${causeMessage}`.trim();

      if (fullError.includes("ECONNREFUSED")) {
        return NextResponse.json(
          { error: PROXY_ERRORS.BACKEND_UNAVAILABLE },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: `${PROXY_ERRORS.PROXY_REQUEST_FAILED}: ${errorMessage}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: PROXY_ERRORS.FAILED_TO_PROXY_REQUEST },
      { status: 500 },
    );
  }
}
