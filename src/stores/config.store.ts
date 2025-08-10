import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ConfigStore {
    listViewSize: "compact" | "comfortable";

    // Clipboard
    showClipboard: boolean;

    // Bookmarks
    showBookmarks: boolean;
    highlightBookmarks: boolean;
    priorityBookmarks: boolean;

    // Methods
    setListViewSize: (size: "compact" | "comfortable") => void;
    setShowClipboard: (show: boolean) => void;
    setShowBookmarks: (show: boolean) => void;
    setHighlightBookmarks: (highlight: boolean) => void;
    setPriorityBookmarks: (priority: boolean) => void;
}

const useConfigStore = create<ConfigStore>()(
    devtools(
        persist(
            immer((set) => ({
                listViewSize: "comfortable", // Default view size
                showBookmarks: true, // Default bookmark visibility
                highlightBookmarks: true, // Default highlight bookmarks
                priorityBookmarks: true, // Default priority bookmarks
                showClipboard: true, // Default clipboard visibility
                setListViewSize: (size) => set({ listViewSize: size }),
                setShowBookmarks: (show) => set({ showBookmarks: show }),
                setHighlightBookmarks: (highlight) => set({ highlightBookmarks: highlight }),
                setPriorityBookmarks: (priority) => set({ priorityBookmarks: priority }),
                setShowClipboard: (show) => set({ showClipboard: show }),
            })),
            {
                name: "configStore",
                partialize: (state) => ({
                    listViewSize: state.listViewSize,
                    showBookmarks: state.showBookmarks,
                    highlightBookmarks: state.highlightBookmarks,
                    priorityBookmarks: state.priorityBookmarks,
                })
            }
        )
    )
)

export default useConfigStore;