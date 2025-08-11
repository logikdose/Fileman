import IClipboardItem from "@/models/clipboarditem.model";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import useSessionStore from "./session.store";
import { invoke } from "@tauri-apps/api/core";

interface ClipboardStore {
    items: IClipboardItem[];

    // Actions
    addItem: (item: IClipboardItem) => void;
    removeItem: (id: string) => void;
    clear: () => void;
    clearSession: (sessionId: string) => void;

    paste: (sessionId: string, path: string) => void;
}

const useClipboardStore = create<ClipboardStore>()(
    devtools(
        persist(
            immer((set, get) => ({
                items: [],
                addItem: (item) => set((state) => {
                    state.items.push(item);

                    // If max limit is reached, remove the oldest item
                    if (state.items.length > 100) {
                        state.items.shift();
                    }
                }),
                removeItem: (id) => set((state) => {
                    state.items = state.items.filter(item => item.id !== id);
                }),
                clear: () => set((state) => {
                    state.items = [];
                }),
                clearSession: (sessionId) => set((state) => {
                    state.items = state.items.filter(item => item.sessionId !== sessionId);
                }),

                paste: async (sessionId, path) => {
                    const items = get().items.filter(item => item.sessionId === sessionId);
                    if (items.length < 1) {
                        return;
                    }

                    const connectionId = useSessionStore.getState().getConnectionId(sessionId);

                    for (const item of items) {
                        // If item is error or success
                        if (item.status === "error" || item.status === "success") {
                            continue;
                        }

                        if (item.action === "cut") {
                            try {
                                const dest_path = path.endsWith("/") ? `${path}${item.file.name}` : `${path}/${item.file.name}`;
                                const data = {
                                    connectionId: connectionId,
                                    sourcePath: item.file.path,
                                    destPath: dest_path,
                                }

                                await invoke("move_item", data);

                                // Update the status of the current item
                                set((state) => {
                                    state.items = state.items.map(i =>
                                        i.id === item.id ? { ...i, status: "success" } : i
                                    );
                                });
                            } catch (error) {
                                console.error("Error pasting file:", error);

                                // Update the status of the current item to error
                                set((state) => {
                                    state.items = state.items.map(i =>
                                        i.id === item.id ? { ...i, status: "error" } : i
                                    );
                                });
                            }
                        }

                        if (item.action === "copy") {
                            try {
                                const dest_path = path.endsWith("/") ? `${path}${item.file.name}` : `${path}/${item.file.name}`;
                                const data = {
                                    connectionId: connectionId,
                                    sourcePath: item.file.path,
                                    destPath: dest_path,
                                    isDirectory: item.file.is_directory,
                                }

                                await invoke("copy_item", data);

                                // Update the status of the current item
                                set((state) => {
                                    state.items = state.items.map(i =>
                                        i.id === item.id ? { ...i, status: "success" } : i
                                    );
                                });
                            } catch (error) {
                                console.error("Error pasting file:", error);

                                // Update the status of the current item to error
                                set((state) => {
                                    state.items = state.items.map(i =>
                                        i.id === item.id ? { ...i, status: "error" } : i
                                    );
                                });
                            }
                        }
                    }
                },
            })), {
            name: "clipboard",
            partialize: (state) => ({
                items: state.items,
            }),
        }
        ),
    ),
);

export default useClipboardStore;
