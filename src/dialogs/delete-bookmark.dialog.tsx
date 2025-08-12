import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useBookmarkStore from "@/stores/bookmark.store";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;

    bookmarkId: string;
    bookmarkName: string;
}


export default function DeleteBookmarkDialog({ dialogOpen, onOpenChange, bookmarkId, bookmarkName }: Props) {

    // State
    const [deletingBookmark, setDeletingBookmark] = useState(false);
    // Store hooks
    const deleteBookmark = useBookmarkStore((state) => state.removeBookmark);

    // Handlers
    const handleDeleteBookmark = async () => {
        setDeletingBookmark(true);
        try {
            await deleteBookmark(bookmarkId);
            toast.success(`Bookmark ${bookmarkName} deleted successfully`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting bookmark:", error);
            toast.error(`Failed to delete bookmark ${bookmarkName}`);
        } finally {
            setDeletingBookmark(false);

        }
    };

    // Render
    return (
        <AlertDialog open={dialogOpen} onOpenChange={onOpenChange}>
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
                            Confirm delete bookmark
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bookmark? This action cannot be undone.
                            <div className="flex items-center justify-between border rounded-md mt-4 px-3 py-2">
                                <span>{bookmarkName}</span>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            onOpenChange(false);
                            setDeletingBookmark(false);
                        }}
                        disabled={deletingBookmark}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-background hover:bg-destructive/90"
                        onClick={handleDeleteBookmark}
                        disabled={deletingBookmark}
                    >
                        Confirm
                        {deletingBookmark && <Loader2 className="ml-2 animate-spin" size={16} />}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}