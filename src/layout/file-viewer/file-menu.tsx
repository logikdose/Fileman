import {
  FolderPlus,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tabId?: string;
  trigger: React.ReactNode;
  onCreateFolder?: () => void;
  onCreateBookmark?: () => void;
  onDelete?: () => void;
}

export default function FileMenu({ open, setOpen, trigger, onCreateFolder, onCreateBookmark }: Props) {

  // Render
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              // Handle create folder action
              onCreateFolder?.();
            }}
          >
            <FolderPlus size={16} className="opacity-60" aria-hidden="true" />
            <span>New Folder</span>
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              // Handle create bookmark action
              onCreateBookmark?.();
            }}
          >
            <FolderPlus size={16} className="opacity-60" aria-hidden="true" />
            <span>Bookmark</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
