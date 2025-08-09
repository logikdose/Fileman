export interface FileItem {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
  modified: number;
  permissions: string;
}