import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/api/storage";
import { PROFILE_PICTURE } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all });
      toast.success(PROFILE_PICTURE.UPLOAD_SUCCESS);
    },
    onError: (error: Error) => {
      toast.error(error.message || PROFILE_PICTURE.UPLOAD_FAILED);
    },
  });
}

export function useDeleteProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUrl: string) => deleteProfilePicture(imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all });
      toast.success(PROFILE_PICTURE.DELETE_SUCCESS);
    },
    onError: (error: Error) => {
      toast.error(error.message || PROFILE_PICTURE.DELETE_FAILED);
    },
  });
}

