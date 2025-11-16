"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PROFILE_PICTURE } from "@/lib/constants";
import { useUpdateProfile } from "@/lib/hooks/api/use-auth";
import { useDeleteProfilePicture, useUploadProfilePicture } from "@/lib/hooks/api/use-storage";

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

interface ProfilePictureUploadProps {
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  userName?: string;
  userEmail?: string;
}

export function ProfilePictureUpload({
  currentImageUrl,
  onImageChange,
  userName,
  userEmail,
}: ProfilePictureUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useUploadProfilePicture();
  const deleteMutation = useDeleteProfilePicture();
  const updateProfileMutation = useUpdateProfile();

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
        // Update profile with new image URL
        await updateProfileMutation.mutateAsync({ image: response.url });
        onImageChange(response.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : PROFILE_PICTURE.UPLOAD_FAILED);
        setPreview(null);
      }
    },
    [onImageChange, uploadMutation, updateProfileMutation]
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
    setIsDragging(true);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLoading) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setError(null);

    try {
      await deleteMutation.mutateAsync(currentImageUrl);
      await updateProfileMutation.mutateAsync({ image: null });
      onImageChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : PROFILE_PICTURE.DELETE_FAILED);
    }
  };

  const displayImage = preview || currentImageUrl;
  const isLoading =
    uploadMutation.isPending || deleteMutation.isPending || updateProfileMutation.isPending;

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
          <div>
            <h3 className="text-sm font-medium" aria-label={PROFILE_PICTURE.TITLE}>
              {PROFILE_PICTURE.TITLE}
            </h3>
            <p className="text-xs text-muted-foreground">{PROFILE_PICTURE.MAX_SIZE}</p>
            <p className="text-xs text-muted-foreground">{PROFILE_PICTURE.ALLOWED_TYPES}</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {currentImageUrl ? (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {PROFILE_PICTURE.CHANGE}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {PROFILE_PICTURE.UPLOAD}
                </>
              )}
            </Button>

            {currentImageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {PROFILE_PICTURE.DELETING}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {PROFILE_PICTURE.DELETE}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label={PROFILE_PICTURE.SELECT_FILE}
        disabled={isLoading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"}`}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{PROFILE_PICTURE.UPLOADING}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{PROFILE_PICTURE.DRAG_DROP}</p>
            <p className="text-xs text-muted-foreground mt-2">{PROFILE_PICTURE.SELECT_FILE}</p>
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
