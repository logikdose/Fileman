import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useBookmarkStore from "@/stores/bookmark.store";
import { Folder, FolderPlus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    path: string;
    sessionId: string;
};

export default function CreateBookmarkDialog({ open, onOpenChange, title, path, sessionId }: Props) {
    // State
    const [bookmarkName, setBookmarkName] = useState(title);
    const [creating, setCreating] = useState(false);

    // Hooks
    const addBookmark = useBookmarkStore((state) => state.addBookmark);

    // Update bookmark name when title changes
    useEffect(() => {
        setBookmarkName(title);
    }, [title]);

    // Handlers
    const handleCreateBookmark = async () => {
        setCreating(true);
        try {
            if (!bookmarkName.trim()) {
                toast.error("Bookmark name cannot be empty");
                return;
            }

            // Create bookmark
            addBookmark(bookmarkName, path, sessionId);

            toast.success("Bookmark created successfully");

            // Reset state
            setBookmarkName("");
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create bookmark");
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
                            Create Bookmark
                        </DialogTitle>
                        <DialogDescription className="sm:text-center">
                            Create a bookmark to quickly access this file.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form className="space-y-2" onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateBookmark();
                }}>
                    {/* Folder Name Input */}
                    <div className="*:not-first:mt-2">
                        <div className="relative">
                            <Input
                                id="folder-name"
                                className="peer ps-9"
                                placeholder="Bookmark Name"
                                value={bookmarkName}
                                onChange={(e) => setBookmarkName(e.target.value)}
                                disabled={creating}
                            />
                            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                <Folder size={16} aria-hidden="true" />
                            </div>
                        </div>
                    </div>

                    {/* File Path */}
                    <div className="relative">
                        <Input
                            id="file-path"
                            className="peer ps-9"
                            placeholder="File Path"
                            value={path}
                            disabled={true}
                        />
                        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                            <Folder size={16} aria-hidden="true" />
                        </div>
                    </div>

                    {/* Create Button */}
                    <Button
                        type="button"
                        className="w-full mt-4"
                        onClick={handleCreateBookmark}
                        disabled={creating || !bookmarkName.trim()}
                    >
                        Create

                        {creating && <Loader2 className="ms-2 animate-spin" />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}