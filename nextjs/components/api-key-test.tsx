"use client";

import { CheckCircle2, Key, Loader2, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { callFastApiWithApiKey } from "@/lib/api-key-client";
import { API_KEY_TEST } from "@/lib/constants";

interface ApiKeyTestFormValues {
  apiKey: string;
  endpoint: string;
  method: string;
  content: string;
  includeJwt: boolean;
  authMethod: string;
}

export function ApiKeyTest() {
  const [response, setResponse] = useState<unknown | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ApiKeyTestFormValues>({
    defaultValues: {
      apiKey: "",
      endpoint: "/getdata",
      method: "POST",
      content: '{"content": "test data"}',
      includeJwt: false,
      authMethod: "apiKey",
    },
  });

  const handleSubmit = async (values: ApiKeyTestFormValues) => {
    setError(null);
    setSuccess(false);
    setResponse(null);
    setResponseStatus(null);
    setResponseHeaders({});
    setIsLoading(true);

    try {
      // Determine authentication method
      let apiKey: string | undefined;
      let includeJwt = false;

      if (values.authMethod === "apiKey" || values.authMethod === "both") {
        apiKey = values.apiKey.trim();
        if (!apiKey) {
          throw new Error("API key is required");
        }
      }

      if (values.authMethod === "jwt" || values.authMethod === "both") {
        includeJwt = true;
      }

      // Parse content if provided
      let body: string | undefined;
      if (values.content.trim()) {
        try {
          JSON.parse(values.content);
          body = values.content;
        } catch {
          throw new Error("Content must be valid JSON");
        }
      }

      const result = await callFastApiWithApiKey(values.endpoint, {
        method: values.method as RequestInit["method"],
        apiKey,
        includeJwt,
        body: body,
      });

      setResponse(result.data);
      setResponseStatus(result.status);
      setResponseHeaders(result.headers);

      // Consider it successful if status is 2xx
      if (result.status >= 200 && result.status < 300) {
        setSuccess(true);
      } else {
        // Show error for non-2xx responses
        const errorMessage =
          typeof result.data === "object" && result.data !== null && "detail" in result.data
            ? String(result.data.detail)
            : `Request failed with status ${result.status}: ${result.statusText}`;
        setError(errorMessage);
        setSuccess(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : API_KEY_TEST.ERROR);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJson = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {API_KEY_TEST.TITLE}
        </CardTitle>
        <CardDescription>{API_KEY_TEST.DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mb-6">
            <FormField
              control={form.control}
              name="authMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_KEY_TEST.AUTH_METHOD_LABEL}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apiKey">{API_KEY_TEST.API_KEY_ONLY}</SelectItem>
                        <SelectItem value="jwt">{API_KEY_TEST.JWT_ONLY}</SelectItem>
                        <SelectItem value="both">{API_KEY_TEST.BOTH}</SelectItem>
                        <SelectItem value="none">{API_KEY_TEST.NO_AUTH}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(form.watch("authMethod") === "apiKey" || form.watch("authMethod") === "both") && (
              <FormField
                control={form.control}
                name="apiKey"
                rules={{
                  required: "API key is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_TEST.API_KEY_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={API_KEY_TEST.API_KEY_PLACEHOLDER}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_TEST.METHOD_LABEL}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endpoint"
                rules={{
                  required: "Endpoint is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_TEST.ENDPOINT_LABEL}</FormLabel>
                    <FormControl>
                      <Input placeholder={API_KEY_TEST.ENDPOINT_PLACEHOLDER} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(form.watch("method") === "POST" ||
              form.watch("method") === "PUT" ||
              form.watch("method") === "PATCH") && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_TEST.CONTENT_LABEL}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={API_KEY_TEST.CONTENT_PLACEHOLDER}
                        rows={4}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {API_KEY_TEST.LOADING}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {API_KEY_TEST.SEND_REQUEST}
                </>
              )}
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{API_KEY_TEST.ERROR}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response !== null && (
          <div className="space-y-4">
            {success ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>{API_KEY_TEST.SUCCESS}</AlertTitle>
                <AlertDescription>
                  {responseStatus && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">{API_KEY_TEST.STATUS_LABEL}: </span>
                      <span className="font-mono">{responseStatus}</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              responseStatus && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>{API_KEY_TEST.ERROR}</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">{API_KEY_TEST.STATUS_LABEL}: </span>
                      <span className="font-mono">{responseStatus}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              )
            )}

            <Tabs defaultValue="response" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="response">{API_KEY_TEST.RESPONSE_LABEL}</TabsTrigger>
                <TabsTrigger value="headers">{API_KEY_TEST.HEADERS_LABEL}</TabsTrigger>
              </TabsList>
              <TabsContent value="response" className="mt-4">
                <div className="bg-muted p-4 rounded-lg border">
                  <pre className="text-sm overflow-auto max-h-96 font-mono">
                    {formatJson(response)}
                  </pre>
                </div>
              </TabsContent>
              <TabsContent value="headers" className="mt-4">
                <div className="bg-muted p-4 rounded-lg border">
                  <pre className="text-sm overflow-auto max-h-96 font-mono">
                    {formatJson(responseHeaders)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
