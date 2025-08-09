export default interface ISession {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string; // Optional for passwordless authentication
  privateKeyPath?: string; // Optional for key-based authentication
  passphrase?: string; // Optional passphrase for private key
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date; // Optional field to track the last time the session was used
  status: "connected" | "connecting" | "disconnected"; // Status of the session
  notes?: string; // Optional field for additional notes about the session
  tags?: string[]; // Optional field for tagging sessions
  isFavorite?: boolean; // Optional field to mark a session as favorite
  colorLabel?: string; // Optional field for color coding sessions
  icon?: string; // Optional field for an icon representing the session
}
