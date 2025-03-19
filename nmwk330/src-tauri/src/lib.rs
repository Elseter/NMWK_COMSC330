use chrono;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri_plugin_sql::{Migration, MigrationKind};
use xml2json_rs::JsonBuilder;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // create startup migrations
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "Initial schema setup",
        sql: include_str!("../migrations/002_initial_schema.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nmwk330.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
