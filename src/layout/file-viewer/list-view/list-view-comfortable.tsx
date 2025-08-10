import useClipboardStore from "@/stores/clipboard.store";
import useTabStore from "@/stores/tab.store";
import { FileItem } from "@/types/FileItem";
import { bytesSizeToString, fileExtensionFromName, fileNameWithoutExtension, getIconForFileType } from "@/utils/file.util";
import { Copy, Scissors } from "lucide-react";

type Props = {
    file: FileItem;
}

export default function ListViewComfortable({ file }: Props) {
    // Store
    const tab = useTabStore((state) => state.getTabById(state.activeTabId));
    const clipboardItems = useClipboardStore((state) => state.items);

    // Render
    return (
        <div
            key={file.path}
            className={`hover:bg-muted text-xs flex items-center py-1 px-2 rounded border ${tab?.selectedFiles.includes(file.path) ? 'bg-blue-500/10 border-blue-500' : 'bg-background border-transparent'}`}
        >
            <div className="flex-1 flex items-center gap-2">
                <span className="border rounded-md size-[36px] flex items-center justify-center">
                    {file.is_directory ? (
                        file.name === '..' ? (
                            <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline w-6 h-6" />
                        ) : (
                            <img src={getIconForFileType(file.name, true)} alt="Folder Icon" className="inline w-6 h-6" />
                        )
                    ) : (
                        <img src={getIconForFileType(file.name)} alt="File Icon" className="inline w-6 h-6" />
                    )}
                </span>
                <div className={
                    "flex-1 flex flex-col justify-between "
                    + (clipboardItems.find(item => item.file.path === file.path && item.sessionId === tab?.session?.id && item.action === "cut") ? "opacity-30" : "")
                }>
                    <span className="text">{fileNameWithoutExtension(file.name)}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{file.is_directory ? 'Folder' : fileExtensionFromName(file.name)}</span>
                </div>
            </div>
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