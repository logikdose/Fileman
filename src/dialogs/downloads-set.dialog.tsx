import { FolderOpen, FolderPlus, Loader2 } from "lucide-react"

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
import { toast } from "sonner"
import { open } from "@tauri-apps/plugin-dialog";
import useConfigStore from "@/stores/config.store"

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId?: string;
    currentPath?: string;
    tabId?: string;
}

export default function DownloadsSetDialog({ dialogOpen, onOpenChange, currentPath }: Props) {
    // Hooks
    const downloadPath = useConfigStore((state) => state.downloadsPath);
    const setDownloadPath = useConfigStore((state) => state.setDownloadsPath);

    // State
    const [folderName, setFolderName] = useState(downloadPath ? downloadPath : "");
    const [saving, setSaving] = useState(false);

    // Handlers
    const handleSavePreference = async () => {
        setSaving(true);
        try {
            // Save the selected path to process store
            setDownloadPath(folderName);
            toast.success("Downloads path set successfully");

            // Reset folder name and close dialog
            setFolderName("");
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error("Failed to create folder");
        } finally {
            setSaving(false);
        }
    }

    // Render
    return (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            {/* <DialogTrigger asChild>
                <Button variant="outline">Newsletter</Button>
            </DialogTrigger> */}
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
                            Downloads Directory
                        </DialogTitle>
                        <DialogDescription className="sm:text-center">
                            Set the directory where files will be downloaded.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form className="space-y-5" onSubmit={(e) => {
                    e.preventDefault();
                    handleSavePreference();
                }}>
                    {/* Folder Name Input */}
                    <div className="*:not-first:mt-2">
                        <div className="*:not-first:mt-2">
                            <div className="flex rounded-md shadow-xs">
                                <Input
                                    id={"downloads-path"}
                                    className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                                    placeholder="Downloads Path"
                                    type="text"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    className="border-input bg-background text-foreground hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center rounded-e-md border px-3 text-sm font-medium transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    type="button"
                                    onClick={async () => {
                                        const downloads = await open({
                                            multiple: false, // Set to true if you want to allow multiple file selection
                                            directory: true, // Allow directory selection
                                            title: "Select Downloads Directory",
                                            defaultPath: folderName || currentPath || undefined,
                                            // You can add filters if needed, e.g.:
                                            //
                                            filters: [{
                                                name: "Folders",
                                                extensions: ["*"] // Allow all folders
                                            },]
                                        });

                                        if (downloads && typeof downloads === "string") {
                                            setFolderName(downloads);
                                        } else {
                                            toast.error("No folder selected");
                                        }
                                    }}
                                >
                                    <FolderOpen size={16} className="opacity-60" aria-hidden="true" />
                                    <span className="sr-only">Set Downloads Path</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        className="w-full"
                        onClick={handleSavePreference}
                        disabled={saving || !folderName.trim()}
                    >
                        Save Preferences

                        {saving && <Loader2 className="ms-2 animate-spin" />}
                    </Button>
                </form>

            </DialogContent>
        </Dialog>
    )
}