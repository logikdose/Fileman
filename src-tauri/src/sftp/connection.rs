use crate::types::*;
use ssh2::Session;
use std::net::TcpStream;
use std::path::Path;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

type ConnectionManagerState = Mutex<ConnectionManager>;

#[tauri::command]
pub async fn connect_sftp(
    config: ConnectionConfig,
    connections: State<'_, ConnectionManagerState>,
) -> Result<String, String> {
    let connection_id = Uuid::new_v4().to_string();

    let tcp = TcpStream::connect(format!("{}:{}", config.host, config.port))
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let mut session = Session::new().map_err(|e| format!("Failed to create session: {}", e))?;
    session.set_tcp_stream(tcp);
    session
        .handshake()
        .map_err(|e| format!("SSH handshake failed: {}", e))?;

    if let Some(private_key_path) = &config.private_key_path {
        session
            .userauth_pubkey_file(
                &config.username,
                None,
                Path::new(private_key_path),
                config.passphrase.as_deref(),
            )
            .map_err(|e| format!("Key authentication failed: {}", e))?;
    } else if let Some(password) = &config.password {
        session
            .userauth_password(&config.username, password)
            .map_err(|e| format!("Password authentication failed: {}", e))?;
    } else {
        return Err("No authentication method provided".to_string());
    }

    if !session.authenticated() {
        return Err("Authentication failed".to_string());
    }

    connections
        .lock()
        .unwrap()
        .insert(connection_id.clone(), session);

    Ok(connection_id)
}

#[tauri::command]
pub async fn disconnect_sftp(
    connection_id: String,
    connections: State<'_, ConnectionManagerState>,
) -> Result<(), String> {
    let mut conn_manager = connections.lock().unwrap();

    if let Some(mut session) = conn_manager.remove(&connection_id) {
        let _ = session.disconnect(None, "User disconnected", None);
    }

    Ok(())
}
