use crate::types::*;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::io::prelude::*;
use std::path::Path;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use tauri::Emitter;
use tauri::State;
use tauri::Window;
use uuid::Uuid;

type ConnectionManagerState = Mutex<ConnectionManager>;

// Global transfer cancel manager
static TRANSFER_CANCEL_MAP: Lazy<Mutex<HashMap<String, Arc<AtomicBool>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
pub async fn upload_file(
    connection_id: String,
    local_path: String,
    remote_path: String,
    connections: State<'_, ConnectionManagerState>,
    window: Window,
) -> Result<String, String> {
    let conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get(&connection_id)
        .ok_or("Connection not found")?
        .clone();

    // Generate a unique transfer ID and create a cancel flag
    let transfer_id = Uuid::new_v4().to_string();
    let cancel_flag = Arc::new(AtomicBool::new(false));
    TRANSFER_CANCEL_MAP
        .lock()
        .unwrap()
        .insert(transfer_id.clone(), cancel_flag.clone());

    // Spawn a new task for the upload
    let transfer_id_return = transfer_id.clone();
    tokio::spawn({
        let transfer_id = transfer_id.clone(); // Move transfer_id into the task
        async move {
            let sftp = session
                .sftp()
                .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

            let mut local_file = std::fs::File::open(&local_path)
                .map_err(|e| format!("Failed to open local file: {}", e))?;

            let total_size = local_file
                .metadata()
                .map_err(|e| format!("Failed to stat local file: {}", e))?
                .len();

            let mut remote_file = sftp
                .create(Path::new(&remote_path))
                .map_err(|e| format!("Failed to create remote file: {}", e))?;

            let mut buffer = [0u8; 8192];
            let mut transferred = 0u64;
            let mut cancelled = false;

            loop {
                let n = local_file
                    .read(&mut buffer)
                    .map_err(|e| format!("Read error: {}", e))?;
                if n == 0 {
                    break;
                }
                remote_file
                    .write_all(&buffer[..n])
                    .map_err(|e| format!("Write error: {}", e))?;
                transferred += n as u64;

                // Emit progress event
                window
                    .emit(
                        "upload_progress",
                        serde_json::json!({
                            "connection_id": connection_id,
                            "path": remote_path,
                            "transferred": transferred,
                            "total": total_size,
                            "type": "upload",
                            "transfer_id": transfer_id
                        }),
                    )
                    .ok();

                // Check for cancellation
                if cancel_flag.load(Ordering::Relaxed) {
                    window
                        .emit(
                            "transfer_cancelled",
                            serde_json::json!({
                                "transfer_id": transfer_id,
                                "type": "upload"
                            }),
                        )
                        .ok();
                    cancelled = true;
                    break;
                }
            }

            // After transfer loop (success or error)
            TRANSFER_CANCEL_MAP.lock().unwrap().remove(&transfer_id);

            // Emit process_finished event if not cancelled
            if !cancelled {
                window
                    .emit(
                        "process_finished",
                        serde_json::json!({
                            "connection_id": connection_id,
                            "path": remote_path,
                            "type": "upload",
                            "transfer_id": transfer_id
                        }),
                    )
                    .ok();
            }

            Ok::<(), String>(())
        }
    });

    Ok(transfer_id_return)
}

