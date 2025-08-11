import { FileItem } from "@/types/FileItem";

export default interface IClipboardItem {
    id: string;
    file: FileItem;
    sessionId: string;
    action: "copy" | "cut";
    status: "pending" | "success" | "error";
}