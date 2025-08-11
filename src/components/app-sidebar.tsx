import * as React from "react"
import FilemanIcon from "@/assets/fileman-icon.png"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarRail,
} from "@/components/ui/sidebar"
import useSessionStore from "@/stores/session.store"
import SessionItem from "./sidebar/session-item"
import SessionWizardDialog from "@/dialogs/session-wizard.dialog"
import { Accordion } from "./ui/accordion"
import useClipboardStore from "@/stores/clipboard.store"
import useTabStore from "@/stores/tab.store"
import { Button } from "./ui/button"
import { Plus } from "lucide-react"
import { getIconForFileType } from "@/utils/file.util"
import useConfigStore from "@/stores/config.store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    // Dialogs
    const [sessionWizardOpen, setSessionWizardOpen] = React.useState(false);

    // Sessions
    const clipboardItems = useClipboardStore((state) => state.items);
    const activeTab = useTabStore((state) => state.getTabById(state.activeTabId));
    const sessions = useSessionStore((state) => state.sessions);
    const clearSessionClipboard = useClipboardStore((state) => state.clearSession);
    const showClipboard = useConfigStore((state) => state.showClipboard);

    // Current session clipboard
    const currentSessionClipboard = clipboardItems.filter(item => item.sessionId === activeTab?.session?.id);

    // Render
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader data-tauri-drag-region className="absolute top-0 left-0 z-10 flex flex-row h-[56px] flex items-center justify-between bg-gradient-to-b   from-background via-background to-transparent w-full">
                <div className="flex flex-row items-center gap-1" data-tauri-drag-region>
                    <img src={FilemanIcon} alt="Fileman" className="size-8" data-tauri-drag-region />
                    <span className="text-base text-muted-foreground text-sm" data-tauri-drag-region>Fileman</span>
                </div>
                <SessionWizardDialog
                    dialogOpen={sessionWizardOpen}
                    onOpenChange={(open) => setSessionWizardOpen(open)}
                    trigger={
                        <Button
                            variant="outline"
                            size="sm"
                        >
                            New Session
                            <Plus />
                        </Button>
                    }
                />
            </SidebarHeader>
            <SidebarContent className="h-[calc(100vh-56px)] gap-0 w-full">
                <SidebarGroup className={
                    "overflow-y-auto w-full"
                    + (currentSessionClipboard.length > 0 && showClipboard ? " h-[70%] border-b" : " h-[100%]")
                }>
                    <SidebarMenu className="w-full">
                        <div className="h-[56px] w-full block" />
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full -space-y-px overflow-y-auto"
                            defaultValue="1"
                        >
                            {/* Session Items */}
                            {sessions.map((session) => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                />
                            ))}

                            {/* No Sessions */}
                            {sessions.length === 0 && (
                                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground text-center border rounded-md">
                                    No sessions found, start by creating one.
                                </div>
                            )}
                        </Accordion>
                    </SidebarMenu>
                </SidebarGroup>
                {showClipboard && (
                    <SidebarGroup className={
                        "mt-auto"
                        + (currentSessionClipboard.length > 0 ? " h-[30%] flex" : " h-[0%] hidden")
                    }>
                        <div className="px-2 py-1 rounded-md mb-2 text-xs text-muted-foreground flex flex-row justify-between items-center">
                            <span>Clipboard</span>
                            <Button
                                variant="outline"
                                size="xsm"
                                onClick={() => {
                                    if (activeTab?.session?.id) {
                                        clearSessionClipboard(activeTab?.session?.id)
                                    }
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                        <div className="border rounded-md h-full overflow-y-auto">
                            {currentSessionClipboard.map((item) => (
                                <div key={item.id} className="px-2 py-1 border-b flex flex-row gap-2 items-center justify-start">
                                    <span>
                                        {item.file.is_directory ? (
                                            item.file.name === '..' ? (
                                                <img src={getIconForFileType(item.file.name, true)} alt="Folder Icon" className="inline w-4 h-4" />
                                            ) : (
                                                <img src={getIconForFileType(item.file.name, true)} alt="Folder Icon" className="inline w-4 h-4" />
                                            )
                                        ) : (
                                            <img src={getIconForFileType(item.file.name)} alt="File Icon" className="inline w-4 h-4" />
                                        )}
                                    </span>
                                    <span className="text-xs flex-1">{item.file.name}</span>
                                    <span className="text-xs bg-muted rounded-lg px-2 py-0.5 text-muted-foreground">
                                        {item.status === "pending" ? item.action : item.status}
                                    </span>
                                </div>
                            ))}

                            {/* No Clipboard Items */}
                            {currentSessionClipboard.length === 0 && (
                                <div className="flex items-center justify-center h-full w-full text-sm text-muted-foreground p-6 text-center">
                                    No items in clipboard from this session.
                                </div>
                            )}
                        </div>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
