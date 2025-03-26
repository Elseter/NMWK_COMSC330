use std::env;
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use tauri_plugin_sql::{Migration, MigrationKind};

// Implementation for check file folder for frontend
// Checks if the passed in directory exists, returns boolean
// Takes directory path as argument
#[tauri::command]
fn check_files_folder(dir: String) -> bool {
    // append "files" to the directory path that'll work for both windows and linux
    let path = PathBuf::from(dir).join("files");
    path.exists()
}

// Implmentation of creating files folder for frontend
// Creates a folder named "files" in the directory passed in
// Takes directory path as argument
#[tauri::command]
fn create_files_folder(dir: String) -> bool {
    let path = PathBuf::from(dir).join("files");
    fs::create_dir_all(path).is_ok()
}

// Validation of the .RUN file
// Checks if the files mentioned in the .RUN file exists
#[tauri::command]
fn check_run_file(runFilePath: String) -> bool{
    println!("Validating run file: {}", runFilePath);
    
    // Read the RUN file
    let contents = match fs::read_to_string(&runFilePath){
        Ok(data) => data,
        Err(err) => {
            eprintln!("Error reading RUN file: {}", err);
            return false
        }
    };

    // Split the contents of the RUN file by line
    let lines: Vec<&str> = contents.lines().collect();
    if lines.is_empty(){
        eprintln!("RUN file is empty");
        return false;
    }

    let _run_name = lines[0];
    println!("Run Name: {}", _run_name);
    let run_dir = Path::new(&runFilePath)
    .parent()
    .unwrap_or_else(|| {
        eprintln!("Error getting parent directory of RUN file");
        std::process::exit(1);
    });

    for grp_file in &lines[1..]{

        // For each GRP file
        // Check if they exist
        let grp_path = run_dir.join(grp_file);
        if !grp_path.exists(){
            eprintln!("File does not exist: {}", grp_path.display());
            return false;
        }

        // If they exist in the same directory as the RUN file open the 
        // GRP file and check if the files mentioned in the GRP file exist
        let grp_contents = match fs::read_to_string(&grp_path){
            Ok(data) => data,
            Err(err) => {
                eprintln!("Error reading GRP file: {}", err);
                return false;
            }
        };

        let grp_lines: Vec<&str> = grp_contents.lines().collect();
        if grp_lines.is_empty(){
            eprintln!("GRP file is empty");
            return false;
        }

        



    }

    return true;
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nmwk330.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_files_folder,
            create_files_folder,
            check_run_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
