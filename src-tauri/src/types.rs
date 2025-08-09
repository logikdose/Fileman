use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub private_key_path: Option<String>,
    pub passphrase: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64, // Unix timestamp
    pub permissions: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransferProgress {
    pub transferred: u64,
    pub total: u64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageInfo {
    pub total_space: u64,
    pub used_space: u64,
}

// Connection manager to keep track of active connections
pub type ConnectionId = String;
pub type ConnectionManager = HashMap<ConnectionId, ssh2::Session>;