#[tauri::command]
pub async fn download_file(
    connection_id: String,
    remote_path: String,
    local_path: String,
    connections: State<'_, ConnectionManagerState>,
    window: Window,
) -> Result<String, String> {
    let conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get(&connection_id)
        .ok_or("Connection not found")?
        .clone();

    // Generate a unique transfer ID and create a cancel flag
    let transfer_id = Uuid::new_v4().to_string();
    let cancel_flag = Arc::new(AtomicBool::new(false));
    TRANSFER_CANCEL_MAP
        .lock()
        .unwrap()
        .insert(transfer_id.clone(), cancel_flag.clone());

    // Spawn a new task for the download
    let transfer_id_return = transfer_id.clone();
    tokio::spawn({
        let transfer_id = transfer_id.clone(); // Move transfer_id into the task
        async move {
            let sftp = session
                .sftp()
                .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

            // Open remote file
            let mut remote_file = sftp
                .open(Path::new(&remote_path))
                .map_err(|e| format!("Failed to open remote file: {}", e))?;

            // Get file size for progress
            let stat = sftp
                .stat(Path::new(&remote_path))
                .map_err(|e| format!("Failed to stat remote file: {}", e))?;
            let total_size = stat.size.unwrap_or(0);

            // Create local file
            let mut local_file = std::fs::File::create(&local_path)
                .map_err(|e| format!("Failed to create local file: {}", e))?;

            // Copy in chunks and emit progress
            let mut buffer = [0u8; 8192];
            let mut transferred = 0u64;
            let mut cancelled = false;
            loop {
                let n = remote_file
                    .read(&mut buffer)
                    .map_err(|e| format!("Read error: {}", e))?;
                if n == 0 {
                    break;
                }
                local_file
                    .write_all(&buffer[..n])
                    .map_err(|e| format!("Write error: {}", e))?;
                transferred += n as u64;

                // Emit progress event to frontend
                window
                    .emit(
                        "download_progress",
                        serde_json::json!({
                            "connection_id": connection_id,
                            "path": remote_path,
                            "transferred": transferred,
                            "total": total_size,
                            "type": "download",
                            "transfer_id": transfer_id
                        }),
                    )
                    .ok();

                // Check for cancellation
                if cancel_flag.load(Ordering::Relaxed) {
                    window
                        .emit(
                            "transfer_cancelled",
                            serde_json::json!({
                                "transfer_id": transfer_id,
                                "type": "download"
                            }),
                        )
                        .ok();
                    cancelled = true;
                    break;
                }
            }

            // After transfer loop (success or error)
            TRANSFER_CANCEL_MAP.lock().unwrap().remove(&transfer_id);

            // Emit process_finished event if not cancelled
            if !cancelled {
                window
                    .emit(
                        "process_finished",
                        serde_json::json!({
                            "connection_id": connection_id,
                            "path": remote_path,
                            "type": "download",
                            "transfer_id": transfer_id
                        }),
                    )
                    .ok();
            }

            Ok::<(), String>(())
        }
    });

    Ok((transfer_id_return))
}

