import { create } from "zustand";
import CryptoJS from "crypto-js";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { invoke } from "@tauri-apps/api/core";
import ISession from "../models/session.model";
import { ConnectionState } from "../types/ConnectionState";
import { FileItem } from "../types/FileItem";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

interface SessionStore {
  // Sessions state
  sessions: ISession[];
  activeSessions: Map<string, ConnectionState>; // sessionId -> connection state
  selectedSessionId?: string;

  // UI state
  isLoading: boolean;
  error?: string;

  // Session CRUD operations
  addSession: (session: Omit<ISession, "id" | "createdAt" | "updatedAt">) => string | undefined;
  updateSession: (update: ISession) => string | undefined;
  deleteSession: (id: string) => Promise<boolean>;
  duplicateSession: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Session management
  selectSession: (id: string) => void;
  updateSessionStatus: (id: string, status: ISession["status"]) => void;
  updateLastUsed: (id: string) => void;

  // Connection management
  connectToSession: (sessionId: string) => Promise<boolean>;
  disconnectSession: (sessionId: string) => Promise<void>;
  disconnectAllSessions: () => Promise<void>;

  // File operations
  loadDirectory: (sessionId: string, path: string) => Promise<void>;
  downloadFile: (sessionId: string, remotePath: string, localPath: string) => Promise<void>;
  uploadFile: (sessionId: string, localPath: string, remotePath: string) => Promise<void>;
  createDirectory: (sessionId: string, path: string) => Promise<void>;
  deleteItem: (sessionId: string, path: string, isDirectory: boolean) => Promise<void>;
  renameItem: (sessionId: string, oldPath: string, newPath: string) => Promise<void>;
  deleteDirectory: (sessionId: string, path: string) => Promise<void>;
  deleteDirectoryRecursive: (sessionId: string, path: string) => Promise<void>;
  fetchDirectorySize: (sessionId: string, path: string) => Promise<string | null>; // Returns operation ID for tracking

  // Utility functions
  getSessionById: (id: string | undefined) => ISession | undefined;
  getConnectedSessions: () => ISession[];
  getFavoriteSessions: () => ISession[];
  getSessionsByTag: (tag: string) => ISession[];
  searchSessions: (query: string) => ISession[];
  getConnectionId: (sessionId: string) => string | undefined;

  // Cleanup
  clearError: () => void;
  clearAllConnections: () => Promise<void>;
}

function encrypt(text?: string): string | undefined {
  if (!text) return undefined;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(cipher?: string): string | undefined {
  if (!cipher) return undefined;
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return undefined;
  }
}

