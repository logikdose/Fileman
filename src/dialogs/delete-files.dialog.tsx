import { Loader2, Trash2 } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabId?: string;
}

export default function DeleteFilesDialog({ open, onOpenChange, tabId }: Props) {
    // State
    const [deletingFiles, setDeletingFiles] = useState(false);
    // const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);

    // Store hooks
    const currentTab = useTabStore((state) => state.getTabById(tabId));
    const selectedFiles = currentTab?.selectedFiles || [];
    const deleteItem = useSessionStore((state) => state.deleteItem);
    const deleteDirectoryRecursive = useSessionStore((state) => state.deleteDirectoryRecursive);

    // Handlers
    const handleDeleteFiles = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentTab || !selectedFiles || selectedFiles.length === 0) {
            onOpenChange(false);
            toast.error("No files selected for deletion");
            return;
        }

        const session = currentTab.session;
        if (session?.id === undefined) {
            toast.error("No session ID found for deletion");
            return;
        }

        setDeletingFiles(true);
        try {
            // Fetch files for each item
            const filesToDelete = currentTab.files?.filter(file => selectedFiles.includes(file.path));
            if ((filesToDelete?.length ?? 0) === 0 || !filesToDelete) {
                toast.error("No valid files selected for deletion");
                setDeletingFiles(false);
                return;
            }

            // Delete each item based on its type
            await Promise.all(filesToDelete.map(file => {
                if (file.is_directory) {
                    return deleteDirectoryRecursive(session.id, file.path);
                } else {
                    return deleteItem(session.id, file.path, file.is_directory);
                }
            }));

            // Update the tab state after deletion
            useTabStore.getState().removeFilesFromSelection(currentTab.id, selectedFiles);
            // setDeletedFiles(filesToDelete);
            toast.success("Files deleted successfully");

            // Close the dialog
            onOpenChange(false);
            setDeletingFiles(false);

            // Reload tab
            useTabStore.getState().navigateToPath(currentTab.id, session.id, currentTab.filePath || "/");
        } catch (error) {
            console.error("Error deleting files:", error);
            toast.error("Failed to delete files");
            setDeletingFiles(false);
        }
    }

    // Render
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {/* <AlertDialogTrigger asChild>
                <Button variant="outline">Alert dialog with icon</Button>
            </AlertDialogTrigger> */}
            <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-destructive"
                        aria-hidden="true"
                    >
                        <Trash2 className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm delete {selectedFiles?.length} items
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div>
                                Are you sure you want to delete the selected items? This action cannot be undone.
                            </div>
                            <div className="border rounded-md mt-4 w-full max-h-60 overflow-auto">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="whitespace-pre-wrap break-words px-2 py-1 hover:bg-muted/50"
                                    >
                                        {file}
                                    </div>
                                ))}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            onOpenChange(false);
                            setDeletingFiles(false);
                        }}
                        disabled={deletingFiles}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
                        onClick={handleDeleteFiles}
                        disabled={deletingFiles}
                    >
                        Confirm Delete
                        {deletingFiles && <Loader2 className="ml-2 animate-spin" size={16} />}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
