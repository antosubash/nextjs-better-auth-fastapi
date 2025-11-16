"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { API_KEY_PLACEHOLDERS } from "@/lib/constants";

interface PermissionsJsonEditorProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export function PermissionsJsonEditor({ value, error, onChange }: PermissionsJsonEditorProps) {
  const handleJsonChange = (json: string) => {
    onChange(json);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => handleJsonChange(e.target.value)}
        placeholder={API_KEY_PLACEHOLDERS.PERMISSIONS}
        rows={8}
        className={`font-mono text-sm ${error ? "border-destructive" : ""}`}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
