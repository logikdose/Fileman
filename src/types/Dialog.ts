export type DialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";
export type DialogPosition = "center" | "top" | "bottom";
export type DialogAnimation = "fade" | "slide" | "scale" | "slideUp" | "slideDown";

export interface DialogConfig {
  id: string;
  type: DialogType;
  title?: string;
  size?: DialogSize;
  position?: DialogPosition;
  animation?: DialogAnimation;
  backdrop?: boolean; // Show backdrop
  backdropClose?: boolean; // Close on backdrop click
  escapeClose?: boolean; // Close on ESC key
  persistent?: boolean; // Prevent closing until action is taken
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  zIndex?: number;
  data?: any; // Data passed to dialog
  onClose?: () => void;
  onConfirm?: (result?: any) => void;
  onCancel?: () => void;
}

export type DialogType = "settings" | "sessionWizard" | "sessionEdit" | "fileUpload" | "fileDownload" | "confirmation" | "alert" | "prompt" | "fileEditor" | "permissions" | "transfer" | "about" | "keyboardShortcuts" | "custom";

export interface DialogState {
  isOpen: boolean;
  isClosing: boolean;
  config: DialogConfig;
}
