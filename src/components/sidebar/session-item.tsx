import ISession from "@/models/session.model";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { Loader2, PlusIcon, Server, Trash } from "lucide-react"
import { toast } from "sonner";
import DeleteSessionDialog from "@/dialogs/delete-session.dialog";
import React from "react";
import SessionEditDialog from "@/dialogs/session-edit.dialog";
import { AccordionContent, AccordionItem } from "../ui/accordion";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { Button } from "../ui/button";

type Props = {
    session: ISession;
}

export default function SessionItem({ session }: Props) {

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    // Edit
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);

    // Store
    const connectToSession = useSessionStore(state => state.connectToSession);
    const disconnectSession = useSessionStore(state => state.disconnectSession);
    const activeTabId = useTabStore(state => state.activeTabId);
    const activeTab = useTabStore(state => state.getTabById(activeTabId));
    const updateSessionInTab = useTabStore(state => state.updateSessionInTab);
    const createTab = useTabStore(state => state.createTab);
    const setActiveTab = useTabStore(state => state.setActiveTab);

    // Connect to session
    const handleClick = async () => {
        // If session is already connected, disconnect it
        if (session.status === 'connected') {
            disconnectSession(session.id);
            toast.success(`Disconnected from session: ${session.name}`);
            return;
        }

        // Navigate tab to session and path
        if (activeTab) {
            updateSessionInTab(activeTab.id, session);

            useTabStore.getState().navigateToPath(activeTab.id, session.id, activeTab.filePath || "/");
        } else {
            // Create a new tab with the session
            const newTabId = createTab(session, "/");
            setActiveTab(newTabId);

            // Navigate to the root path
            useTabStore.getState().navigateToPath(newTabId, session.id, "/");
        }

        // Check if session is already connecting
        if (session.status === 'connecting') {
            return;
        }

        // Connect to session
        const connected = await connectToSession(session.id);
        if (!connected) {
            toast.error(`Failed to connect to session: ${session.name}`);
        } else {
            toast.success(`Connected to session: ${session.name}`);

            // Load directory in the tab
            if (activeTab) {
                useTabStore.getState().navigateToPath(activeTab.id, session.id, activeTab.filePath || "/");
            }
        }
    };

    // Render
    return (
        <>

            <AccordionItem
                value={session.id}
                key={session.id}
                className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative border px-3 py-1 outline-none first:rounded-t-md last:rounded-b-md last:border-b has-focus-visible:z-10 has-focus-visible:ring-[3px]"
            >
                <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-start rounded-md py-2 text-left text-sm text-[15px] leading-6 transition-all outline-none focus-visible:ring-0 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0">
                        <span className={`size-1 rounded-full ${session.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} absolute top-1 left-1`} />
                        <div className="flex items-center justify-center bg-muted rounded-full size-8">
                            {session.status === 'connecting' ? (
                                <Loader2 className="w-3 h-3 animate-spin text-sidebar-secondary-foreground" />
                            ) : (
                                <Server className="w-3 h-3 text-sidebar-secondary-foreground" />
                            )}
                        </div>
                        <div className="flex flex-1 flex-col leading-none items-start ml-3">
                            <span className="text-sm text-start">
                                {session.name}
                            </span>
                            <span className="text-xs text-muted-foreground text-start">
                                {session.username}@{session.host}
                            </span>
                        </div>
                        <PlusIcon
                            size={16}
                            className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
                            aria-hidden="true"
                        />
                    </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="text-muted-foreground pb-2">
                    <div className="flex flex-row gap-1 w-full items-start justify-start pt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClick}
                            disabled={session.status === 'connecting'}
                        >
                            {session.status === 'connected' ? "Disconnect" : "Connect"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditDialogOpen(true)}
                        >
                            Edit
                        </Button>
                        <Button
                            size="iconSm"
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash size={16} />
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem >


            <DeleteSessionDialog
                sessionId={session.id}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />

            <SessionEditDialog
                dialogOpen={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                session={session}
            />
        </>
    )
}