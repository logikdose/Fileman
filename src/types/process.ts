export type Process = {
  connection_id: string;
  path: string;
  transferred: number;
  total: number;
  type: "upload" | "download";
  transfer_id: string;
  status: "active" | "cancelled" | "completed";
};
