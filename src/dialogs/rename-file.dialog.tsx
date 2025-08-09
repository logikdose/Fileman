import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { Folder, FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    currentPath?: string;
    tabId?: string;
    fileName: string;
}

export default function RenameItemDialog({ open, onOpenChange, sessionId, currentPath, tabId, fileName }: Props) {
    // State
    const [itemName, setItemName] = useState(fileName);
    const [renamingItem, setRenamingItem] = useState(false);

    // Hooks
    const renameItem = useSessionStore((state) => state.renameItem);
    const navigateToPath = useTabStore((state) => state.navigateToPath);

    // Handlers
    const handleRenameItem = async () => {
        setRenamingItem(true);
        try {
            if (!sessionId) {
                toast.error("No session ID provided");
                return;
            }

            if (!itemName.trim()) {
                toast.error("Item name cannot be empty");
                return;
            }

            // If currentPath is not provided, use the root path
            const path = currentPath || "/";

            // Old item path
            const oldItemPath = path.endsWith("/") ? path : `${path}/` + fileName;

            // If path does not end with a slash, add it
            const itemPath = path.endsWith("/") ? path : `${path}/`;
            console.log("Renaming item:", itemPath, " | from path:", oldItemPath);

            await renameItem(sessionId, oldItemPath, itemPath + itemName);

            // Reset item name and close dialog
            setItemName("");
            onOpenChange(false);
            toast.success("Item renamed successfully");

            // Reload the current path to reflect the renamed item
            if (tabId) {
                navigateToPath(tabId, sessionId, itemPath);
            }
        } catch (error) {
            console.error("Error renaming item:", error);
            toast.error("Failed to rename item");
        } finally {
            setRenamingItem(false);
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
                            Rename Item
                        </DialogTitle>
                        <DialogDescription className="sm:text-center">
                            Rename the selected item.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    handleRenameItem();
                }}>
                    {/* Folder Name Input */}
                    <div className="*:not-first:mt-2">
                        <div className="relative">
                            <Input
                                id="folder-name"
                                className="peer ps-9"
                                placeholder="Folder Name"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                disabled={renamingItem}
                            />
                            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                <Folder size={16} aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        className="w-full"
                        onClick={handleRenameItem}
                        disabled={renamingItem || !itemName.trim()}
                    >
                        Rename
                        {renamingItem && <Loader2 className="ms-2 animate-spin" />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}