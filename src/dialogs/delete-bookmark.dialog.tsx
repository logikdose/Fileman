import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useBookmarkStore from "@/stores/bookmark.store";
import { CircleAlertIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;

    bookmarkId: string;
}


export default function DeleteBookmarkDialog({ dialogOpen, onOpenChange, bookmarkId }: Props) {

    // State
    const [deletingBookmark, setDeletingBookmark] = useState(false);
    // Store hooks
    const deleteBookmark = useBookmarkStore((state) => state.removeBookmark);

    // Handlers
    const handleDeleteBookmark = async () => {
        setDeletingBookmark(true);
        try {
            await deleteBookmark(bookmarkId);
            toast.success(`Bookmark ${bookmarkId} deleted successfully`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting bookmark:", error);
            toast.error(`Failed to delete bookmark ${bookmarkId}`);
        } finally {
            setDeletingBookmark(false);

        }
    };

    // Render
    return (
        <AlertDialog open={dialogOpen} onOpenChange={onOpenChange}>
            {/* <AlertDialogTrigger asChild>
                <Button variant="outline">Alert dialog with icon</Button>
            </AlertDialogTrigger> */}
            <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm delete {bookmarkId} bookmark
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this bookmark? This action cannot be undone.
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