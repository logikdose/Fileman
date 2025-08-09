import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import FileBrowser from "@/layout/file-browser"

export default function Layout() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="flex-1 w-0 h-[97vh] max-h-[97vh] overflow-hidden">
                <FileBrowser />
            </SidebarInset>
        </SidebarProvider>
    )
}
