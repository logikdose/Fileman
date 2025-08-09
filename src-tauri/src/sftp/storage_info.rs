use crate::types::*;
use std::sync::Mutex;
use tauri::State;

type ConnectionManagerState = Mutex<ConnectionManager>;

#[tauri::command]
pub async fn fetch_storage_info(
    connection_id: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<StorageInfo, String> {
    let conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get(&connection_id)
        .ok_or("Connection not found")?
        .clone();

    session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    // Logic to fetch storage info
    Ok(StorageInfo {
        total_space: 1000000, // Example value
        used_space: 500000,   // Example value
    })
}
