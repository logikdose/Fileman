import { Button } from "@/components/ui/button";
import DeleteBookmarkDialog from "@/dialogs/delete-bookmark.dialog";
import useBookmarkStore from "@/stores/bookmark.store";
import useConfigStore from "@/stores/config.store";
import useTabStore from "@/stores/tab.store";
import { Folder } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Bookmarks() {
    // State
    const [deleteBookmarkId, setDeleteBookmarkId] = useState<string | null>(null);

    // Hooks
    const highlightBookmarks = useConfigStore((state) => state.highlightBookmarks);
    const priorityBookmarks = useConfigStore((state) => state.priorityBookmarks);
    const bookmarks = useBookmarkStore((state) => state.bookmarks);
    const activeTabId = useTabStore((state) => state.activeTabId);
    const activeTab = useTabStore((state) => state.getTabById(activeTabId));
    const navigateToPath = useTabStore((state) => state.navigateToPath);
    const createTab = useTabStore((state) => state.createTab);

    const openBookmark = (bookmarkId: string) => {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) {
            toast.error("Bookmark not found.");
            return;
        }

        let tabId = activeTabId;
        if (!activeTabId) {
            tabId = createTab(bookmark?.sessionId, bookmark?.path);
        }

        // Navigate to the bookmark's path in the active tab
        navigateToPath(tabId!, bookmark.sessionId, bookmark.path);
    }

    // Sort bookmarks based on priority and session matching
    const sortedBookmarks = useMemo(() => {
        if (!priorityBookmarks || !activeTab?.session?.id) {
            return bookmarks;
        }

        return [...bookmarks].sort((a, b) => {
            const aIsActiveSession = a.sessionId === activeTab?.session?.id;
            const bIsActiveSession = b.sessionId === activeTab?.session?.id;

            // Sort same session bookmarks first
            if (aIsActiveSession && !bIsActiveSession) return -1;
            if (!aIsActiveSession && bIsActiveSession) return 1;

            // If both are same session or both are different sessions, maintain original order
            return 0;
        });
    }, [bookmarks, priorityBookmarks, activeTab?.session?.id]);

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault(); // Always prevent default scrolling

            const target = event.currentTarget as HTMLElement;

            // Convert vertical scroll (deltaY) to horizontal scroll
            // Use deltaY as the primary scroll input, fall back to deltaX if available
            const scrollAmount = event.deltaY !== 0 ? event.deltaY : event.deltaX;

            // Apply the scroll horizontally
            target.scrollLeft += scrollAmount;
        };

        const container = document.getElementById("bookmarks");
        if (container) {
            container.addEventListener("wheel", handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener("wheel", handleWheel);
            }
        };
    }, []);

    // Render
    return (
        <>
            <div className="flex w-full flex-row items-center justify-center h-12 bg-muted/10 text-muted-foreground border-b">
                <div id="bookmarks" className="w-full overflow-x-auto overflow-y-hidden pl-2">
                    <div className="flex flex-row items-center min-w-max">
                        {/* Bookmarks */}
                        {sortedBookmarks.map(bookmark => (
                            <Button
                                key={bookmark.id}
                                size="sm"
                                variant="outline"
                                className={
                                    "mr-2 flex-shrink-0"
                                    + ((highlightBookmarks && bookmark.sessionId === activeTab?.session?.id) ? " bg-muted/50 border-blue-500/20 text-blue-500" : "")
                                }
                                onClick={() => openBookmark(bookmark.id)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setDeleteBookmarkId(bookmark.id);
                                }}
                                aria-label={`Open bookmark: ${bookmark.name}`}
                            >
                                <Folder size={16} className="opacity-80" />
                                <span className="text-xsm font-normal">{bookmark.name}</span>
                            </Button>
                        ))}

                        {/* No Bookmarks */}
                        {bookmarks.length === 0 && (
                            <span className="text-muted-foreground text-sm font-normal opacity-40 px-2">No bookmarks</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Bookmarks */}
            {deleteBookmarkId && (
                <DeleteBookmarkDialog
                    dialogOpen={!!deleteBookmarkId}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteBookmarkId(null);
                        }
                    }}
                    bookmarkId={deleteBookmarkId}
                    bookmarkName={bookmarks.find(b => b.id === deleteBookmarkId)?.name || "Bookmark"}
                />
            )}
        </>
    )
}