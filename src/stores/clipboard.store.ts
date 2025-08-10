import IClipboardItem from "@/models/clipboarditem.model";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand";

interface ClipboardStore {
    items: IClipboardItem[];

    // Actions
    addItem: (item: IClipboardItem) => void;
    removeItem: (id: string) => void;
    clear: () => void;
    clearSession: (sessionId: string) => void;
}

const useClipboardStore = create<ClipboardStore>()(
    devtools(
        persist(
            immer((set) => ({
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