#[tauri::command]
pub async fn delete_item(
    connection_id: String,
    path: String,
    is_directory: bool,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    if is_directory {
        // Use recursive deletion for directories
        delete_directory_recursive_helper(&sftp, &path)?;
    } else {
        sftp.unlink(Path::new(&path))
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

// Helper function for recursive directory deletion
fn delete_directory_recursive_helper(sftp: &ssh2::Sftp, path: &str) -> Result<(), String> {
    let dir_path = Path::new(path);

    // List directory contents
    let entries = sftp
        .readdir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;

    // Delete all contents first
    for (file_path, stat) in entries {
        let file_path_str = file_path.to_string_lossy().replace("\\", "/");

        // Skip . and .. entries
        let name = file_path.file_name().unwrap_or_default().to_string_lossy();

        if name == "." || name == ".." {
            continue;
        }

        if stat.is_dir() {
            // Recursively delete subdirectory
            delete_directory_recursive_helper(sftp, &file_path_str)?;
        } else {
            // Delete file
            sftp.unlink(&file_path)
                .map_err(|e| format!("Failed to delete file {}: {}", file_path_str, e))?;
        }
    }

    // Now delete the empty directory
    sftp.rmdir(dir_path)
        .map_err(|e| format!("Failed to delete directory {}: {}", path, e))?;

    Ok(())
}

#[tauri::command]
pub async fn rename_item(
    connection_id: String,
    old_path: String,
    new_path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    sftp.rename(Path::new(&old_path), Path::new(&new_path), None)
        .map_err(|e| format!("Failed to rename item: {}", e))?;

    Ok(())
}

// Cancel transfer
#[tauri::command]
pub async fn cancel_transfer(transfer_id: String) -> Result<(), String> {
    let cancel_map = TRANSFER_CANCEL_MAP.lock().unwrap();

    if let Some(cancel_flag) = cancel_map.get(&transfer_id) {
        cancel_flag.store(true, Ordering::Relaxed);
        Ok(())
    } else {
        Err(format!(
            "Transfer with ID {} not found or already completed",
            transfer_id
        ))
    }
}

// Get list of active transfers
#[tauri::command]
pub async fn get_active_transfers() -> Result<Vec<String>, String> {
    let cancel_map = TRANSFER_CANCEL_MAP.lock().unwrap();
    Ok(cancel_map.keys().cloned().collect())
}

#[tauri::command]
pub async fn copy_item(
    connection_id: String,
    source_path: String,
    dest_path: String,
    is_directory: bool,
    connections: State<'_, ConnectionManagerState>,
    window: Window,
) -> Result<String, String> {
    let conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    // Generate a unique transfer ID and create a cancel flag
    let transfer_id = Uuid::new_v4().to_string();
    let cancel_flag = Arc::new(AtomicBool::new(false));
    TRANSFER_CANCEL_MAP
        .lock()
        .unwrap()
        .insert(transfer_id.clone(), cancel_flag.clone());

    // Spawn a new task for the copy operation
    let transfer_id_return = transfer_id.clone();
    tokio::spawn({
        let transfer_id = transfer_id.clone();
        let window = window.clone();
        async move {
            if is_directory {
                copy_directory_recursive_with_progress(
                    &sftp,
                    &source_path,
                    &dest_path,
                    &window,
                    &transfer_id,
                    cancel_flag.clone(),
                )?;
            } else {
                copy_file_with_progress(
                    &sftp,
                    &source_path,
                    &dest_path,
                    &window,
                    &transfer_id,
                    cancel_flag.clone(),
                )?;
            }

            // Remove the transfer ID from the cancel map
            TRANSFER_CANCEL_MAP.lock().unwrap().remove(&transfer_id);

            // Emit process_finished event
            window
                .emit(
                    "process_finished",
                    serde_json::json!({
                        "connection_id": connection_id,
                        "path": dest_path,
                        "type": "copy",
                        "transfer_id": transfer_id
                    }),
                )
                .ok();

            Ok::<(), String>(())
        }
    });

    Ok(transfer_id_return)
}

fn copy_file_with_progress(
    sftp: &ssh2::Sftp,
    src: &str,
    dst: &str,
    window: &Window,
    transfer_id: &str,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let mut src_file = sftp
        .open(Path::new(src))
        .map_err(|e| format!("Failed to open source file: {}", e))?;
    let mut dst_file = sftp
        .create(Path::new(dst))
        .map_err(|e| format!("Failed to create destination file: {}", e))?;

    let total_size = src_file
        .stat()
        .map_err(|e| format!("Failed to stat source file: {}", e))?
        .size
        .unwrap_or(0);

    let mut buffer = [0u8; 8192];
    let mut transferred = 0u64;
    let mut cancelled = false;

    loop {
        let n = src_file
            .read(&mut buffer)
            .map_err(|e| format!("Read error: {}", e))?;
        if n == 0 {
            break;
        }
        dst_file
            .write_all(&buffer[..n])
            .map_err(|e| format!("Write error: {}", e))?;
        transferred += n as u64;

        // Emit progress event
        window
            .emit(
                "copy_progress",
                serde_json::json!({
                    "path": dst,
                    "transferred": transferred,
                    "total": total_size,
                    "type": "copy",
                    "transfer_id": transfer_id
                }),
            )
            .ok();

        // Check for cancellation
        if cancel_flag.load(Ordering::Relaxed) {
            window
                .emit(
                    "transfer_cancelled",
                    serde_json::json!({
                        "transfer_id": transfer_id,
                        "type": "copy"
                    }),
                )
                .ok();
            cancelled = true;
            break;
        }
    }

    if cancelled {
        Err("Copy operation cancelled".to_string())
    } else {
        Ok(())
    }
}

fn copy_directory_recursive_with_progress(
    sftp: &ssh2::Sftp,
    src: &str,
    dst: &str,
    window: &Window,
    transfer_id: &str,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let src_path = Path::new(src);
    let dst_path = Path::new(dst);
    sftp.mkdir(dst_path, 0o755)
        .map_err(|e| format!("Failed to create destination directory {}: {}", dst, e))?;

    let entries = sftp
        .readdir(src_path)
        .map_err(|e| format!("Failed to read source directory {}: {}", src, e))?;

    for (file_path, stat) in entries {
        let name = file_path.file_name().unwrap_or_default().to_string_lossy();
        if name == "." || name == ".." {
            continue;
        }
        let src_child = file_path.to_string_lossy().replace("\\", "/");
        let dst_child = format!("{}/{}", dst, name);

        if stat.is_dir() {
            copy_directory_recursive_with_progress(
                sftp,
                &src_child,
                &dst_child,
                window,
                transfer_id,
                cancel_flag.clone(),
            )?;
        } else {
            copy_file_with_progress(
                sftp,
                &src_child,
                &dst_child,
                window,
                transfer_id,
                cancel_flag.clone(),
            )?;
        }

        // Check for cancellation
        if cancel_flag.load(Ordering::Relaxed) {
            return Err("Copy operation cancelled".to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn move_item(
    connection_id: String,
    source_path: String,
    dest_path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    sftp.rename(Path::new(&source_path), Path::new(&dest_path), None)
        .map_err(|e| format!("Failed to move item: {}", e))?;
    Ok(())
}
