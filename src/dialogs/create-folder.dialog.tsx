import { Folder, FolderPlus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import useSessionStore from "@/stores/session.store"
import { toast } from "sonner"
import useTabStore from "@/stores/tab.store"

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    currentPath?: string;
    tabId?: string;
}

export default function CreateFolderDialog({ open, onOpenChange, sessionId, currentPath, tabId }: Props) {
    // State
    const [folderName, setFolderName] = useState("");
    const [creating, setCreating] = useState(false);

    // Store hooks
    const createDirectory = useSessionStore((state) => state.createDirectory);
    const navigateToPath = useTabStore((state) => state.navigateToPath);


    // Handlers
    const handleCreateFolder = async () => {
        setCreating(true);
        try {
            if (!sessionId) {
                toast.error("No session ID provided");
                return;
            }

            if (!folderName.trim()) {
                toast.error("Folder name cannot be empty");
                return;
            }

            // If currentPath is not provided, use the root path
            const path = currentPath || "/";

            // If path does not end with a slash, add it
            const folderPath = path.endsWith("/") ? path : `${path}/`;
            await createDirectory(sessionId, folderPath + folderName);

            // Reset folder name and close dialog
            setFolderName("");
            onOpenChange(false);
            toast.success("Folder created successfully");

            // Reload the current path to reflect the new folder
            if (tabId) {
                navigateToPath(tabId, sessionId, folderPath);
            }
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error("Failed to create folder");
        } finally {
            setCreating(false);
        }
    }

    // Render
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="mb-2 flex flex-col items-center gap-2">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <FolderPlus size={16} className="opacity-80" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="sm:text-center">
                            Create Folder
                        </DialogTitle>
                        <DialogDescription className="sm:text-center">
                            Create a new folder to organize your files.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateFolder();
                }}>
                    {/* Folder Name Input */}
                    <div className="*:not-first:mt-2">
                        <div className="relative">
                            <Input
                                id="folder-name"
                                className="peer ps-9"
                                placeholder="Folder Name"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                disabled={creating}
                            />
                            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                <Folder size={16} aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        className="w-full"
                        onClick={handleCreateFolder}
                        disabled={creating || !folderName.trim()}
                    >
                        Create

                        {creating && <Loader2 className="ms-2 animate-spin" />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}