const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        sessions: [],
        activeSessions: new Map(),
        selectedSessionId: undefined,
        isLoading: false,
        error: undefined,

        // Session CRUD operations
        addSession: (sessionData) => {
          // Check if session with same host and username already exists
          const existingSession = get().sessions.find((s) => s.host === sessionData.host && s.username === sessionData.username && s.port === sessionData.port);

          if (existingSession) {
            set((state) => {
              state.error = `Session with host ${sessionData.host} and username ${sessionData.username} already exists.`;
            });
            return undefined; // Session already exists
          }

          const newSession: ISession = {
            ...sessionData,
            password: encrypt(sessionData.password),
            passphrase: encrypt(sessionData.passphrase),
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "disconnected",
          };

          // Add to sessions
          set((state) => {
            state.sessions.push(newSession);
          });

          return newSession.id; // Session added successfully
        },

        updateSession: (update) => {
          set((state) => {
            const sessionIndex = state.sessions.findIndex((s) => s.id === update.id);
            if (sessionIndex !== -1) {
              const updatedSession = {
                id: update.id,
                name: update.name,
                host: update.host,
                port: update.port,
                username: update.username,
                password: update.password ? encrypt(update.password) : undefined,
                privateKeyPath: update.privateKeyPath ? update.privateKeyPath : undefined,
                passphrase: update.passphrase ? encrypt(update.passphrase) : undefined,
                createdAt: state.sessions[sessionIndex].createdAt,
                lastUsedAt: state.sessions[sessionIndex].lastUsedAt,
                updatedAt: new Date(),
              } as ISession;
              state.sessions[sessionIndex] = updatedSession;
            }
          });

          // Return the updated session ID
          const updatedSession = get().getSessionById(update.id);
          if (updatedSession) {
            return updatedSession.id;
          } else {
            console.warn(`Session with ID ${update.id} not found.`);
            set((state) => {
              state.error = `Session with ID ${update.id} not found.`;
            });
            return undefined; // Session not found
          }
        },

        deleteSession: async (id) => {
          try {
            const session = get().sessions.find((s) => s.id === id);

            // Disconnect if connected
            if (session?.status === "connected") {
              try {
                const connectionState = get().activeSessions.get(id);
                if (connectionState?.connectionId) {
                  await invoke("disconnect_sftp", {
                    connectionId: connectionState.connectionId,
                  });
                }
              } catch (error) {
                console.error("Error disconnecting session:", error);
                set((state) => {
                  state.error = `Failed to disconnect session: ${error}`;
                });
              }
            }

            // Remove from sessions and active connections
            set((state) => {
              state.sessions = state.sessions.filter((s) => s.id !== id);
              state.activeSessions.delete(id);

              // Clear selection if this session was selected
              if (state.selectedSessionId === id) {
                state.selectedSessionId = undefined;
              }
            });

            console.log("Session deleted successfully:", id);
            return true; // Indicate success
          } catch (error) {
            console.error("Error deleting session:", error);
            set((state) => {
              state.error = `Failed to delete session: ${error}`;
            });
            return false; // Indicate failure
          }
        },

        duplicateSession: (id) => {
          set((state) => {
            const session = state.sessions.find((s) => s.id === id);
            if (session) {
              const duplicatedSession: ISession = {
                ...session,
                id: crypto.randomUUID(),
                name: `${session.name} (Copy)`,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "disconnected",
                lastUsedAt: undefined,
              };
              state.sessions.push(duplicatedSession);
            }
          });
        },

        toggleFavorite: (id) => {
          set((state) => {
            const session = state.sessions.find((s) => s.id === id);
            if (session) {
              session.isFavorite = !session.isFavorite;
              session.updatedAt = new Date();
            }
          });
        },

        // Session management
        selectSession: (id) => {
          set((state) => {
            state.selectedSessionId = id;
          });
        },

        updateSessionStatus: (id, status) => {
          set((state) => {
            const session = state.sessions.find((s) => s.id === id);
            if (session) {
              session.status = status;
              session.updatedAt = new Date();
            }
          });
        },

        updateLastUsed: (id) => {
          set((state) => {
            const session = state.sessions.find((s) => s.id === id);
            if (session) {
              session.lastUsedAt = new Date();
              session.updatedAt = new Date();
            }
          });
        },

        // Connection management
        connectToSession: async (sessionId) => {
          const session = get().getSessionById(sessionId);
          if (!session) {
            set((state) => {
              state.error = "Session not found";
            });
            return false;
          }

          set((state) => {
            state.isLoading = true;
            state.error = undefined;
          });

          try {
            // Update status to connecting
            get().updateSessionStatus(sessionId, "connecting");

            // Decrypt password and passphrase before sending to backend
            const decryptedPassword = decrypt(session.password);
            const decryptedPassphrase = decrypt(session.passphrase);

            // Call Rust backend to connect
            const connectionId = await invoke("connect_sftp", {
              config: {
                host: session.host,
                port: session.port,
                username: session.username,
                password: decryptedPassword,
                private_key_path: session.privateKeyPath,
                passphrase: decryptedPassphrase,
              },
            });

            // Create connection state
            const connectionState: ConnectionState = {
              connectionId: connectionId as string,
              currentPath: "/",
              files: [],
              isLoading: false,
            };

            set((state) => {
              state.activeSessions.set(sessionId, connectionState);
              state.isLoading = false;
            });

            // Update session status and last used
            get().updateSessionStatus(sessionId, "connected");
            get().updateLastUsed(sessionId);

            // Load initial directory
            await get().loadDirectory(sessionId, "/");

            return true; // Connection successful
          } catch (error) {
            console.error("Connection failed:", error);
            set((state) => {
              state.error = `Connection failed: ${error}`;
              state.isLoading = false;
            });
            get().updateSessionStatus(sessionId, "disconnected");

            return false; // Connection failed
          }
        },

        disconnectSession: async (sessionId) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) return;

          try {
            await invoke("disconnect_sftp", {
              connectionId: connectionState.connectionId,
            });

            set((state) => {
              state.activeSessions.delete(sessionId);
            });

            get().updateSessionStatus(sessionId, "disconnected");
          } catch (error) {
            console.error("Disconnect failed:", error);
            set((state) => {
              state.error = `Disconnect failed: ${error}`;
            });
          }
        },

        disconnectAllSessions: async () => {
          const sessions = Array.from(get().sessions);
          for (const session of sessions) {
            await get().disconnectSession(session.id);
            get().updateSessionStatus(session.id, "disconnected");
          }

          set((state) => {
            state.activeSessions.clear();
            state.selectedSessionId = undefined;
          });
          console.log("All sessions disconnected");
        },

        // File operations
        loadDirectory: async (sessionId, path) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          set((state) => {
            const connState = state.activeSessions.get(sessionId);
            if (connState) {
              connState.isLoading = true;
              connState.error = undefined;
            }
          });

          try {
            const files = (await invoke("list_directory", {
              connectionId: connectionState.connectionId,
              path: path,
            })) as FileItem[];

            set((state) => {
              const connState = state.activeSessions.get(sessionId);
              if (connState) {
                connState.files = files;
                connState.currentPath = path;
                connState.isLoading = false;
              }
            });
          } catch (error) {
            console.error("Failed to load directory:", error);
            set((state) => {
              const connState = state.activeSessions.get(sessionId);
              if (connState) {
                connState.error = `Failed to load directory: ${error}`;
                connState.isLoading = false;
              }
            });
          }
        },

        downloadFile: async (sessionId, remotePath, localPath) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("download_file", {
              connectionId: connectionState.connectionId,
              remotePath,
              localPath,
            });
          } catch (error) {
            console.error("Download failed:", error);
            throw error;
          }
        },

        uploadFile: async (sessionId, localPath, remotePath) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("upload_file", {
              connectionId: connectionState.connectionId,
              localPath,
              remotePath,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Upload failed:", error);
            throw error;
          }
        },

        createDirectory: async (sessionId, path) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("create_directory", {
              connectionId: connectionState.connectionId,
              path,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Create directory failed:", error);
            throw error;
          }
        },

        deleteItem: async (sessionId, path, isDirectory) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("delete_item", {
              connectionId: connectionState.connectionId,
              path,
              isDirectory,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Delete failed:", error);
            throw error;
          }
        },

        renameItem: async (sessionId, oldPath, newPath) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("rename_item", {
              connectionId: connectionState.connectionId,
              oldPath,
              newPath,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Rename failed:", error);
            throw error;
          }
        },

        deleteDirectory: async (sessionId, path) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("delete_directory", {
              connectionId: connectionState.connectionId,
              path,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Delete failed:", error);
            throw error;
          }
        },

        deleteDirectoryRecursive: async (sessionId, path) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            throw new Error("No active connection");
          }

          try {
            await invoke("delete_directory_recursive", {
              connectionId: connectionState.connectionId,
              path,
            });

            // Refresh current directory
            await get().loadDirectory(sessionId, connectionState.currentPath);
          } catch (error) {
            console.error("Delete failed:", error);
            throw error;
          }
        },

        fetchDirectorySize: async (sessionId: string, path: string) => {
          const connectionState = get().activeSessions.get(sessionId);
          if (!connectionState?.connectionId) {
            console.log("No active connection for fetching directory size");
            return null;
          }

          try {
            const operationId = await invoke<string>("fetch_directory_size", {
              connectionId: connectionState.connectionId,
              path,
            });
            return operationId;
          } catch (error) {
            console.error("Fetch directory size failed:", error);
            return null;
          }
        },

        // Utility functions
        getSessionById: (id) => {
          if (!id) return undefined;
          return get().sessions.find((session) => session.id === id);
        },

        getConnectedSessions: () => {
          return get().sessions.filter((session) => session.status === "connected");
        },

        getFavoriteSessions: () => {
          return get().sessions.filter((session) => session.isFavorite);
        },

        getSessionsByTag: (tag) => {
          return get().sessions.filter((session) => session.tags?.includes(tag));
        },

        searchSessions: (query) => {
          const lowercaseQuery = query.toLowerCase();
          return get().sessions.filter(
            (session) => session.name.toLowerCase().includes(lowercaseQuery) || session.host.toLowerCase().includes(lowercaseQuery) || session.username.toLowerCase().includes(lowercaseQuery) || session.notes?.toLowerCase().includes(lowercaseQuery) || session.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
          );
        },

        getConnectionId: (sessionId) => {
          const connectionState = get().activeSessions.get(sessionId);
          return connectionState?.connectionId;
        },

        // Cleanup
        clearError: () => {
          set((state) => {
            state.error = undefined;
          });
        },

        clearAllConnections: async () => {
          const activeSessions = Array.from(get().activeSessions.keys());

          for (const sessionId of activeSessions) {
            try {
              await get().disconnectSession(sessionId);
            } catch (error) {
              console.error(`Failed to disconnect session ${sessionId}:`, error);
            }
          }
        },
      })),
      {
        name: "sftp-sessions", // Storage key
        partialize: (state) => ({
          sessions: state.sessions,
          selectedSessionId: state.selectedSessionId,
        }), // Only persist sessions and selection, not connection states
      }
    ),
    {
      name: "session-store", // DevTools name
    }
  )
);

export default useSessionStore;
