import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";

type Props = {
    showPanel: boolean;
    setShowPanel: (show: boolean) => void;
    trigger: React.ReactNode;
};

export default function SessionSelectionMenu({ showPanel, setShowPanel, trigger }: Props) {
    // Store hooks
    const sessions = useSessionStore((state) => state.sessions);
    const activeTabId = useTabStore((state) => state.activeTabId);
    const navigateToPath = useTabStore((state) => state.navigateToPath);

    // Handlers
    const onSelectSession = (sessionId: string) => {
        if (!activeTabId) {
            return;
        }
        navigateToPath(activeTabId, sessionId, "/");

        // Close the menu after selection
        setShowPanel(false);
    }

    // Render
    return (
        <DropdownMenu modal={false} open={showPanel} onOpenChange={setShowPanel}>
            <DropdownMenuTrigger asChild>
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[350px] max-h-[60vh] flex flex-col mr-2">
                <div className="flex-1 overflow-y-auto p-2">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="mb-2 flex items-center justify-between px-3 py-2 bg-muted/10 rounded-md hover:bg-muted cursor-pointer border"
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="flex flex-col items-start justify-start space-x-2">
                                <span className="text-sm text-muted-foreground">{session.name}</span>
                                <span className="text-xs text-muted-foreground">{session.host}:{session.port}</span>
                            </div>
                            <span
                                className={
                                    "text-xs bg-muted px-2 py-1 rounded"
                                    + (session.status === 'connected' ? " text-green-500" : " text-red-500")
                                }
                            >
                                {session.status === 'connected' ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <DropdownMenuItem disabled>
                            <span
                                className="text-muted-foreground w-full p-4 text-center"
                            >No sessions added</span>
                        </DropdownMenuItem>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}