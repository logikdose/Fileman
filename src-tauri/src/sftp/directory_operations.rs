use crate::sftp::utils::format_permissions;
use crate::types::*;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::path::Path;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::time::Duration;
use tauri::{Emitter, State, Window};
use uuid::Uuid;

type ConnectionManagerState = Mutex<ConnectionManager>;

// Global directory size calculation cancel manager
static DIRECTORY_SIZE_CANCEL_MAP: Lazy<Mutex<HashMap<String, Arc<AtomicBool>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
pub async fn list_directory(
    connection_id: String,
    path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<Vec<FileItem>, String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    let mut files = Vec::new();

    // Add parent directory entry if not root
    // if path != "/" {
    //     files.push(FileItem {
    //         name: "..".to_string(),
    //         path: get_parent_path(&path),
    //         is_directory: true,
    //         size: 0,
    //         modified: 0,
    //         permissions: "drwxr-xr-x".to_string(),
    //     });
    // }

    let dir_path = Path::new(&path);
    let entries = sftp
        .readdir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for (file_path, stat) in entries {
        let name = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        if name.starts_with('.') && name != ".." {
            continue; // Skip hidden files for simplicity
        }

        files.push(FileItem {
            name,
            path: file_path.to_string_lossy().replace("\\", "/"),
            is_directory: stat.is_dir(),
            size: stat.size.unwrap_or(0),
            modified: stat.mtime.unwrap_or(0),
            permissions: format_permissions(stat.perm.unwrap_or(0)),
        });
    }

    // Sort: directories first, then files
    files.sort_by(|a, b| {
        if a.name == ".." {
            return std::cmp::Ordering::Less;
        }
        if b.name == ".." {
            return std::cmp::Ordering::Greater;
        }
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(files)
}

#[tauri::command]
pub async fn create_directory(
    connection_id: String,
    path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    sftp.mkdir(Path::new(&path), 0o755)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    Ok(())
}

// Delete directory with files (recursive)
#[tauri::command]
pub async fn delete_directory_recursive(
    connection_id: String,
    path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    delete_directory_recursive_helper(&sftp, &path)?;
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

// Delete directory (only if empty)
#[tauri::command]
pub async fn delete_directory(
    connection_id: String,
    path: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get_mut(&connection_id)
        .ok_or("Connection not found")?;

    let sftp = session
        .sftp()
        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

    sftp.rmdir(Path::new(&path))
        .map_err(|e| format!("Failed to delete directory: {}", e))?;

    Ok(())
}

// Fetch directory size (recursive) with cancellation support
#[tauri::command]
pub async fn fetch_directory_size(
    connection_id: String,
    path: String,
    connections: State<'_, ConnectionManagerState>,
    window: Window,
) -> Result<String, String> {
    let conn_manager = connections.lock().unwrap();
    let session = conn_manager
        .get(&connection_id)
        .ok_or("Connection not found")?
        .clone();

    // Generate a unique operation ID and create a cancel flag
    let operation_id = Uuid::new_v4().to_string();
    let cancel_flag = Arc::new(AtomicBool::new(false));
    DIRECTORY_SIZE_CANCEL_MAP
        .lock()
        .unwrap()
        .insert(operation_id.clone(), cancel_flag.clone());

    // Spawn a new task for the size calculation with timeout
    let operation_id_return = operation_id.clone();
    tokio::spawn({
        let operation_id = operation_id.clone();
        async move {
            let result = tokio::time::timeout(
                Duration::from_secs(300), // 5 minutes timeout
                async {
                    let sftp = session
                        .sftp()
                        .map_err(|e| format!("Failed to create SFTP channel: {}", e))?;

                    calculate_directory_size_recursive(
                        &sftp,
                        &path,
                        &cancel_flag,
                        &window,
                        &operation_id,
                    )
                },
            )
            .await;

            // Clean up the cancel flag
            DIRECTORY_SIZE_CANCEL_MAP
                .lock()
                .unwrap()
                .remove(&operation_id);

            match result {
                Ok(Ok(size)) => {
                    // Emit success event
                    window
                        .emit(
                            "directory_size_completed",
                            serde_json::json!({
                                "operation_id": operation_id,
                                "path": path,
                                "size": size,
                                "success": true
                            }),
                        )
                        .ok();
                }
                Ok(Err(error)) => {
                    // Emit error event
                    window
                        .emit(
                            "directory_size_completed",
                            serde_json::json!({
                                "operation_id": operation_id,
                                "path": path,
                                "error": error,
                                "success": false
                            }),
                        )
                        .ok();
                }
                Err(_) => {
                    // Timeout occurred
                    window
                        .emit(
                            "directory_size_completed",
                            serde_json::json!({
                                "operation_id": operation_id,
                                "path": path,
                                "error": "Operation timed out after 5 minutes",
                                "success": false
                            }),
                        )
                        .ok();
                }
            }

            Ok::<(), String>(())
        }
    });

    Ok(operation_id_return)
}

// Cancel directory size calculation
#[tauri::command]
pub async fn cancel_directory_size(operation_id: String) -> Result<(), String> {
    let cancel_map = DIRECTORY_SIZE_CANCEL_MAP.lock().unwrap();

    if let Some(cancel_flag) = cancel_map.get(&operation_id) {
        cancel_flag.store(true, Ordering::Relaxed);
        Ok(())
    } else {
        Err(format!(
            "Directory size operation with ID {} not found or already completed",
            operation_id
        ))
    }
}

// Helper function for recursive directory size calculation with cancellation
fn calculate_directory_size_recursive(
    sftp: &ssh2::Sftp,
    path: &str,
    cancel_flag: &Arc<AtomicBool>,
    window: &Window,
    operation_id: &str,
) -> Result<u64, String> {
    // Check for cancellation at the start of each directory
    if cancel_flag.load(Ordering::Relaxed) {
        window
            .emit(
                "directory_size_cancelled",
                serde_json::json!({
                    "operation_id": operation_id,
                    "path": path
                }),
            )
            .ok();
        return Err("Operation cancelled by user".to_string());
    }

    let dir_path = Path::new(path);
    let mut total_size = 0u64;
    let mut file_count = 0u32;

    // List directory contents
    let entries = sftp
        .readdir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;

    for (file_path, stat) in entries {
        // Check for cancellation during iteration
        if cancel_flag.load(Ordering::Relaxed) {
            window
                .emit(
                    "directory_size_cancelled",
                    serde_json::json!({
                        "operation_id": operation_id,
                        "path": path
                    }),
                )
                .ok();
            return Err("Operation cancelled by user".to_string());
        }

        // Skip . and .. entries
        let name = file_path.file_name().unwrap_or_default().to_string_lossy();

        if name == "." || name == ".." {
            continue;
        }

        let file_path_str = file_path.to_string_lossy().replace("\\", "/");

        if stat.is_dir() {
            // Recursively calculate subdirectory size
            let subdir_size = calculate_directory_size_recursive(
                sftp,
                &file_path_str,
                cancel_flag,
                window,
                operation_id,
            )?;
            total_size = total_size.saturating_add(subdir_size);
        } else {
            // Add file size
            let file_size = stat.size.unwrap_or(0);
            total_size = total_size.saturating_add(file_size);
            file_count += 1;

            // Emit progress every 100 files to avoid overwhelming the frontend
            if file_count % 100 == 0 {
                window
                    .emit(
                        "directory_size_progress",
                        serde_json::json!({
                            "operation_id": operation_id,
                            "current_path": file_path_str,
                            "current_size": total_size,
                            "files_processed": file_count
                        }),
                    )
                    .ok();
            }
        }
    }

    Ok(total_size)
}
