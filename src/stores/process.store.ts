import { Process } from "@/types/process";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ProcessStore {
  // Config
  autoClearSuccess: boolean;
  setAutoClearSuccess: (value: boolean) => void;
  downloadPath: string | null;
  setDownloadPath: (value: string | null) => void;

  // State
  processes: Process[];
  addProcess: (process: Process) => void;
  updateProcess: (transferId: string, updates: Partial<Process>) => void;
  removeProcess: (transferId: string) => void;
}

const useProcessStore = create<ProcessStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        autoClearSuccess: false,
        setAutoClearSuccess: (value: boolean) => set({ autoClearSuccess: value }),
        downloadPath: null,
        setDownloadPath: (value: string | null) => set({ downloadPath: value }),

        // State
        processes: [],
        addProcess: (process: Process) => {
          // Check if the process already exists
          const existingProcess = get().processes.find((p) => p.transfer_id === process.transfer_id);
          if (existingProcess) {
            // If it exists, update the existing process
            return;
          }

          set((state) => {
            state.processes.push(process); // <-- Correct way with immer
          });
        },
        updateProcess: (transferId: string, updates: Partial<Process>) => {
          set((state) => {
            const index = state.processes.findIndex((p) => p.transfer_id === transferId);
            if (index !== -1) {
              state.processes[index] = { ...state.processes[index], ...updates };
            }
          });
        },
        removeProcess: (transferId: string) => {
          set((state) => {
            state.processes = state.processes.filter((p) => p.transfer_id !== transferId);
          });
        },
      })),
      { name: "process-store" }
    )
  )
);

export default useProcessStore;
