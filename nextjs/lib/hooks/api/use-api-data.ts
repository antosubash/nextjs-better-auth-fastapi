import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { callFastApi } from "@/lib/api-client";
import { callFastApiWithApiKey } from "@/lib/api-key-client";
import { API_DATA, API_KEY_TEST } from "@/lib/constants";

interface ApiDataRequest {
  content: string;
}

interface ApiDataResponse {
  content: string;
}

export function useApiData() {
  return useMutation<ApiDataResponse, Error, ApiDataRequest>({
    mutationFn: async (data: ApiDataRequest) => {
      return callFastApi<ApiDataResponse>("/getdata", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(API_DATA.SUCCESS);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_DATA.ERROR);
    },
  });
}

interface ApiKeyTestRequest {
  apiKey?: string;
  endpoint: string;
  method: string;
  content?: string;
  includeJwt: boolean;
  authMethod: string;
}

interface ApiKeyTestResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export function useApiKeyTest() {
  return useMutation<ApiKeyTestResponse, Error, ApiKeyTestRequest>({
    mutationFn: async (data: ApiKeyTestRequest) => {
      let apiKey: string | undefined;
      let includeJwt = false;

      if (data.authMethod === "apiKey" || data.authMethod === "both") {
        apiKey = data.apiKey?.trim();
        if (!apiKey) {
          throw new Error("API key is required");
        }
      }

      if (data.authMethod === "jwt" || data.authMethod === "both") {
        includeJwt = true;
      }

      let body: string | undefined;
      if (data.content?.trim()) {
        try {
          JSON.parse(data.content);
          body = data.content;
        } catch {
          throw new Error("Content must be valid JSON");
        }
      }

      return callFastApiWithApiKey(data.endpoint, {
        method: data.method as RequestInit["method"],
        apiKey,
        includeJwt,
        body: body,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_TEST.ERROR);
    },
  });
}
