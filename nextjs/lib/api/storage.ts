export interface ProfilePictureUploadResponse {
  url: string;
  message: string;
}

export interface ProfilePictureDeleteResponse {
  message: string;
}

export async function uploadProfilePicture(file: File): Promise<ProfilePictureUploadResponse> {
  const endpointPath = "storage/profile-picture";
  const url = `/api/proxy/${endpointPath}`;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorData.detail || "Failed to upload profile picture");
  }

  return response.json();
}

export async function deleteProfilePicture(
  imageUrl: string
): Promise<ProfilePictureDeleteResponse> {
  const endpointPath = "storage/profile-picture";
  const url = `/api/proxy/${endpointPath}`;

  const formData = new FormData();
  formData.append("image_url", imageUrl);

  const response = await fetch(url, {
    method: "DELETE",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Delete failed" }));
    throw new Error(errorData.detail || "Failed to delete profile picture");
  }

  return response.json();
}

