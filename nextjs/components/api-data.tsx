"use client";

import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { callFastApi } from "@/lib/api-client";
import { API_DATA } from "@/lib/constants";

interface ApiDataFormValues {
  content: string;
}

export function ApiData() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ApiDataFormValues>({
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = async (values: ApiDataFormValues) => {
    setError(null);
    setSuccess(false);
    setResponse(null);
    setIsLoading(true);

    try {
      const result = await callFastApi<{ content: string }>("/getdata", {
        method: "POST",
        body: JSON.stringify({ content: values.content }),
      });
      setResponse(result.content);
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : API_DATA.ERROR);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{API_DATA.TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mb-6">
            <FormField
              control={form.control}
              name="content"
              rules={{
                required: "Content is required",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_DATA.CONTENT_PLACEHOLDER}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={API_DATA.CONTENT_PLACEHOLDER} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading || !form.watch("content")?.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {API_DATA.LOADING}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {API_DATA.SEND_BUTTON}
                </>
              )}
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{API_DATA.ERROR}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && response && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>{API_DATA.SUCCESS}</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">{API_DATA.RESPONSE_LABEL}</p>
                <p className="text-sm bg-muted p-3 rounded border">{response}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
