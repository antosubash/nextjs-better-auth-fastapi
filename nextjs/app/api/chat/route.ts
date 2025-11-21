import type { NextRequest } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { PROXY_ERRORS } from "@/lib/constants";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("api/chat");

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await betterAuthService.session.getSession();
    if (!session?.session) {
      return new Response(JSON.stringify({ error: PROXY_ERRORS.NOT_AUTHENTICATED }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get auth token
    const tokenResponse = await betterAuthService.session.getToken();
    if (!tokenResponse?.token) {
      return new Response(JSON.stringify({ error: PROXY_ERRORS.FAILED_TO_GENERATE_TOKEN }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get request body
    const body = await request.json();

    // Build backend URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const backendUrl = `${apiBaseUrl}/chat`;

    // Forward request to backend with streaming
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenResponse.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error("Backend chat error", { status: backendResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: errorText }), {
        status: backendResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(backendResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logger.error("Chat API error", error);
    if (error instanceof Error) {
      const errorMessage = error.message || "";
      if (errorMessage.includes("ECONNREFUSED")) {
        return new Response(JSON.stringify({ error: PROXY_ERRORS.BACKEND_UNAVAILABLE }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: PROXY_ERRORS.PROXY_REQUEST_FAILED }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
