import { Button } from "@/components/ui/button";
import SessionSelectionMenu from "@/dialogs/session-selection.menu";
import useConfigStore from "@/stores/config.store";
import useSessionStore from "@/stores/session.store";
import useTabStore from "@/stores/tab.store";
import { useState } from "react";

export default function Footer() {
    // State
    const [sessionMenuOpen, setSessionMenuOpen] = useState(false);

    // Store hooks
    const activeTabId = useTabStore((state) => state.activeTabId);
    const activeTab = useTabStore((state) => state.getTabById(activeTabId));
    const activeTabSession = useSessionStore((state) => state.getSessionById(activeTab?.session?.id));
    const listViewSize = useConfigStore((state) => state.listViewSize);
    const setListViewSize = useConfigStore((state) => state.setListViewSize);

    // Render
    return (
        <footer className="h-12 border-t bg-background flex items-center px-2 text-xs text-muted-foreground rounded-b-xl">
            {/* Session */}
            {activeTab && activeTabSession && (
                <SessionSelectionMenu
                    showPanel={sessionMenuOpen}
                    setShowPanel={setSessionMenuOpen}
                    trigger={
                        <button
                            className="text-muted-foreground text-xs bg-background h-6 pl-2 pr-1.5 rounded flex items-center justify-center border hover:bg-muted/20 mr-4"
                        >
                            {activeTabSession.name} <span className={
                                "w-1 h-1 rounded-full bg-grey-500 ml-1"
                                + (activeTabSession.status === 'connected' ? " bg-green-500" : " bg-red-500")
                            } />
                        </button>
                    }
                />
            )}

            {/* Selection */}
            {activeTab && (activeTab.selectedFiles?.length || 0) > 0 && (
                <span className="mr-4">
                    Selected: {activeTab.selectedFiles.length}
                </span>
            )}


            {/* File Details */}
            {activeTab && activeTab.files && (
                <span>
                    Total Files: {activeTab.files?.length || 0}
                </span>
            )}

            <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setListViewSize(listViewSize === 'compact' ? 'comfortable' : 'compact')}
            >
                {listViewSize === 'compact' ? 'Compact' : 'Comfortable'}
            </Button>
        </footer>
    );
}