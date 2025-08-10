import IBookmark from "@/models/bookmark.model";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface BookmarkStore {
    bookmarks: IBookmark[];
    addBookmark(name: string, path: string, sessionId: string): void;
    removeBookmark(id: string): void;
    getBookmarks(): IBookmark[];
    getBookmarksBySession(sessionId: string): IBookmark[];
    updateBookmark(id: string, updatedBookmark: Partial<IBookmark>): void;
}

const useBookmarkStore = create<BookmarkStore>()(
    devtools(
        persist(
            immer((set, get) => ({
                showBookmarks: true, // Default value for showing bookmarks
                highlightBookmarks: true, // Default value for highlighting bookmarks
                priorityBookmarks: true, // Default value for prioritizing bookmarks

                // Initial bookmarks array
                bookmarks: [],

                addBookmark: (name: string, path: string, sessionId: string) => {
                    const bookmarkId = crypto.randomUUID();
                    const bookmark = {
                        id: bookmarkId,
                        name,
                        path,
                        sessionId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } as IBookmark;

                    set(state => {
                        state.bookmarks.push(bookmark);
                    });
                },
                removeBookmark: (id: string) => {
                    set(state => {
                        state.bookmarks = state.bookmarks.filter(b => b.id !== id);
                    });
                },
                getBookmarks: () => {
                    return get().bookmarks;
                },
                getBookmarksBySession: (sessionId: string) => {
                    return get().bookmarks.filter(b => b.sessionId === sessionId);
                },
                updateBookmark: (id: string, updatedBookmark: Partial<IBookmark>) => {
                    set(state => {
                        const index = state.bookmarks.findIndex(b => b.id === id);
                        if (index !== -1) {
                            state.bookmarks[index] = {
                                ...state.bookmarks[index],
                                ...updatedBookmark,
                                updatedAt: new Date(),
                            };
                        }
                    });
                }
            })
            ),
            {
                name: "bookmark-store",
                partialize: (state) => ({
                    bookmarks: state.bookmarks,
                }),
            }
        )
    )
);

export default useBookmarkStore;