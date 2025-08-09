// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sftp; // Include the refactored sftp module
use sftp::*; // Import all re-exported functions from the sftp module

mod types;
use std::sync::Mutex;
use types::ConnectionManager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(ConnectionManager::new()))
        .invoke_handler(tauri::generate_handler![
            connect_sftp,
            disconnect_sftp,
            upload_file,
            download_file,
            delete_item,
            rename_item,
            list_directory,
            create_directory,
            delete_directory,
            delete_directory_recursive,
            fetch_directory_size,
            cancel_directory_size,
            fetch_storage_info,
            cancel_transfer,
            get_active_transfers,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
