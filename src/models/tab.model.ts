import { FileItem } from "@/types/FileItem";
import ISession from "./session.model";

export type TabType = "browser" | "editor" | "terminal" | "settings";
export type ViewMode = "list" | "grid" | "detailed";
export type SortBy = "name" | "size" | "modified" | "type";
export type SortOrder = "asc" | "desc";

export default interface ITab {
  id: string; // Unique identifier
  index: number; // Position in tab bar
  session?: ISession; // Associated session
  filePath?: string; // Current directory or file path

  // Display properties
  title: string; // Tab display name
  icon?: string; // Tab icon (lucide icon name or emoji)

  // State properties
  isActive: boolean; // Currently active tab
  isPinned: boolean; // Pinned tabs can't be accidentally closed
  isDirty: boolean; // Has unsaved changes
  isLoading: boolean; // Loading state
  type: TabType; // Type of tab content
  error?: string; // Error message if any

  // Content properties
  files?: FileItem[]; // List of files in the current directory

  // Navigation & history
  history: string[]; // Path history for back/forward navigation
  historyIndex: number; // Current position in history
  lastActivity: Date; // When tab was last accessed

  // File browser state
  selectedFiles: string[]; // Selected file paths
  viewMode: ViewMode; // How files are displayed
  sortBy: SortBy; // Current sort column
  sortOrder: SortOrder; // Sort direction
  filterQuery: string; // Search/filter text
  scrollPosition: number; // Remember scroll position

  // Transfer state
  activeTransfers: string[]; // IDs of active file transfers

  // Editor state (for file editing tabs)
  editorContent?: string; // File content for editor tabs
  editorLanguage?: string; // Syntax highlighting language
  cursorPosition?: { line: number; column: number }; // Cursor position

  // Custom properties
  notes?: string; // User notes for the tab
  colorLabel?: string; // Color coding for tabs
  tags?: string[]; // Tags for organization
}

// types/TabHistory.ts
export interface TabHistoryItem {
  path: string;
  timestamp: Date;
  scrollPosition?: number;
}
