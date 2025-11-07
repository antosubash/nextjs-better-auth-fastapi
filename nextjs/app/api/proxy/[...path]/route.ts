import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tokenResponse = await auth.api.getToken({
      headers: headersList,
    });

    if (!tokenResponse?.token) {
      return NextResponse.json(
        { error: "Failed to generate token" },
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
          {
            error:
              "Backend service unavailable. Please ensure FastAPI is running.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: `Proxy request failed: ${errorMessage}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 },
    );
  }
}
