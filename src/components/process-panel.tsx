import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import ProcessProgress from "./process-progress";
import { Badge } from "./ui/badge";
import useProcessStore from "@/stores/process.store";
import { Process } from "@/types/process";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import useTabStore from "@/stores/tab.store";
import { isSamePath } from "@/utils/file.util";
import useConfigStore from "@/stores/config.store";

export default function ProcessPanel() {
    // State
    const [showPanel, setShowPanel] = useState(false);
    const processes = useProcessStore((state) => state.processes);

    // Store hooks
    const autoClearSuccessNotifications = useConfigStore((state) => state.autoClearSuccessNotifications);
    const addProcess = useProcessStore((state) => state.addProcess);
    const updateProcess = useProcessStore((state) => state.updateProcess);
    const removeProcess = useProcessStore((state) => state.removeProcess);

    useEffect(() => {
        // Register listeners for upload progress and transfer cancellation
        const unlistenUpload = listen<Process>("upload_progress", (event) => {
            const { connection_id, path, transferred, total, transfer_id, type } = event.payload;
            const latestProcesses = useProcessStore.getState().processes;
            const existingProcess = latestProcesses.find(p => p.transfer_id === transfer_id);

            if (existingProcess) {
                updateProcess(transfer_id, { transferred, total, status: "active", type, path, connection_id });
            } else {
                addProcess({
                    connection_id,
                    path,
                    transferred,
                    total,
                    transfer_id,
                    status: "active",
                    type,
                } as Process);

                // Show process panel
                setShowPanel(true);
            }
        });

        const unlistenDownload = listen<Process>("download_progress", (event) => {
            const { connection_id, path, transferred, total, transfer_id, type } = event.payload;
            const latestProcesses = useProcessStore.getState().processes;
            const existingProcess = latestProcesses.find(p => p.transfer_id === transfer_id);

            if (existingProcess) {
                updateProcess(transfer_id, { transferred, total, status: "active", type, path, connection_id });
            } else {
                addProcess({
                    connection_id,
                    path,
                    transferred,
                    total,
                    transfer_id,
                    status: "active",
                    type,
                } as Process);

                // Show process panel
                setShowPanel(true);
            }
        });

        // Listen for transfer cancellation
        const unlistenCancel = listen<{ transfer_id: string; type: string }>("transfer_cancelled", (event) => {
            const { transfer_id } = event.payload;
            updateProcess(transfer_id, { status: "cancelled" });
            // removeProcess(transfer_id);
            toast.error("Transfer cancelled");
        });

        // Listen for transfer completion
        const unlistenComplete = listen<{ transfer_id: string; type: string, path: string }>("process_finished", (event) => {
            const { transfer_id, path } = event.payload;
            updateProcess(transfer_id, { status: "completed" });

            // Auto clear success notifications if enabled
            if (autoClearSuccessNotifications) {
                setTimeout(() => {
                    removeProcess(transfer_id);
                }, 2000); // Clear after 2 seconds
            }

            // If process is `download`, return
            if (event.payload.type === "download") {
                return;
            }

            // Remove filename from the path
            const filename = path.split('/').pop();
            if (filename) {
                toast.success(`File ${filename} transferred successfully`);
            }

            const directoryPath = path.split('/').slice(0, -1).join('/');
            if (directoryPath) {
                // Find tab with the directory path
                const tabs = useTabStore.getState().tabs;
                const tabsToUpdate = tabs.filter(tab => isSamePath(tab.filePath || "/", directoryPath));
                console.log("Tabs to update:", tabsToUpdate.length);
                for (const tab of tabsToUpdate) {
                    // Update the tab's file path to the directory path
                    useTabStore.getState().navigateToPath(tab.id, tab.session?.id, directoryPath);
                }
            }
        });

        return () => {
            unlistenUpload.then(unsub => unsub());
            unlistenDownload.then(unsub => unsub());
            unlistenCancel.then(unsub => unsub());
            unlistenComplete.then(unsub => unsub());
        };
    }, []);

    // Render
    return (
        <DropdownMenu modal={false} open={showPanel} onOpenChange={setShowPanel}>
            <DropdownMenuTrigger asChild>
                <Button size="iconSm" variant="outline" aria-label="Open account menu" className="relative">
                    <Bell size={16} aria-hidden="true" />
                    {processes.filter(p => p.status === "active").length > 0 && (
                        <Badge className="absolute -top-1 left-full min-w-4 -translate-x-1/2 px-1 text-xs">
                            {processes.filter(p => p.status === "active").length > 99 ? "99+" : processes.filter(p => p.status === "active").length}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[450px] max-h-[60vh] flex flex-col mr-2">
                <div className="flex-1 overflow-y-auto p-2">
                    {processes.map((process) => (
                        <ProcessProgress
                            key={`${process.transfer_id}-${process.path}`}
                            connectionId={process.connection_id}
                            path={process.path}
                            transferred={process.transferred}
                            total={process.total}
                            type={process.type}
                            transferId={process.transfer_id}
                            status={process.status}
                        />
                    ))}

                    {processes.length === 0 && (
                        <DropdownMenuItem disabled>
                            <span
                                className="text-muted-foreground w-full p-4 text-center"
                            >No active processes</span>
                        </DropdownMenuItem>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between p-2 text-sm text-muted-foreground">
                    <span className="text-muted-foreground">Processes: {processes.length}</span>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={processes.length === 0}
                        onClick={() => {
                            // Clear all completed processes
                            processes.forEach(process => {
                                if (process.status === "completed" || process.status === "cancelled") {
                                    removeProcess(process.transfer_id);
                                }
                            });
                        }}
                        aria-label="Clear completed processes"
                    >
                        Clear Completed
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
