import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { ArrowLeft, ArrowRight, Download, EllipsisIcon, FolderPlus, FolderUp, Loader2, RefreshCcw, UploadCloud } from "lucide-react";
import { useState } from "react";
import CreateFolderDialog from "@/dialogs/create-folder.dialog";
import { toast } from "sonner";
import { open } from "@tauri-apps/plugin-dialog";
import ProcessPanel from "@/components/process-panel";
import DownloadsSetDialog from "@/dialogs/downloads-set.dialog";
import { SettingsDialog } from "@/dialogs/settings.dialog";
import CreateBookmarkDialog from "@/dialogs/create-bookmark.dialog";
import { useHotkeys } from 'react-hotkeys-hook';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useProcessStore from "@/stores/process.store";

export default function PathBar() {
    // Menu and Dialogs
    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const [createFolderDialog, setCreateFolderDialog] = useState(false);
    const [downloadsSetDialog, setDownloadsSetDialog] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [createBookmarkDialogOpen, setCreateBookmarkDialogOpen] = useState(false);

    // Store hooks
    const downloadsPath = useProcessStore((state) => state.downloadPath);
    const tabId = useTabStore((state) => state.activeTabId);
    const tab = useTabStore((state) => state.getTabById(tabId));
    const session = useSessionStore((state) => state.getSessionById(tab?.session?.id));
    const navigateToPath = useTabStore((state) => state.navigateToPath);
    const setFilePath = useTabStore((state) => state.setFilePath);
    const goBackPath = useTabStore((state) => state.goBack);
    const goForwardPath = useTabStore((state) => state.goForward);
    const goUpPath = useTabStore((state) => state.goUp);
    const canGoBack = useTabStore((state) => state.canGoBack);
    const canGoForward = useTabStore((state) => state.canGoForward);
    const uploadFile = useSessionStore((state) => state.uploadFile);
    const downloadFile = useSessionStore((state) => state.downloadFile);
    const closeTab = useTabStore((state) => state.closeTab);

    // Handlers
    const handlePathChange = async (newPath: string) => {
        if (!tabId || !newPath) {
            return;
        }

        // Update file path in store
        setFilePath(tabId, newPath);
    };

    const handleUpload = async () => {
        let selected: string | null = null;

        try {
            selected = await open({
                multiple: false, // Set to true if you want to allow multiple file selection
                title: "Select a file to upload",
                directory: false, // Set to true if you want to allow directory selection
            });

            if (!selected) {
                return;
            }

            // If selected is not a string, it's an array
            if (Array.isArray(selected)) {
                toast.error("Multiple files selected. Please select a single file.");
                return;
            }

            console.log("Selected file for upload:", selected);
        } catch (error) {
            console.error("Error opening file dialog:", error);
            toast.error("Failed to open file dialog");
            return;
        }

        try {
            // If session is not connected, show error
            if (!session || session.status !== 'connected') {
                toast.error("Session is not connected");
                return;
            }

            // If no filePath, don't upload
            if (!tab?.filePath) {
                toast.error("No file path specified");
                return;
            }

            // Validate selected file
            if (!selected || typeof selected !== 'string') {
                toast.error("Invalid file selected");
                return;
            }

            // Start uploading
            if (!session.id) {
                toast.error("No session ID found");
                return;
            }

            // Fix windows paths
            const fixedPath = selected.replace(/\\/g, "/");

            // Filename
            const fileName = fixedPath.split("/").pop();
            console.log("File name:", fileName);
            if (!fileName) {
                toast.error("Invalid file name");
                return;
            }

            const path = tab.filePath.endsWith("/") ? tab.filePath : `${tab.filePath}/`;
            console.log("Uploading file:", selected, "to path:", path + fileName);
            uploadFile(session.id, selected, path + fileName);
            toast.success("File uploaded queued");
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file");
        }
    }

    const handleDownload = async () => {
        if (!session || session.status !== 'connected') {
            toast.error("Session is not connected");
            return;
        }

        if (!tab || tab.selectedFiles.length === 0) {
            toast.error("No files selected for download");
            return;
        }

        if (tab.selectedFiles.length > 1) {
            toast.error("Please select only one file to download");
            return;
        }

        const filePath = tab.selectedFiles[0];
        const file = tab.files?.find(f => f.path === filePath);

        if (!file) {
            toast.error("Selected file not found");
            return;
        }

        if (file.is_directory) {
            toast.error("Cannot download directories. Please select a file.");
            return;
        }

        // Fetch `Downloads` directory path from process store
        console.log("Downloads path:", downloadsPath);
        if (!downloadsPath || downloadsPath === "") {
            setDownloadsSetDialog(true);
            return;
        }

        try {
            // Start downloading
            downloadFile(session.id, file.path, downloadsPath + "/" + file.name);
            toast.success("File download queued");
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Failed to download file");
        }
    }

    const closeActiveTab = () => {
        if (!tabId) return;
        closeTab(tabId);
    }

    // Hotkeys
    useHotkeys("meta+d, ctrl+d", (e) => {
        e.preventDefault();
        handleDownload();
    });
    useHotkeys("meta+u, ctrl+u", (e) => {
        e.preventDefault();
        handleUpload();
    });
    useHotkeys("meta+n, ctrl+n", (e) => {
        e.preventDefault();
        setCreateFolderDialog(true);
    });
    useHotkeys("meta+b, ctrl+b", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCreateBookmarkDialogOpen(true);
    });
    useHotkeys("meta+w, ctrl+w", (e) => {
        e.preventDefault();
        closeActiveTab();
    });

    // Render
    return (
        <div className="flex items-center gap-2 p-2 bg-background border-b border-t h-12">
            {/* Left Actions */}
            <div className="inline-flex -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
                <Button
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    size="iconSm"
                    aria-label="Flip Horizontal"
                    disabled={!session || session.status !== 'connected' || !canGoBack}
                    onClick={() => {
                        if (!tabId) {
                            return;
                        }
                        goBackPath(tabId);
                    }}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                </Button>
                <Button
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    size="iconSm"
                    aria-label="Flip Horizontal"
                    disabled={!session || session.status !== 'connected' || !canGoForward}
                    onClick={() => {
                        if (!tabId) {
                            return;
                        }
                        goForwardPath(tabId);
                    }}
                >
                    <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    size="iconSm"
                    aria-label="Flip Vertical"
                    onClick={() => {
                        if (!tabId || !session || session.status !== 'connected') {
                            toast.error("No session connected");
                            return;
                        }
                        goUpPath(tabId);
                    }}
                    disabled={!session || session.status !== 'connected'}
                >
                    <FolderUp size={16} aria-hidden="true" />
                </Button>
            </div>

            <div className="inline-flex -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
                <Button
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    size="iconSm"
                    aria-label="Flip Vertical"
                    onClick={() => {
                        if (!tabId || !tab || !tab.filePath) {
                            toast.error("No file path specified");
                            return;
                        }

                        // Refresh the current path
                        navigateToPath(tabId, session?.id, tab.filePath);
                    }}
                    disabled={!session || session.status !== 'connected'}
                >
                    <RefreshCcw size={16} aria-hidden="true" />
                </Button>
            </div>

            {/* Path Input */}
            <div className="flex-1 relative">
                <Input
                    size="sm"
                    type="text"
                    value={tab?.filePath}
                    onChange={(e) => {
                        const newPath = e.target.value;
                        handlePathChange(newPath);
                    }}
                    className="w-full p-2 bg-muted text-muted-foreground rounded-md"
                    placeholder="Enter path..."
                    disabled={session?.status !== 'connected' || tab?.isLoading}
                    onKeyDown={(e) => {
                        if (!tabId) {
                            return;
                        }

                        if (e.key === "Enter") {
                            e.preventDefault();
                            const newPath = e.currentTarget.value.trim();
                            if (newPath) {
                                handlePathChange(newPath);
                                navigateToPath(tabId, session?.id, newPath);
                            }
                        }
                    }}
                />

                {/* Loading */}
                {tab?.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/10">
                        <Loader2 className="animate-spin text-muted-foreground w-4 h-4" />
                    </div>
                )}

                {/* Connect Button */}
                <div className="absolute top-1/2 -translate-y-1/2 end-1 flex flex-row items-center gap-1">
                    {session?.status === 'disconnected' && (
                        <Button
                            className="text-green-500 rounded-2xl "
                            variant="outline"
                            size="xsm"
                            onClick={() => {
                                useSessionStore.getState().connectToSession(session.id);
                            }}
                        >
                            Connect
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Actions */}
            <div className="inline-flex -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
                <Button
                    size="sm"
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    disabled={!tab?.session || tab.selectedFiles.length !== 1 || tab?.files?.find(f => f.path === tab.selectedFiles[0])?.is_directory}
                    onClick={() => {
                        handleDownload();
                    }}
                >
                    <Download className="-ms-1 opacity-60" size={16} aria-hidden="true" />
                    Download
                </Button>
                <Button
                    size="sm"
                    className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                    variant="outline"
                    disabled={!session || session.status !== 'connected'}
                    onClick={() => {
                        handleUpload();
                    }}
                >
                    <UploadCloud className="-ms-1 opacity-60" size={16} aria-hidden="true" />
                    Upload
                </Button>
                <DropdownMenu open={fileMenuOpen} onOpenChange={setFileMenuOpen} modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="iconSm"
                            className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
                            variant="outline"
                            aria-label="Menu"
                            disabled={!session || session.status !== 'connected'}
                            onClick={() => {
                                setFileMenuOpen(true);
                            }}
                        >
                            <EllipsisIcon size={16} aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => {
                                    // Handle create folder action
                                    setCreateFolderDialog(true);
                                }}
                            >
                                <FolderPlus size={16} className="opacity-60" aria-hidden="true" />
                                <span>New Folder</span>
                                <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => {
                                    // Handle create bookmark action
                                    setCreateBookmarkDialogOpen(true);
                                }}
                            >
                                <FolderPlus size={16} className="opacity-60" aria-hidden="true" />
                                <span>Bookmark</span>
                                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Dialogs/Menus */}
            <ProcessPanel />

            <CreateFolderDialog
                sessionId={tab?.session?.id}
                currentPath={tab?.filePath}
                tabId={tabId}
                open={createFolderDialog}
                onOpenChange={setCreateFolderDialog}
            />

            <DownloadsSetDialog
                dialogOpen={downloadsSetDialog}
                onOpenChange={setDownloadsSetDialog}
                sessionId={tab?.session?.id}
                currentPath={tab?.filePath}
                tabId={tabId}
            />

            <SettingsDialog
                dialogOpen={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
            />

            {tab?.session && (
                <CreateBookmarkDialog
                    open={createBookmarkDialogOpen}
                    onOpenChange={() => {
                        // Close the dialog
                        setCreateBookmarkDialogOpen(false);
                    }}
                    title={tab?.title}
                    path={tab?.filePath || "/"}
                    sessionId={tab?.session?.id}
                />
            )}
        </div>
    );

}