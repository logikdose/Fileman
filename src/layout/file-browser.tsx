import { FolderOpen, FolderPlus, X } from "lucide-react";
import useTabStore from "@/stores/tab.store";
import PathBar from "./path-bar";
import ListView from "./file-viewer/list-view";
import useSessionStore from "@/stores/session.store";
import { useEffect, useState } from "react";
import DeleteFilesDialog from "@/dialogs/delete-files.dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Footer from "./footer";
import Bookmarks from "./bookmarks";
import useBookmarkStore from "@/stores/bookmark.store";
import FileInfoDialog from "@/dialogs/file-info.dialog";
import { FileItem } from "@/types/FileItem";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import RenameItemDialog from "@/dialogs/rename-file.dialog";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MorphingText } from "@/components/magicui/morphing-text";


export default function FileBrowser() {
    const tabs = useTabStore((state) => state.tabs);
    const activeTabId = useTabStore((state) => state.activeTabId);
    const setActiveTab = useTabStore((state) => state.setActiveTab);
    const activeTab = useTabStore((state) => state.getTabById(activeTabId));
    const sessions = useSessionStore((state) => state.sessions);

    // State
    const [deleteFiles, setDeleteFiles] = useState<string[]>([]);
    const [infoDialogFile, setInfoDialogFile] = useState<FileItem | null>(null);
    const [renameFile, setRenameFile] = useState<FileItem | null>(null);

    // Handlers
    const showBookmarks = useBookmarkStore((state) => state.showBookmarks);
    const closeTab = useTabStore((state) => state.closeTab);
    const createTab = useTabStore((state) => state.createTab);


    const handleTabClose = (tabId: string) => {
        closeTab(tabId);
    };

    const handleTabCreate = () => {
        // Set session to active tab
        if (sessions.length > 0) {
            const firstSession = sessions[0];
            const newTabId = createTab(firstSession, "/");
            setActiveTab(newTabId);
            useTabStore.getState().navigateToPath(newTabId, firstSession.id, "/");

            return;
        }

        createTab();
    };

    // Shortcuts
    useHotkeys("meta+i", (event) => {
        event.preventDefault();

        // Get selected file
        const selectedFiles = activeTab?.selectedFiles ?? [];
        if (selectedFiles.length === 0) {
            toast.error("No file selected");
            return;
        }

        if (selectedFiles.length > 1) {
            toast.error("Multiple files selected");
            return;
        }

        const fileId = selectedFiles[0];
        const file = activeTab?.files?.find(f => f.path === fileId);
        if (!file) {
            toast.error("File not found");
            return;
        }

        setInfoDialogFile(file);
    });

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

        const container = document.getElementById("tab-bar");
        if (container) {
            container.addEventListener("wheel", handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener("wheel", handleWheel);
            }
        };
    }, []);

    // Window Controls
    const handleMinimize = () => {
        getCurrentWindow().minimize();
    };

    const handleMaximize = () => {
        getCurrentWindow().toggleMaximize();
    };

    const handleClose = () => {
        getCurrentWindow().close();
    };

    // Render
    return (
        <>
            <div className="flex flex-col h-full border rounded-xl">
                {/* Tabs Container */}
                <div className="flex h-12 items-center bg-muted/10 w-full relative">
                    {/* Sidebar Trigger */}
                    <div className="absolute left-0 top-0 h-full w-[56px] flex items-center justify-center bg-gradient-to-r from-background to-transparent rounded-tl-xl">
                        <SidebarTrigger className="ml-0 mr-2 mb-1" />
                    </div>

                    {/* Tabs Scrollable Container */}
                    <div className="flex-1 min-w-0">
                        <div id="tab-bar" className="overflow-x-auto h-12">
                            <div className="flex flex-nowrap h-full items-center" data-tauri-drag-region>
                                {/* Spacing for Sidebar Trigger */}
                                <div className="w-[48px] h-10  flex-shrink-0">

                                </div>

                                {/* Tabs */}
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={
                                            "flex-shrink-0 h-9 px-3 py-1 text-sm text-muted-foreground hover:bg-muted border rounded-md cursor-pointer mr-1"
                                            + (activeTabId === tab.id ? " bg-muted" : " bg-transparent")
                                        }
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {/* Tab Content */}
                                        <div className="flex flex-row items-center justify-center h-full">
                                            <span className="flex items-center mr-2">
                                                <FolderOpen size={14} />
                                            </span>
                                            <span className="mr-2 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                                                {tab.title || "Untitled"}
                                            </span>
                                            <span
                                                className="opacity-50 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();

                                                    // Close tab
                                                    handleTabClose(tab.id);
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                                aria-label={`Close tab ${tab.session?.name || "Untitled"}`}
                                            >
                                                <X size={14} />
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {/* Create Tab Button */}
                                <button
                                    className="flex-shrink-0 h-8 px-2 py-1 text-sm text-muted-foreground bg-muted/40 hover:bg-muted border rounded-md cursor-pointer"
                                    onClick={handleTabCreate}
                                >
                                    <div className="flex flex-row items-center justify-center h-full text-sm">
                                        <span className="flex items-center">
                                            <FolderPlus size={14} />
                                        </span>
                                    </div>
                                </button>

                                {/* Space for window controls */}
                                <div className="w-[80px] h-10 flex-shrink-0">

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Window Controls */}
                    <div className="w-[80px] h-full absolute right-0 top-0 bg-gradient-to-r from-transparent to-background rounded-tr-xl">
                        <div className="flex items-center justify-center h-full gap-1.5">
                            <button
                                className="size-[15px] rounded-lg bg-yellow-600 hover:bg-yellow-300"
                                onClick={handleMinimize}
                            >
                            </button>
                            <button className="size-[15px] rounded-lg bg-green-600 hover:bg-green-300" onClick={handleMaximize}>
                            </button>
                            <button className="size-[15px] rounded-lg bg-red-600 hover:bg-red-300" onClick={handleClose}>
                            </button>
                        </div>
                    </div>
                </div>

                {/* PathBar */}
                <PathBar />

                {/* Bookmarks */}
                {showBookmarks && (
                    <Bookmarks />
                )}

                {/* Tabs */}
                {tabs.length > 0 && (
                    <div className="flex-1 relative overflow-hidden">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={
                                    "absolute inset-0 flex flex-col"
                                    + (activeTabId === tab.id ? " block" : " hidden")
                                }
                            >
                                <ListView
                                    tabId={tab.id}
                                    onDelete={() => {
                                        // Set files to delete
                                        setDeleteFiles(tab.selectedFiles);
                                    }}
                                    onFileInfo={(file) => {
                                        setInfoDialogFile(file);
                                    }}
                                    onRenameFile={(file) => {
                                        setRenameFile(file);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {tabs.length > 0 && (
                    <Footer />
                )}

                {/* No Tab */}
                {tabs.length === 0 && (
                    <div className="relative flex flex-1 w-full flex-col items-center justify-center overflow-hidden bg-background rounded-xl">
                        <MorphingText texts={["Fileman", "SFTP", "Browser", "SSH"]} />
                    </div>
                )}
            </div>

            {/* Delete Files Dialog */}
            {deleteFiles.length > 0 && (
                <DeleteFilesDialog
                    open={deleteFiles.length > 0}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteFiles([]);
                        }
                    }}
                    tabId={activeTabId}
                />
            )}

            {/* File Info Dialog */}
            {infoDialogFile && (
                <FileInfoDialog
                    dialogOpen={!!infoDialogFile}
                    onOpenChange={(open) => {
                        setInfoDialogFile(open ? infoDialogFile : null);
                    }}
                    file={infoDialogFile}
                />
            )}

            {/* Rename Dialog */}
            {renameFile && (
                <RenameItemDialog
                    open={!!renameFile}
                    onOpenChange={(open) => {
                        setRenameFile(open ? renameFile : null);
                    }}
                    sessionId={activeTab?.session?.id}
                    currentPath={activeTab?.filePath}
                    tabId={activeTabId}
                    fileName={renameFile?.name}
                />
            )}
        </>
    );
}