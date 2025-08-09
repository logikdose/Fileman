import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu";
import useProcessStore from "@/stores/process.store";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { FileItem } from "@/types/FileItem";
import { bytesSizeToString, getIconForFileType } from "@/utils/file.util";
import { Download, FormInput, Info, Rows3, TrashIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
    tabId: string;
    onDelete: () => void;
    onFileInfo: (file: FileItem) => void;
    onRenameFile: (file: FileItem) => void;
}

export default function ListView({ tabId, onDelete, onFileInfo, onRenameFile }: Props) {
    // Store hooks
    const downloadsPath = useProcessStore((state) => state.downloadPath);
    const tab = useTabStore((state) => state.getTabById(tabId));
    const tabSession = useSessionStore((state) => state.getSessionById(tab?.session?.id));
    const navigateToPath = useTabStore((state) => state.navigateToPath);
    const selectFile = useTabStore((state) => state.selectFile);
    const addFileToSelection = useTabStore((state) => state.addFileToSelection);
    const removeFileFromSelection = useTabStore((state) => state.removeFileFromSelection);
    const addFilesToSelection = useTabStore((state) => state.addFilesToSelection);
    const clearSelection = useTabStore((state) => state.clearSelection);
    const downloadFile = useSessionStore((state) => state.downloadFile);

    // Handlers
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>, filePath: string) => {
        e.stopPropagation();
        e.preventDefault();

        navigateToPath(tabId, tabSession?.id, filePath);
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, filePath: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (!tab) return;

        // If holding Ctrl or Cmd, toggle selection
        if (e.ctrlKey || e.metaKey) {
            // If the file is already selected, remove it from selection
            if (tab.selectedFiles.includes(filePath)) {
                removeFileFromSelection(tab.id, filePath);
                return;
            }

            addFileToSelection(tab.id, filePath);
            return;
        }

        // If holder Shift, select range of files
        if (e.shiftKey && tab.files) {
            const lastSelectedFile = tab.selectedFiles[tab.selectedFiles.length - 1];
            const lastSelectedIndex = tab.files.findIndex(file => file.path === lastSelectedFile);
            const currentFileIndex = tab.files.findIndex(file => file.path === filePath);

            if (lastSelectedIndex !== -1 && currentFileIndex !== -1) {
                const startIndex = Math.min(lastSelectedIndex, currentFileIndex);
                const endIndex = Math.max(lastSelectedIndex, currentFileIndex);
                const filesToSelect = tab.files.slice(startIndex, endIndex + 1).map(file => file.path);
                addFilesToSelection(tab.id, filesToSelect);
            }
            return;
        }

        // If it's the only file selected, clear selection
        if (tab.selectedFiles.length === 1 && tab.selectedFiles[0] === filePath) {
            clearSelection(tab.id);
            return;
        }

        clearSelection(tab.id);
        selectFile(tab.id, filePath);
    }

    const handleContextMenu = (_e: React.MouseEvent<HTMLDivElement>, filePath: string) => {
        if (!tab) return;

        // Select the file if not already selected
        if (!tab.selectedFiles.includes(filePath)) {
            selectFile(tab.id, filePath);
        }
    }

    const handleDownload = async () => {
        if (!tab?.session || tabSession?.status !== 'connected') {
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
        if (!downloadsPath || downloadsPath === "") {
            // setDownloadsSetDialog(true);
            // TODO:: Show a dialog to set the Downloads directory
            toast.error("Please set the Downloads directory in settings");
            return;
        }

        try {
            // Start downloading
            downloadFile(tab.session.id, file.path, downloadsPath + "/" + file.name);
            toast.success("File download queued");
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Failed to download file");
        }
    }

    // Render
    return (
        <div
            className="flex flex-col relative h-full"
            onClick={() => {
                console.log("ListView clicked, clearing selection");
                clearSelection(tabId);
            }}
        >
            {/* Header Row */}
            <div className="flex items-center px-2 py-3 bg-muted/50 text-muted-foreground text-xs">
                <span className="flex-1">File Name</span>
                <span className="w-24 text-right">Size</span>
                <span className="w-32 text-right mr-4">Last Modified</span>
            </div>

            <div className="flex-1 overflow-auto">
                {/* Files Row */}
                {tab?.files?.map(file => (
                    <ContextMenu key={file.path} modal={false}>
                        <ContextMenuTrigger>
                            <div
                                key={file.path}
                                className={`hover:bg-muted text-xs flex items-center py-1 px-2 rounded mx-1 mt-1 border ${tab.selectedFiles.includes(file.path) ? 'bg-blue-500/10 border-blue-500' : 'bg-background border-transparent'}`}
                                onClick={(e) => handleClick(e, file.path)}
                                onDoubleClick={(e) => {
                                    handleDoubleClick(e, file.path)
                                }}
                                onContextMenu={(e) => handleContextMenu(e, file.path)}
                            >
                                {/* {file.name} - {bytesSizeToString(file.size)} */}
                                <span className="flex-1 flex items-center gap-2">
                                    {file.is_directory ? (
                                        file.name === '..' ? (
                                            <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline mr-1 w-6 h-6" />
                                        ) : (
                                            <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline mr-1 w-6 h-6" />
                                        )
                                    ) : (
                                        <img src={getIconForFileType(file.name)} alt="File Icon" className="inline mr-1 w-6 h-6" />
                                    )}
                                    {file.name}
                                </span>
                                <span
                                    className="w-24 text-right text-muted-foreground"
                                >{file.is_directory ? '-' : bytesSizeToString(file.size)}</span>
                                <span
                                    className="w-32 text-right text-muted-foreground pr-4"
                                >
                                    {new Date(file.modified).toLocaleDateString()}
                                </span>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                            <ContextMenuItem
                                inset
                                variant="default"
                                onClick={() => {
                                    onFileInfo(file);
                                }}
                                disabled={tab.selectedFiles.length > 1}
                            >
                                <Info size={16} aria-hidden="true" />
                                <span>Info</span>
                                <ContextMenuShortcut>⌘I</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem
                                inset
                                variant="default"
                                onClick={handleDownload}
                                disabled={file.is_directory || tab.selectedFiles.length > 1}
                            >
                                <Download size={16} aria-hidden="true" />
                                <span>Download</span>
                                <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem
                                inset
                                variant="default"
                                onClick={() => {
                                    onRenameFile(file);
                                }}
                                disabled={tab.selectedFiles.length > 1}
                            >
                                <FormInput size={16} aria-hidden="true" />
                                <span>Rename</span>
                                <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem
                                inset
                                variant="destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    onDelete();
                                }}
                            >
                                <TrashIcon size={16} aria-hidden="true" />
                                <span>Delete</span>
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}

                {/* No Files */}
                {tab?.files?.length === 0 && (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        <Rows3 size={24} className="text-muted-foreground/50 size-12" />
                        <span className="text-muted-foreground mt-2 text-lg">
                            No files found
                        </span>
                    </div>
                )}
            </div>


            {/* Session Connecting Overlay */}
            {(tabSession?.status !== 'connected' || !tab?.session || tab?.isLoading) && (
                <div className="absolute w-full h-full bg-background/90 flex items-center justify-center z-20" />
            )}
        </div>
    );

}