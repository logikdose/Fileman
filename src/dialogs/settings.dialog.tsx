"use client"

import * as React from "react"
import {
    Bell,
    Computer,
    FolderOpen,
    Github,
    Info,
    Moon,
    Paintbrush,
    Settings,
    Sun,
} from "lucide-react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { open } from "@tauri-apps/plugin-dialog";
import { KEY_THEME } from "@/utils/storage.util"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import useBookmarkStore from "@/stores/bookmark.store"
import useProcessStore from "@/stores/process.store"
import { openUrl } from '@tauri-apps/plugin-opener';


const data = {
    nav: [
        // { id: "general", name: "General", icon: Settings },
        { id: "downloads", name: "Downloads", icon: FolderOpen },
        { id: "notifications", name: "Notifications", icon: Bell },
        { id: "bookmarks", name: "Bookmarks", icon: FolderOpen },
        { id: "appearance", name: "Appearance", icon: Paintbrush },
        // { id: "documents", name: "Documents", icon: Lock },
        { id: "about", name: "About", icon: Info },
    ],
}

type Props = {
    dialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ dialogOpen, onOpenChange }: Props) {
    const { setTheme } = useTheme()

    // State

    const [savedTheme, setSavedTheme] = React.useState("dark");
    const [selectedTab, setSelectedTab] = React.useState(data.nav[0].id)

    // Bookmarks
    const autoClearSuccessNotifications = useProcessStore((state) => state.autoClearSuccess);
    const setAutoClearSuccessNotifications = useProcessStore((state) => state.setAutoClearSuccess);
    const downloadsPath = useProcessStore((state) => state.downloadPath);
    const setDownloadsPath = useProcessStore((state) => state.setDownloadPath);
    const showBookmarks = useBookmarkStore((state) => state.showBookmarks);
    const setShowBookmarks = useBookmarkStore((state) => state.setShowBookmarks);
    const highlightBookmarks = useBookmarkStore((state) => state.highlightBookmarks);
    const setHighlightBookmarks = useBookmarkStore((state) => state.setHighlightBookmarks);
    const priorityBookmarks = useBookmarkStore((state) => state.priorityBookmarks);
    const setPriorityBookmarks = useBookmarkStore((state) => state.setPriorityBookmarks);

    React.useEffect(() => {
        // Fetch initial theme
        const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
        setSavedTheme(savedTheme);
    }, []);

    // Render
    return (
        <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    className="group"
                    variant="outline"
                    size="iconSm"
                >
                    <Settings className="group-hover:opacity-100" size={16} aria-hidden="true" />
                </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
                <DialogTitle className="sr-only">Settings</DialogTitle>
                <DialogDescription className="sr-only">
                    Customize your settings here.
                </DialogDescription>
                <SidebarProvider className="items-start">
                    <Sidebar collapsible="none" className="hidden md:flex">
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {data.nav.map((item) => (
                                            <SidebarMenuItem key={item.name}>
                                                <SidebarMenuButton
                                                    onClick={() => setSelectedTab(item.id)}
                                                    isActive={item.id === selectedTab}
                                                >
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                    </Sidebar>
                    <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" data-tauri-drag-region>
                            <div className="flex items-center gap-2 px-4">
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>{data.nav.find(item => item.id === selectedTab)?.name}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
                            <div className="border rounded-lg p-4 bg-muted shadow-sm h-full overflow-y-auto">
                                {selectedTab === "downloads" && (
                                    <>
                                        <h2 className="text-lg">Downloads</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your downloads here.
                                        </p>

                                        <div className="flex rounded-md shadow-xs mt-4 bg-background">
                                            <Input
                                                id={"downloads-path"}
                                                className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                                                placeholder="Downloads Path"
                                                type="text"
                                                value={downloadsPath ? downloadsPath : ""}
                                                // onChange={(e) => {
                                                //     setDownloadsPath(e.target.value);
                                                // }}
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
                                                        defaultPath: downloadsPath || undefined,
                                                        // You can add filters if needed, e.g.:
                                                        //
                                                        filters: [{
                                                            name: "Folders",
                                                            extensions: ["*"] // Allow all folders
                                                        },]
                                                    });

                                                    if (downloads && typeof downloads === "string") {
                                                        setDownloadsPath(downloads);
                                                    } else {
                                                        toast.error("No folder selected");
                                                    }
                                                }}
                                            >
                                                <FolderOpen size={16} className="opacity-60" aria-hidden="true" />
                                                <span className="sr-only">Set Downloads Path</span>
                                            </button>
                                        </div>
                                    </>
                                )}

                                {selectedTab === "appearance" && (
                                    <>
                                        <h2 className="text-lg">Appearance</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Customize the look and feel of the application.
                                        </p>
                                        {/* Add appearance settings here */}

                                        <Tabs defaultValue={savedTheme} value={savedTheme} className="mt-4">
                                            <ScrollArea>
                                                <TabsList className="mb-3 mt-4 bg-background/50">
                                                    <TabsTrigger
                                                        value="dark" className="group"
                                                        onClick={() => {
                                                            setTheme("dark")
                                                            setSavedTheme("dark")

                                                            localStorage.setItem(KEY_THEME, "dark")
                                                        }}
                                                    >
                                                        <Moon
                                                            className="-ms-0.5 me-1.5 opacity-60"
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                        Dark
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="light" className="group"
                                                        onClick={() => {
                                                            setTheme("light")
                                                            setSavedTheme("light")

                                                            localStorage.setItem(KEY_THEME, "light")
                                                        }}
                                                    >
                                                        <Sun
                                                            className="-ms-0.5 me-1.5 opacity-60"
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                        Light
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="system" className="group"
                                                        onClick={() => {
                                                            setTheme("system")
                                                            setSavedTheme("system")

                                                            localStorage.setItem(KEY_THEME, "system")
                                                        }}
                                                    >
                                                        <Computer
                                                            className="-ms-0.5 me-1.5 opacity-60"
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                        System
                                                    </TabsTrigger>
                                                </TabsList>
                                                <ScrollBar orientation="horizontal" />
                                            </ScrollArea>
                                        </Tabs>

                                    </>
                                )}

                                {selectedTab === "general" && (
                                    <>
                                        <h2 className="text-lg">General</h2>
                                        <p className="text-sm text-muted-foreground">
                                            General application settings.
                                        </p>
                                        {/* Add general settings here */}
                                    </>
                                )}

                                {selectedTab === "bookmarks" && (
                                    <>
                                        <h2 className="text-lg">Bookmarks</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your bookmarks.
                                        </p>
                                        {/* Add bookmarks settings here */}

                                        {/* Show Bookmarks */}
                                        <div className="mt-4 border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                                            <Switch
                                                id={"show-bookmarks"}
                                                className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
                                                aria-describedby={`show-bookmarks-description`}
                                                checked={showBookmarks}
                                                onCheckedChange={(checked) => {
                                                    setShowBookmarks(checked);
                                                }}
                                            />
                                            <div className="grid grow gap-2">
                                                <Label htmlFor={"show-bookmarks"}>
                                                    Show Bookmarks
                                                </Label>
                                                <p id={`show-bookmarks-description`} className="text-muted-foreground text-xs">
                                                    Toggle to show or hide bookmarks at the top of the file browser.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Highlight Bookmarks */}
                                        <div className="mt-4 border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                                            <Switch
                                                id={"highlight-bookmarks"}
                                                className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
                                                aria-describedby={`highlight-bookmarks-description`}
                                                checked={highlightBookmarks}
                                                onCheckedChange={(checked) => {
                                                    setHighlightBookmarks(checked);
                                                }}
                                            />
                                            <div className="grid grow gap-2">
                                                <Label htmlFor={"highlight-bookmarks"}>
                                                    Highlight Bookmarks
                                                </Label>
                                                <p id={`highlight-bookmarks-description`} className="text-muted-foreground text-xs">
                                                    Highlight bookmarks from same session as the active tab.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Priority Bookmarks */}
                                        <div className="mt-4 border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                                            <Switch
                                                id={"priority-bookmarks"}
                                                className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
                                                aria-describedby={`priority-bookmarks-description`}
                                                checked={priorityBookmarks}
                                                onCheckedChange={(checked) => {
                                                    setPriorityBookmarks(checked);
                                                }}
                                            />
                                            <div className="grid grow gap-2">
                                                <Label htmlFor={"priority-bookmarks"}>
                                                    Priority Bookmarks
                                                </Label>
                                                <p id={`priority-bookmarks-description`} className="text-muted-foreground text-xs">
                                                    Show bookmarks from the same session as the active tab at the top of the bookmarks list.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedTab === "notifications" && (
                                    <>
                                        <h2 className="text-lg">Notifications</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your notification preferences.
                                        </p>
                                        {/* Add notification settings here */}

                                        <div className="mt-4 border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                                            <Switch
                                                id={"auto-clear-success-notifications"}
                                                className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
                                                aria-describedby={`auto-clear-success-notifications-description`}
                                                checked={autoClearSuccessNotifications}
                                                onCheckedChange={(checked) => {
                                                    setAutoClearSuccessNotifications(checked);
                                                }}
                                            />
                                            <div className="grid grow gap-2">
                                                <Label htmlFor={"auto-clear-success-notifications"}>
                                                    Auto Clear Success Notifications
                                                </Label>
                                                <p id={`auto-clear-success-notifications-description`} className="text-muted-foreground text-xs">
                                                    On success of file transfers, automatically clear notifications after a few seconds.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedTab === "about" && (
                                    <>
                                        <h2 className="text-lg">About</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Fileman is a modern SFTP file management application built with Tauri and React.
                                        </p>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-muted-foreground text-sm">
                                                Version: <span className="font-semibold">1.0.1</span>
                                            </p>
                                            <Button className="mt-2" variant="outline" onClick={() => openUrl("https://github.com/logikdose/fileman")}>
                                                Github <Github />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </main>
                </SidebarProvider>
            </DialogContent>
        </Dialog>
    )
}
