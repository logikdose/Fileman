import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { FileItem } from "@/types/FileItem";
import { bytesSizeToString, dateTimeFromTimestamp } from "@/utils/file.util";
import { listen } from "@tauri-apps/api/event";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DirectorySizeCompletedEvent = {
    operation_id: string;
    path: string;
    error: string | null;
    success: boolean;
    size: number | null;
};

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileItem | null;
}

export default function FileInfoDialog({ dialogOpen, onOpenChange, file }: Props) {
    // State
    const [fetchingInfo, setFetchingInfo] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);

    // Hooks
    const activeTab = useTabStore((state) => state.getTabById(state.activeTabId));
    const fetchDirectorySize = useSessionStore((state) => state.fetchDirectorySize);

    // Handlers
    const handleFetchFileInfo = async () => {
        if (!file) {
            toast.error("No file selected");
            return;
        }

        if (!file.is_directory) {
            setFileSize(file.size);
            return;
        }

        try {
            // Fetch sessionId
            const sessionId = activeTab?.session?.id;
            if (!sessionId) {
                toast.error("No active session");
                return;
            }

            // Fetch file info
            const operationId = await fetchDirectorySize(sessionId, file.path);
            setFetchingInfo(operationId);
            console.log("Fetched file size:", fileSize);
            setFileSize(fileSize);
        } catch (error) {
            console.error("Error fetching file info:", error);
        }
    };

    // Effects
    useEffect(() => {
        if (file) {
            handleFetchFileInfo();
        }

        // Register listeners for `directory_size_completed` 
        const unlistenDirectorySizeCompleted = listen<DirectorySizeCompletedEvent>("directory_size_completed", (event) => {
            const { path, error, size, success } = event.payload;
            if (success) {
                setFileSize(size);
            } else {
                toast.error(`Failed to fetch directory size for ${path}: ${error}`);
            }

            setFetchingInfo(null);
        });

        return () => {
            unlistenDirectorySizeCompleted.then(unlisten => unlisten());
        };
    }, [file]);

    // Render
    return (
        <AlertDialog open={dialogOpen} onOpenChange={(open) => {
            // If closing dialog, and fetching info - 

            // Change
            onOpenChange(open);
        }}>
            <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <Info className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader className="w-full">
                        <AlertDialogTitle>
                            File Information
                        </AlertDialogTitle>
                        <div className="w-full">
                            <div>
                                <p>{file?.name}</p>
                            </div>
                            <div className="border rounded-md mt-4 w-full max-h-60 overflow-auto">
                                <div className="px-2 py-2 border-b flex flex-row">
                                    <span>File Size: </span>
                                    {fetchingInfo ? (
                                        <span className="pl-2 py-1">
                                            <Loader2 className="animate-spin" size={16} />
                                        </span>
                                    ) : (
                                        <span className="pl-2">{fileSize ? bytesSizeToString(fileSize) : "Unknown"}</span>
                                    )}
                                </div>
                                <div className="px-2 py-2 border-b flex flex-row">
                                    <span>File Type: </span>
                                    <span className="pl-2">
                                        {file?.is_directory ? "Directory" : "File"}
                                    </span>
                                </div>
                                <div className="px-2 py-2 flex flex-row">
                                    <span>Last Modified: </span>
                                    <span className="pl-2">
                                        {file?.modified ? dateTimeFromTimestamp(file?.modified) : "Unknown"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            onOpenChange(false);
                        }}
                    >
                        Close
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}