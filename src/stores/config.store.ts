import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ConfigStore {
    listViewSize: "compact" | "comfortable";
    listViewCheckbox: boolean;

    // Downloads
    downloadsPath: string | null;
    setDownloadsPath: (value: string | null) => void;

    // Auto-clear success notifications
    autoClearSuccessNotifications: boolean;

    // Clipboard
    showClipboard: boolean;

    // Bookmarks
    showBookmarks: boolean;
    highlightBookmarks: boolean;
    priorityBookmarks: boolean;

    // Methods
    setListViewSize: (size: "compact" | "comfortable") => void;
    setListViewCheckbox: (checked: boolean) => void;
    setAutoClearSuccessNotifications: (autoClear: boolean) => void;
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
                listViewCheckbox: true, // Default list view checkbox
                downloadsPath: null, // Default downloads path
                showBookmarks: true, // Default bookmark visibility
                highlightBookmarks: true, // Default highlight bookmarks
                priorityBookmarks: true, // Default priority bookmarks
                showClipboard: true, // Default clipboard visibility
                autoClearSuccessNotifications: true, // Default auto-clear success notifications
                setListViewSize: (size) => set({ listViewSize: size }),
                setListViewCheckbox: (checked) => set({ listViewCheckbox: checked }),
                setDownloadsPath: (path) => set({ downloadsPath: path }),
                setAutoClearSuccessNotifications: (autoClear) => set({ autoClearSuccessNotifications: autoClear }),
                setShowBookmarks: (show) => set({ showBookmarks: show }),
                setHighlightBookmarks: (highlight) => set({ highlightBookmarks: highlight }),
                setPriorityBookmarks: (priority) => set({ priorityBookmarks: priority }),
                setShowClipboard: (show) => set({ showClipboard: show }),
            })),
            {
                name: "configStore",
                partialize: (state) => ({
                    listViewSize: state.listViewSize,
                    listViewCheckbox: state.listViewCheckbox,
                    downloadsPath: state.downloadsPath,
                    showClipboard: state.showClipboard,
                    showBookmarks: state.showBookmarks,
                    highlightBookmarks: state.highlightBookmarks,
                    priorityBookmarks: state.priorityBookmarks,
                    autoClearSuccessNotifications: state.autoClearSuccessNotifications,
                })
            }
        )
    )
)

export default useConfigStore;