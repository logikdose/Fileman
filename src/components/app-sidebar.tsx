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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    // Dialogs
    const [sessionWizardOpen, setSessionWizardOpen] = React.useState(false);

    // Sessions
    const sessions = useSessionStore((state) => state.sessions)

    // Render
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader data-tauri-drag-region>
                <div className="flex items-center gap-2 bg-muted/10 rounded-xl" data-tauri-drag-region>
                    <img src={FilemanIcon} alt="Fileman" className="size-10" data-tauri-drag-region />
                    <span className="text-base text-muted-foreground" data-tauri-drag-region>Fileman</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full -space-y-px"
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

                        {/* Session Wizard */}
                        <SessionWizardDialog
                            dialogOpen={sessionWizardOpen}
                            onOpenChange={(open) => setSessionWizardOpen(open)}
                        />
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
