// Icon Pack
import FileDefault from "@/assets/icons/file-default.png";
import FolderIcon from "@/assets/icons/folder-blue.png";
import FileTxt from "@/assets/icons/file-txt.png";
import FilePdf from "@/assets/icons/file-pdf.png";
import FileZip from "@/assets/icons/file-zip.png";

export function getTabNameFromPath(path: string): string | undefined {
  // Extract the last part of the path as the tab name
  const parts = path.split("/");
  const lastPart = parts[parts.length - 1];

  return lastPart ? lastPart : undefined; // Return "/" if the path is empty
}

export function bytesSizeToString(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fileExtensionFromName(fileName: string): string | undefined {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop() : undefined;
}

export function fileNameWithoutExtension(fileName: string): string | undefined {
  const parts = fileName.split(".");
  if (parts.length > 1) {
    parts.pop();
    return parts.join(".");
  }
  return fileName; // Return the original name if no extension is found
}

export function lastModifiedToString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get the icon for a file based on its name.
 * @param fileName The name of the file.
 * @returns The icon class name for the file type.
 */
export function getIconForFileType(fileName: string, isDirectory?: boolean): string {
  if (isDirectory) return FolderIcon;

  const extension = fileName.split(".").pop();
  switch (extension) {
    case "txt":
      return FileTxt;
    case "pdf":
      return FilePdf;
    case "zip":
      return FileZip;
    default:
      return FileDefault;
  }
}

export function isSamePath(pathOne: string, pathTwo: string): boolean {
  // Normalize paths by removing trailing slashes
  const normalizedPathOne = pathOne.replace(/\/+$/, "");
  const normalizedPathTwo = pathTwo.replace(/\/+$/, "");

  return normalizedPathOne === normalizedPathTwo;
}

export function dateTimeFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}