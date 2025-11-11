interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  emailVerified?: boolean;
  createdAt: number;
}

export function exportUsersToCSV(users: User[]): string {
  const headers = ["ID", "Name", "Email", "Role", "Status", "Email Verified", "Created At"];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    user.role || "",
    user.banned ? "Banned" : "Active",
    user.emailVerified ? "Yes" : "No",
    new Date(user.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function exportUsersToJSON(users: User[]): string {
  const data = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || null,
    status: user.banned ? "banned" : "active",
    emailVerified: user.emailVerified || false,
    createdAt: new Date(user.createdAt).toISOString(),
  }));

  return JSON.stringify(data, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportUsers(
  users: User[],
  format: "csv" | "json",
  filename?: string
) {
  const timestamp = new Date().toISOString().split("T")[0];
  const defaultFilename = `users-export-${timestamp}`;

  if (format === "csv") {
    const csvContent = exportUsersToCSV(users);
    downloadFile(csvContent, filename || `${defaultFilename}.csv`, "text/csv");
  } else {
    const jsonContent = exportUsersToJSON(users);
    downloadFile(jsonContent, filename || `${defaultFilename}.json`, "application/json");
  }
}

