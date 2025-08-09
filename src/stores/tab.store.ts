import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import ITab, { SortBy, SortOrder, TabType, ViewMode } from "../models/tab.model";
import ISession from "../models/session.model";
import { FileItem } from "@/types/FileItem";
import { invoke } from "@tauri-apps/api/core";
import useSessionStore from "./session.store";
import { getTabNameFromPath } from "@/utils/file.util";

interface TabStore {
  // State
  tabs: ITab[];
  activeTabId?: string;
  nextIndex: number;

  // Tab management
  createTab: (session?: ISession, filePath?: string, type?: TabType) => string;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepTabId: string) => void;
  closeTabsToRight: (fromTabId: string) => void;
  duplicateTab: (tabId: string) => string;

  // Tab state
  setActiveTab: (tabId: string) => void;
  moveTab: (tabId: string, newIndex: number) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  togglePin: (tabId: string) => void;

  // Tab properties
  updateTab: (tabId: string, updates: Partial<ITab>) => void;
  updateSessionInTab: (tabId: string, session: ISession) => void;
  setTabTitle: (tabId: string, title: string) => void;
  setTabIcon: (tabId: string, icon: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  setTabLoading: (tabId: string, isLoading: boolean) => void;

  // File Path
  setFilePath: (tabId: string, filePath: string) => void;

  // Navigation
  navigateToPath: (tabId: string, sessionId: string | undefined, path: string) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  goUp: (tabId: string) => void;
  canGoBack: (tabId: string) => boolean;
  canGoForward: (tabId: string) => boolean;

  // File browser state
  setFiles: (tabId: string, files: FileItem[]) => void;
  loadDirectory: (tabId: string, connectionId: string) => Promise<boolean>;
  setSelectedFiles: (tabId: string, files: string[]) => void;
  toggleFileSelection: (tabId: string, filePath: string) => void;
  selectFile: (tabId: string, filePath: string) => void;
  addFileToSelection: (tabId: string, filePath: string) => void;
  addFilesToSelection: (tabId: string, filePaths: string[]) => void;
  removeFileFromSelection: (tabId: string, filePath: string) => void;
  removeFilesFromSelection: (tabId: string, filePaths: string[]) => void;
  selectAllFiles: (tabId: string, files: string[]) => void;
  clearSelection: (tabId: string) => void;
  setViewMode: (tabId: string, mode: ViewMode) => void;
  setSorting: (tabId: string, sortBy: SortBy, sortOrder: SortOrder) => void;
  setFilter: (tabId: string, query: string) => void;
  setScrollPosition: (tabId: string, position: number) => void;

  // Editor state
  setEditorContent: (tabId: string, content: string) => void;
  setEditorLanguage: (tabId: string, language: string) => void;
  setCursorPosition: (tabId: string, line: number, column: number) => void;

  // Transfer management
  addTransfer: (tabId: string, transferId: string) => void;
  removeTransfer: (tabId: string, transferId: string) => void;

  // Utility functions
  getTabById: (tabId: string | undefined) => ITab | undefined;
  getActiveTab: () => ITab | undefined;
  getTabsBySession: (sessionId: string) => ITab[];
  getPinnedTabs: () => ITab[];
  getUnpinnedTabs: () => ITab[];
  getTabsWithUnsavedChanges: () => ITab[];

  // Session management
  closeSessionTabs: (sessionId: string) => void;
  updateSessionInTabs: (session: ISession) => void;

  // Persistence
  restoreTabs: (tabs: ITab[]) => void;
  exportTabs: () => ITab[];
}

