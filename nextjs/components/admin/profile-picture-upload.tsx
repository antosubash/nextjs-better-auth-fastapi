"use client";

import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { PROFILE_PICTURE } from "@/lib/constants";
import { useUploadProfilePicture, useDeleteProfilePicture } from "@/lib/hooks/api/use-storage";
import { cn } from "@/lib/utils";

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onUploadSuccess: (imageUrl: string) => void;
  onDeleteSuccess: () => void;
  disabled?: boolean;
  userName?: string;
  userEmail?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

export function ProfilePictureUpload({
  currentImageUrl,
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  userName,
  userEmail,
}: ProfilePictureUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useUploadProfilePicture();
  const deleteMutation = useDeleteProfilePicture();

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return PROFILE_PICTURE.INVALID_FILE_TYPE;
        }
        if (file.size > MAX_FILE_SIZE) {
          return PROFILE_PICTURE.FILE_TOO_LARGE;
        }
        return null;
      };
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setError(null);

      try {
        const response = await uploadMutation.mutateAsync(file);
        setPreview(null);
        onUploadSuccess(response.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : PROFILE_PICTURE.UPLOAD_FAILED);
        setPreview(null);
      }
    },
    [onUploadSuccess, uploadMutation]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setError(null);

    try {
      await deleteMutation.mutateAsync(currentImageUrl);
      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : PROFILE_PICTURE.DELETE_FAILED);
    }
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <Avatar className="w-24 h-24">
          {displayImage ? <AvatarImage src={displayImage} alt={PROFILE_PICTURE.TITLE} /> : null}
          <AvatarFallback className="text-2xl font-bold">
            {getInitials(userName, userEmail)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <section
            aria-label={PROFILE_PICTURE.TITLE}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-2 border-dashed p-6 h-auto flex-col",
              isDragging && !disabled
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={handleFileInputChange}
              disabled={disabled || uploadMutation.isPending}
              className="hidden"
            />

            <div className="space-y-2 w-full">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{PROFILE_PICTURE.DRAG_DROP}</p>
              <p className="text-xs text-muted-foreground">{PROFILE_PICTURE.MAX_SIZE}</p>
              <p className="text-xs text-muted-foreground">{PROFILE_PICTURE.ALLOWED_TYPES}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploadMutation.isPending}
                className="mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                {PROFILE_PICTURE.SELECT_FILE}
              </Button>
            </div>
          </section>

          {currentImageUrl && !preview && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {PROFILE_PICTURE.CHANGE}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {PROFILE_PICTURE.DELETING}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    {PROFILE_PICTURE.DELETE}
                  </>
                )}
              </Button>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {PROFILE_PICTURE.UPLOADING}
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
