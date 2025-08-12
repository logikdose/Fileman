import { Copy, Download, Upload, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { bytesSizeToString } from "@/utils/file.util";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import useProcessStore from "@/stores/process.store";

type Props = {
    connectionId: string;
    path: string;
    transferred: number;
    total: number;
    type: "upload" | "download" | "copy";
    transferId: string;
    status: "active" | "cancelled" | "completed";
}

export default function ProcessProgress({ path, transferred, total, type, transferId, status }: Props) {
    // Calculate progress percentage
    const progress = total > 0 ? Math.round((transferred / total) * 100) : 0;
    const totalSize = bytesSizeToString(total);
    const transferredSize = bytesSizeToString(transferred);

    // Filename for the notification
    const filename = path.split('/').pop() || "File";
    const removeProcess = useProcessStore((state) => state.removeProcess);

    // Render
    return (
        // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
        <div className="bg-background/50 z-50 w-full rounded-md border p-3 shadow-lg mb-1">
            <div className="flex items-start gap-4">
                <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                >
                    {type === "upload" ? (
                        <Upload size={16} className={status === "active" ? "text-blue-500" : "text-gray-500"} />
                    ) : type === "download" ? (
                        <Download size={16} className={status === "active" ? "text-green-500" : "text-gray-500"} />
                    ) : (
                        <Copy size={16} className={status === "active" ? "text-yellow-500" : "text-gray-500"} />
                    )}
                </div>
                <div className="flex grow items-center gap-12 flex-1">
                    <div className="space-y-1 max-w-full">
                        <p className="text-sm">
                            {filename}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {transferredSize} / {totalSize} ({progress}%)
                        </p>
                        {
                            status === "active" ? (
                                <Badge
                                    className="text-xs text-muted-foreground"
                                    variant="secondary"
                                >
                                    {type === "upload" ? "Uploading" : type === "download" ? "Downloading" : "Copying"}
                                </Badge>
                            ) : status === "cancelled" ? (
                                <Badge
                                    className="text-xs"
                                    variant="destructive"
                                >
                                    Cancelled
                                </Badge>
                            ) : (
                                <Badge
                                    className="text-xs"
                                    variant="default"
                                >
                                    {type === "upload" ? "Upload" : type === "download" ? "Download" : "Copy"} Completed
                                </Badge>
                            )
                        }
                    </div>
                    {/* <Button size="sm">Notify me</Button> */}
                </div>

                {/* Cancel Button */}
                {status === "active" && (
                    <Button
                        variant="ghost"
                        className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                        aria-label="Close notification"
                        onClick={async () => {
                            // Cancel the transfer
                            try {
                                console.log("Cancelling transfer with ID:", transferId);
                                await invoke("cancel_transfer", { transferId: transferId });
                            } catch (error) {
                                console.error("Failed to cancel transfer:", error);
                                toast.error("Failed to cancel transfer");
                            }
                        }}
                    >
                        <XIcon
                            size={16}
                            className="opacity-60 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                        />
                    </Button>
                )}

                {/* Clear Button */}
                {(status === "completed" || status === "cancelled") && (
                    <Button
                        variant="secondary"
                        size="xsm"
                        onClick={() => {
                            // Clear the process from the store
                            removeProcess(transferId);
                        }}
                        aria-label="Clear process"
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    )
}