const useTabStore = create<TabStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tabs: [
          {
            id: "home-tab",
            index: 0,
            session: undefined,
            filePath: "/",
          } as ITab,
        ],
        activeTabId: undefined,
        nextIndex: 0,

        // Tab management
        createTab: (session, filePath = "/", type = "browser") => {
          const tabId = crypto.randomUUID();
          const now = new Date();

          set((state) => {
            const newTab: ITab = {
              id: tabId,
              index: state.nextIndex,
              session,
              filePath,
              title: session ? `${session.name}` : "New Tab",
              icon: type === "browser" ? "folder" : type === "editor" ? "file-text" : "terminal",
              isActive: false,
              isPinned: false,
              isDirty: false,
              isLoading: false,
              type,
              history: [filePath],
              historyIndex: 0,
              lastActivity: now,
              selectedFiles: [],
              viewMode: "list",
              sortBy: "name",
              sortOrder: "asc",
              filterQuery: "",
              scrollPosition: 0,
              activeTransfers: [],
            };

            state.tabs.push(newTab);
            state.nextIndex += 1;
            state.activeTabId = tabId;
          });

          return tabId;
        },

        closeTab: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (!tab || tab.isPinned) return;

            const index = state.tabs.findIndex((t) => t.id === tabId);
            if (index === -1) return;

            // Remove tab
            state.tabs = state.tabs.filter((t) => t.id !== tabId);

            // Update indices
            state.tabs.forEach((tab, index) => {
              tab.index = index;
            });
            state.nextIndex = state.tabs.length;

            // Set active tab to the next one or previous one
            if (state.tabs.length > 0) {
              state.activeTabId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
            } else {
              state.activeTabId = undefined;
            }
          });
        },

        closeAllTabs: () => {
          set((state) => {
            state.tabs = state.tabs.filter((tab) => tab.isPinned);
            state.tabs.forEach((tab, index) => {
              tab.index = index;
            });
            state.nextIndex = state.tabs.length;
            state.activeTabId = state.tabs.length > 0 ? state.tabs[0].id : undefined;
          });
        },

        closeOtherTabs: (keepTabId) => {
          set((state) => {
            const keepTab = state.tabs.find((t) => t.id === keepTabId);
            if (!keepTab) return;

            state.tabs = state.tabs.filter((tab) => tab.id === keepTabId || tab.isPinned);
            state.tabs.forEach((tab, index) => {
              tab.index = index;
            });
            state.nextIndex = state.tabs.length;
            state.activeTabId = keepTabId;
          });
        },

        closeTabsToRight: (fromTabId) => {
          set((state) => {
            const fromIndex = state.tabs.findIndex((t) => t.id === fromTabId);
            if (fromIndex === -1) return;

            const tabsToKeep = state.tabs.slice(0, fromIndex + 1);
            const tabsToClose = state.tabs.slice(fromIndex + 1);

            // Keep pinned tabs
            const pinnedTabs = tabsToClose.filter((tab) => tab.isPinned);
            state.tabs = [...tabsToKeep, ...pinnedTabs];

            state.tabs.forEach((tab, index) => {
              tab.index = index;
            });
            state.nextIndex = state.tabs.length;

            // Update active tab if it was closed
            if (!state.tabs.find((t) => t.id === state.activeTabId)) {
              state.activeTabId = fromTabId;
            }
          });
        },

        duplicateTab: (tabId) => {
          const tab = get().getTabById(tabId);
          if (!tab) return "";

          const newTabId = crypto.randomUUID();

          set((state) => {
            const duplicatedTab: ITab = {
              ...tab,
              id: newTabId,
              index: state.nextIndex,
              title: `${tab.title} (Copy)`,
              isActive: false,
              isDirty: false,
              lastActivity: new Date(),
            };

            state.tabs.push(duplicatedTab);
            state.nextIndex += 1;
            state.activeTabId = newTabId;
          });

          return newTabId;
        },

        // Tab state
        setActiveTab: (tabId) => {
          set((state) => {
            if (state.tabs.find((t) => t.id === tabId)) {
              state.activeTabId = tabId;

              // Update last activity
              const tab = state.tabs.find((t) => t.id === tabId);
              if (tab) {
                tab.lastActivity = new Date();
              }
            }
          });
        },

        moveTab: (tabId, newIndex) => {
          set((state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return;

            const [tab] = state.tabs.splice(tabIndex, 1);
            state.tabs.splice(newIndex, 0, tab);

            // Update indices
            state.tabs.forEach((tab, index) => {
              tab.index = index;
            });
          });
        },

        pinTab: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.isPinned = true;
            }
          });
        },

        unpinTab: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.isPinned = false;
            }
          });
        },

        togglePin: (tabId) => {
          const tab = get().getTabById(tabId);
          if (tab?.isPinned) {
            get().unpinTab(tabId);
          } else {
            get().pinTab(tabId);
          }
        },

        // Tab properties
        updateTab: (tabId, updates) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              Object.assign(tab, updates);
              tab.lastActivity = new Date();
            }
          });
        },

        updateSessionInTab: (tabId, session) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.session = session;
              tab.lastActivity = new Date();
            }
          });

          // Update path and load directory if session is set
          if (session && !get().getTabById(tabId)?.filePath) {
            get().navigateToPath(tabId, session.id, "/");
          }
        },

        setTabTitle: (tabId, title) => {
          get().updateTab(tabId, { title });
        },

        setTabIcon: (tabId, icon) => {
          get().updateTab(tabId, { icon });
        },

        setTabDirty: (tabId, isDirty) => {
          get().updateTab(tabId, { isDirty });
        },

        setTabLoading: (tabId, isLoading) => {
          get().updateTab(tabId, { isLoading });
        },

        // File Path
        setFilePath: (tabId, filePath) => {
          get().updateTab(tabId, { filePath });
        },

        // Navigation
        navigateToPath: (tabId, sessionId, path) => {
          const tabSessionId = sessionId ?? get().getTabById(tabId)?.session?.id;
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (!tab) {
              console.error(`Tab with ID ${tabId} not found.`);
              return;
            }

            // Add to history if different from current path
            if (tab.filePath !== path) {
              // Check if tab has a history
              if (!tab.history) {
                tab.history = [];
              }

              // Remove any forward history
              tab.history = tab.history.slice(0, tab.historyIndex + 1);
              tab.history.push(path);
              tab.historyIndex = tab.history.length - 1;

              // Limit history size
              if (tab.history.length > 50) {
                tab.history = tab.history.slice(-50);
                tab.historyIndex = tab.history.length - 1;
              }
            }

            tab.filePath = path;
            tab.scrollPosition = 0;
            tab.selectedFiles = [];
            tab.session = useSessionStore.getState().getSessionById(tabSessionId);

            // Update tab title based on path and session
            const pathName = getTabNameFromPath(path);
            const sessionName = tab.session ? tab.session.name : "";

            tab.title = pathName ? `${pathName} - ${sessionName}` : sessionName || "Untitled";
            tab.lastActivity = new Date();
          });

          // If no session ID is provided, use the current tab's session
          if (!tabSessionId) {
            console.error(`No session ID provided for tab ${tabId}.`);
            return;
          }

          // Check if the session is connected
          const isConnected = useSessionStore.getState().getSessionById(tabSessionId)?.status === "connected";
          if (!isConnected) {
            // If not connected, connect to the session
            useSessionStore
              .getState()
              .connectToSession(tabSessionId)
              .then((connected) => {
                if (connected) {
                  get().loadDirectory(tabId, tabSessionId);
                } else {
                  console.error(`Failed to connect to session: ${tabSessionId}`);
                }
              });

            return;
          }

          get().loadDirectory(tabId, tabSessionId);
        },

        // File operations
        loadDirectory: async (tabId, sessionId) => {
          const connectionId = useSessionStore.getState().getConnectionId(sessionId);
          if (!connectionId) return false;

          try {
            const tab = get().getTabById(tabId);
            if (!tab) return false;

            set((state) => {
              const currentTab = state.tabs.find((t) => t.id === tabId);
              if (currentTab) {
                currentTab.isLoading = true;
                currentTab.error = undefined;
              }
            });

            const path = tab.filePath;
            const files = (await invoke("list_directory", {
              connectionId: connectionId,
              path: path,
            })) as FileItem[];

            set((state) => {
              const currentTab = state.tabs.find((t) => t.id === tabId);
              if (currentTab) {
                currentTab.files = files;
                currentTab.lastActivity = new Date();
                currentTab.isLoading = false;
                currentTab.error = undefined;
                currentTab.scrollPosition = 0; // Reset scroll position on new load
                currentTab.selectedFiles = []; // Clear selection on new load
              }
            });
          } catch (error) {
            console.error("Failed to load directory:", error);
            set((state) => {
              const currentTab = state.tabs.find((t) => t.id === tabId);
              if (currentTab) {
                currentTab.files = [];
                currentTab.error = `Failed to load directory: ${error instanceof Error ? error.message : "Unknown error"}`;
                currentTab.isLoading = false;
                currentTab.scrollPosition = 0; // Reset scroll position on error
                currentTab.selectedFiles = []; // Clear selection on error
                currentTab.lastActivity = new Date();
              }
            });

            return false; // Directory load failed
          }

          return true; // Directory loaded successfully
        },

        goBack: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab && tab.historyIndex > 0) {
              tab.historyIndex -= 1;
              tab.filePath = tab.history[tab.historyIndex];
              tab.scrollPosition = 0;
              tab.selectedFiles = [];
              tab.lastActivity = new Date();
            }
          });

          // Load the new directory after navigating
          const sessionId = get().getTabById(tabId)?.session?.id;
          if (!sessionId) return;
          get().loadDirectory(tabId, sessionId);
        },

        goForward: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab && tab.historyIndex < tab.history.length - 1) {
              tab.historyIndex += 1;
              tab.filePath = tab.history[tab.historyIndex];
              tab.scrollPosition = 0;
              tab.selectedFiles = [];
              tab.lastActivity = new Date();
            }
          });

          // Load the new directory after navigating
          const sessionId = get().getTabById(tabId)?.session?.id;
          if (!sessionId) return;
          get().loadDirectory(tabId, sessionId);
        },

        goUp: (tabId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              const parentDir = tab.filePath?.split("/").slice(0, -1).join("/");

              // If parent directory is empty, set to root
              if (!parentDir) {
                tab.filePath = "/";
              } else {
                tab.filePath = parentDir;
              }

              // Reset scroll position and selection
              tab.scrollPosition = 0;
              tab.selectedFiles = [];
              tab.lastActivity = new Date();
            }
          });

          // Load the parent directory
          const sessionId = get().getTabById(tabId)?.session?.id;
          if (!sessionId) return;
          get().loadDirectory(tabId, sessionId);
        },

        canGoBack: (tabId) => {
          const tab = get().getTabById(tabId);
          return tab ? tab.historyIndex > 0 : false;
        },

        canGoForward: (tabId) => {
          const tab = get().getTabById(tabId);
          return tab ? tab.historyIndex < tab.history.length - 1 : false;
        },

        // File browser state
        setFiles: (tabId, files) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.files = files;
              tab.lastActivity = new Date();
            }
          });
        },

        setSelectedFiles: (tabId, files) => {
          get().updateTab(tabId, { selectedFiles: files });
        },

        toggleFileSelection: (tabId, filePath) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              const isSelected = tab.selectedFiles.includes(filePath);
              if (isSelected) {
                tab.selectedFiles = tab.selectedFiles.filter((f) => f !== filePath);
              } else {
                tab.selectedFiles.push(filePath);
              }
              tab.lastActivity = new Date();
            }
          });
        },

        selectFile: (tabId, filePath) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              if (!tab.selectedFiles.includes(filePath)) {
                tab.selectedFiles = [filePath];
              }
              tab.lastActivity = new Date();
            }
          });
        },

        addFileToSelection: (tabId, filePath) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab && !tab.selectedFiles.includes(filePath)) {
              tab.selectedFiles.push(filePath);
              tab.lastActivity = new Date();
            }
          });
        },

        addFilesToSelection: (tabId, filePaths) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              filePaths.forEach((filePath) => {
                if (!tab.selectedFiles.includes(filePath)) {
                  tab.selectedFiles.push(filePath);
                }
              });
              tab.lastActivity = new Date();
            }
          });
        },

        removeFileFromSelection: (tabId, filePath) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.selectedFiles = tab.selectedFiles.filter((f) => f !== filePath);
              tab.lastActivity = new Date();
            }
          });
        },

        removeFilesFromSelection: (tabId, filePaths) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.selectedFiles = tab.selectedFiles.filter((f) => !filePaths.includes(f));
              tab.lastActivity = new Date();
            }
          });
        },

        selectAllFiles: (tabId, files) => {
          get().setSelectedFiles(tabId, files);
        },

        clearSelection: (tabId) => {
          get().setSelectedFiles(tabId, []);
        },

        setViewMode: (tabId, mode) => {
          get().updateTab(tabId, { viewMode: mode });
        },

        setSorting: (tabId, sortBy, sortOrder) => {
          get().updateTab(tabId, { sortBy, sortOrder });
        },

        setFilter: (tabId, query) => {
          get().updateTab(tabId, { filterQuery: query });
        },

        setScrollPosition: (tabId, position) => {
          get().updateTab(tabId, { scrollPosition: position });
        },

        // Editor state
        setEditorContent: (tabId, content) => {
          get().updateTab(tabId, { editorContent: content });
        },

        setEditorLanguage: (tabId, language) => {
          get().updateTab(tabId, { editorLanguage: language });
        },

        setCursorPosition: (tabId, line, column) => {
          get().updateTab(tabId, { cursorPosition: { line, column } });
        },

        // Transfer management
        addTransfer: (tabId, transferId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab && !tab.activeTransfers.includes(transferId)) {
              tab.activeTransfers.push(transferId);
            }
          });
        },

        removeTransfer: (tabId, transferId) => {
          set((state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              tab.activeTransfers = tab.activeTransfers.filter((id) => id !== transferId);
            }
          });
        },

        // Utility functions
        getTabById: (tabId) => {
          if (!tabId) return undefined;

          // Find tab by ID
          return get().tabs.find((tab) => tab.id === tabId);
        },

        getActiveTab: () => {
          const activeTabId = get().activeTabId;
          return activeTabId ? get().getTabById(activeTabId) : undefined;
        },

        getTabsBySession: (sessionId) => {
          return get().tabs.filter((tab) => tab.session?.id === sessionId);
        },

        getPinnedTabs: () => {
          return get().tabs.filter((tab) => tab.isPinned);
        },

        getUnpinnedTabs: () => {
          return get().tabs.filter((tab) => !tab.isPinned);
        },

        getTabsWithUnsavedChanges: () => {
          return get().tabs.filter((tab) => tab.isDirty);
        },

        // Session management
        closeSessionTabs: (sessionId) => {
          const sessionTabs = get().getTabsBySession(sessionId);
          sessionTabs.forEach((tab) => {
            if (!tab.isPinned) {
              get().closeTab(tab.id);
            }
          });
        },

        updateSessionInTabs: (session) => {
          set((state) => {
            state.tabs.forEach((tab) => {
              if (tab.session?.id === session.id) {
                tab.session = session;
                // Update title if it's based on session name
                if (tab.title === tab.session?.name || tab.title.startsWith(`${tab.session?.name}`)) {
                  tab.title = session.name;
                }
              }
            });
          });
        },

        // Persistence
        restoreTabs: (tabs) => {
          set((state) => {
            state.tabs = tabs.map((tab, index) => ({
              ...tab,
              index,
              isActive: false,
              isLoading: false,
              activeTransfers: [],
            }));
            state.nextIndex = tabs.length;
            state.activeTabId = tabs.length > 0 ? tabs[0].id : undefined;
          });
        },

        exportTabs: () => {
          return get().tabs;
        },
      })),
      {
        name: "sftp-tabs",
        partialize: (state) => ({
          tabs: state.tabs.map((tab) => ({
            ...tab,
            isActive: false,
            isLoading: false,
            activeTransfers: [],
          })),
        }),
      }
    ),
    {
      name: "tab-store",
    }
  )
);

export default useTabStore;
