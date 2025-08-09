import { CircleAlertIcon } from "lucide-react"

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
import useSessionStore from "@/stores/session.store";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // trigger: React.ReactNode;
    sessionId: string;
}

export default function DeleteSessionDialog(props: Props) {
    const { open, onOpenChange, sessionId } = props;

    // Store hooks
    const deleteSession = useSessionStore((state) => state.deleteSession);

    // Render
    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <CircleAlertIcon
                            className="opacity-80 text-red-500"
                            size={16}
                        />
                    </div>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete your account? All your data will
                            be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            // Close dialog
                            onOpenChange?.(false);
                        }}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                        onClick={() => {
                            // Call delete session
                            deleteSession(sessionId);

                            // Close dialog
                            onOpenChange?.(false);
                        }}
                    >
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}