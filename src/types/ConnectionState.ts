import { FileItem } from "./FileItem";

export interface ConnectionState {
  connectionId?: string; // The connection ID from Rust backend
  currentPath: string;
  files: FileItem[];
  isLoading: boolean;
  error?: string;
}