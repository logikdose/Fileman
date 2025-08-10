import useClipboardStore from "@/stores/clipboard.store";
import useTabStore from "@/stores/tab.store";
import { FileItem } from "@/types/FileItem"
import { bytesSizeToString, getIconForFileType } from "@/utils/file.util";
import { Check, Copy, Scissors } from "lucide-react";

type Props = {
    file: FileItem;
    onToggleSelection: (file: FileItem, checked: boolean) => void;
}

export default function ListViewCompact({ file, onToggleSelection }: Props) {
    // Store
    const tab = useTabStore((state) => state.getTabById(state.activeTabId));
    const clipboardItems = useClipboardStore((state) => state.items);

    // Render
    return (
        <div
            key={file.path}
            className={
                "hover:bg-muted text-xs flex items-center py-1 rounded border "
                + (tab?.selectedFiles.includes(file.path) ? "bg-blue-500/10 border-blue-500 " : "bg-background border-transparent ")
            }
        >
            <div
                className="py-1 px-2"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Toggle selection
                    const checked = tab?.selectedFiles.includes(file.path);
                    if (checked) {
                        onToggleSelection(file, false);
                    } else {
                        onToggleSelection(file, true);
                    }
                }}
            >
                <div
                    className="border rounded-sm size-4 flex items-center justify-center cursor-pointer hover:bg-muted/20"
                >
                    {tab?.selectedFiles.includes(file.path) ? (
                        <Check className="size-3 text-muted-foreground" />
                    ) : (
                        <div className="bg-background border-transparent" />
                    )}
                </div>
            </div>
            <span className={
                "flex-1 flex items-center gap-2 "
                + (clipboardItems.find(item => item.file.path === file.path && item.sessionId === tab?.session?.id && item.action === "cut") ? "opacity-30" : "")
            }>
                {file.is_directory ? (
                    file.name === '..' ? (
                        <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline mr-1 w-6 h-6" />
                    ) : (
                        <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline mr-1 w-6 h-6" />
                    )
                ) : (
                    <img src={getIconForFileType(file.name)} alt="File Icon" className="inline mr-1 w-6 h-6" />
                )}
                {file.name}
            </span>
            {clipboardItems.find(item => item.file.path === file.path && item.sessionId === tab?.session?.id) && (
                <span className="text-xs text-muted-foreground">
                    {clipboardItems.find(item => item.file.path === file.path && item.sessionId === tab?.session?.id)?.action === "cut" ? <Scissors className="size-3" /> : <Copy className="size-3" />}
                </span>
            )}
            <span
                className="w-24 text-right text-muted-foreground"
            >{file.is_directory ? '-' : bytesSizeToString(file.size)}</span>
            <span
                className="w-32 text-right text-muted-foreground pr-4"
            >
                {new Date(file.modified).toLocaleDateString()}
            </span>
        </div>
    )
}