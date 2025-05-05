use std::env;
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use std::sync::Arc;
use serde::Serialize;
use tauri_plugin_sql::{MigrationKind};
use log::{info, warn, error, debug, LevelFilter};

// Function to set up logging
fn setup_logging() -> Result<(), Box<dyn std::error::Error>> {
    use log4rs::append::console::ConsoleAppender;
    use log4rs::append::file::FileAppender;
    use log4rs::config::{Appender, Config, Root};
    use log4rs::encode::pattern::PatternEncoder;
    use std::path::PathBuf;
    
    // Determine log file location
    let log_dir = match dirs::data_local_dir() {
        Some(mut path) => {
            path.push("nmwk330");
            std::fs::create_dir_all(&path)?;
            path.push("logs");
            std::fs::create_dir_all(&path)?;
            path
        },
        None => {
            let mut path = PathBuf::from(".");
            path.push("logs");
            std::fs::create_dir_all(&path)?;
            path
        }
    };
    
    let log_file = log_dir.join("nmwk330.log");
    println!("Log file path: {:?}", log_file);
    
    // Create a pattern for logging
    let pattern = "{d(%Y-%m-%d %H:%M:%S)} [{l}] - {m}{n}";
    
    // Create stdout logger
    let stdout = ConsoleAppender::builder()
        .encoder(Box::new(PatternEncoder::new(pattern)))
        .build();
    
    // Create file logger
    let file = FileAppender::builder()
        .encoder(Box::new(PatternEncoder::new(pattern)))
        .build(log_file)?;
    
    // Build the configuration
    let config = Config::builder()
        .appender(Appender::builder().build("stdout", Box::new(stdout)))
        .appender(Appender::builder().build("file", Box::new(file)))
        .build(
            Root::builder()
                .appender("stdout")
                .appender("file")
                .build(LevelFilter::Debug), // Set this to Info for production, Debug for development
        )?;
    
    // Initialize the logger
    log4rs::init_config(config)?;
    
    info!("Logger initialized");
    
    Ok(())
}

// Implementation for check file folder for frontend
// Checks if the passed in directory exists, returns boolean
// Takes directory path as argument
#[tauri::command]
fn check_files_folder(dir: String) -> bool {
    debug!("Checking files folder in directory: {}", dir);
    
    // append "files" to the directory path that'll work for both windows and linux
    let path = PathBuf::from(dir).join("files");
    let exists = path.exists();
    
    info!("Files folder '{}' exists: {}", path.display(), exists);
    exists
}

// Implmentation of creating files folder for frontend
// Creates a folder named "files" in the directory passed in
// Takes directory path as argument
#[tauri::command]
fn create_files_folder(dir: String) -> bool {
    info!("Creating files folder in directory: {}", dir);
    
    let path = PathBuf::from(dir).join("files");
    let result = fs::create_dir_all(&path);
    
    match result {
        Ok(_) => {
            info!("Successfully created files folder: {}", path.display());
            true
        },
        Err(e) => {
            error!("Failed to create files folder '{}': {}", path.display(), e);
            false
        }
    }
}

#[derive(Serialize)]
struct ValidationResult {
    valid: bool,
    message: String,
    contents: Option<RunFile>,
}

#[derive(Serialize)]
struct RunFile {
    name: String,
    groups: Vec<Group>,
}

#[derive(Serialize)]
struct Group {
    name: String,
    sections: Vec<Section>,
}

#[derive(Serialize)]
struct Section {
    name: String,
    num_credits: f32,
    students: Vec<Student>,
}

#[derive(Serialize)]
struct Student {
    name: String,
    id: String,
    grade: String,
}

// Validation of the .RUN file
// Checks if the files mentioned in the .RUN file exists
#[tauri::command]
fn check_run_file(runFilePath: String) -> ValidationResult {
    info!("Validating run file: {}", runFilePath);

    let contents = match fs::read_to_string(&runFilePath) {
        Ok(data) => data,
        Err(err) => {
            error!("Error reading RUN file '{}': {}", runFilePath, err);
            return ValidationResult {
                valid: false,
                message: format!("Error reading RUN file: {}", err),
                contents: None,
            };
        }
    };

    let lines: Vec<&str> = contents.lines().collect();
    if lines.is_empty() {
        warn!("RUN file '{}' is empty", runFilePath);
        return ValidationResult {
            valid: false,
            message: "RUN file is empty".to_string(),
            contents: None,
        };
    }

    let run_name = lines[0];
    info!("Run Name: {}", run_name);
    
    let run_dir = match Path::new(&runFilePath).parent() {
        Some(dir) => dir,
        None => {
            error!("Error getting parent directory of RUN file: {}", runFilePath);
            return ValidationResult {
                valid: false,
                message: "Error getting parent directory of RUN file".to_string(),
                contents: None,
            };
        }
    };
    
    debug!("Run directory: {}", run_dir.display());
    
    // Create RunFile struct
    let mut run_file = RunFile {
        name: run_name.to_string(),
        groups: Vec::new(),
    };

    // Loop through lines in RUN file
    for grp_file in &lines[1..] {
        let grp_path = run_dir.join(grp_file);
        debug!("Processing GRP file: {}", grp_path.display());
        
        if !grp_path.exists() {
            let msg = format!("Missing .GRP File: {}", grp_path.display());
            error!("{}", msg);
            return ValidationResult {
                valid: false,
                message: msg,
                contents: None,
            };
        }

        let grp_contents = match fs::read_to_string(&grp_path) {
            Ok(data) => data,
            Err(err) => {
                let msg = format!("Error reading GRP file {}: {}", grp_path.display(), err);
                error!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            }
        };

        // Fetch content of the .GRP file
        let grp_lines: Vec<&str> = grp_contents.lines().collect();
        if grp_lines.is_empty() {
            let msg = format!("GRP file {} is empty", grp_path.display());
            warn!("{}", msg);
            return ValidationResult {
                valid: false,
                message: msg,
                contents: None,
            };
        }

        let grp_name = grp_lines[0];
        info!("Processing Group: {}", grp_name);

        // Create Group struct 
        let mut group = Group {
            name: grp_name.to_string(),
            sections: Vec::new(),
        };

        // Loop through lines in GRP file
        for sec_file in &grp_lines[1..] {
            let sec_path = run_dir.join(sec_file);
            debug!("Processing SEC file: {}", sec_path.display());
            
            if !sec_path.exists() {
                let msg = format!("Missing .SEC File: {}", sec_path.display());
                error!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            }

            // Fetch content of the .SEC file
            let sec_contents = match fs::read_to_string(&sec_path) {
                Ok(data) => data,
                Err(err) => {
                    let msg = format!("Error reading SEC file {}: {}", sec_path.display(), err);
                    error!("{}", msg);
                    return ValidationResult {
                        valid: false,
                        message: msg,
                        contents: None,
                    };
                }
            };

            let sec_lines: Vec<&str> = sec_contents.lines().collect();
            if sec_lines.is_empty() {
                let msg = format!("SEC file {} is empty", sec_path.display());
                warn!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            }

            let sec_first_line = sec_lines[0];
            // the first line of the sec file contains the section name and number of credits
            let sec_parts: Vec<&str> = sec_first_line.split_whitespace().collect();
            
            if sec_parts.is_empty() {
                let msg = format!("Invalid SEC file format {}: Missing section name", sec_path.display());
                error!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            }
            
            let sec_name = sec_parts[0];
            
            // try to fetch number of credits, if not found, return error
            let sec_credits = if sec_parts.len() > 1 {
                match sec_parts.last().unwrap().parse::<f32>() {
                    Ok(credits) => credits,
                    Err(e) => {
                        let msg = format!("Invalid number of credits in SEC file {}: {}", sec_path.display(), e);
                        error!("{}", msg);
                        return ValidationResult {
                            valid: false,
                            message: msg,
                            contents: None,
                        };
                    }
                }
            } else {
                let msg = format!("Invalid SEC file format {}: Missing credits", sec_path.display());
                error!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            };
            
            info!("Processing Section: {} (Credits: {})", sec_name, sec_credits);
            
            // Create Section struct
            let mut section = Section {
                name: sec_name.to_string(),
                num_credits: sec_credits,
                students: Vec::new(),
            };

            // Loop through lines in SEC file
            // Lines are in the format "lastname, firstname","id","grade"
            // Separate based on the comma and quotes
            for (idx, student_line) in sec_lines[1..].iter().enumerate() {
                debug!("Processing student data: {}", student_line);
                
                let student_data: Vec<&str> = student_line.split("\",\"").collect();
                if student_data.len() != 3 {
                    let msg = format!("Invalid student data in SEC file {} line {}: {}", 
                        sec_path.display(), idx + 2, student_line);
                    error!("{}", msg);
                    return ValidationResult {
                        valid: false,
                        message: msg,
                        contents: None,
                    };
                }

                let student_name = student_data[0].trim_matches(|c| c == '"' || c == ',');
                let student_id = student_data[1].trim_matches(|c| c == '"' || c == ',');
                let student_grade = student_data[2].trim_matches(|c| c == '"' || c == ',');
                
                debug!("Student: {}, ID: {}, Grade: {}", student_name, student_id, student_grade);
                
                // Create Student struct
                let student = Student {
                    name: student_name.to_string(),
                    id: student_id.to_string(),
                    grade: student_grade.to_string(),
                };

                section.students.push(student);
            }// Student loop ends
            
            info!("Added {} students to section '{}'", section.students.len(), section.name);
            group.sections.push(section);
        }// SEC File loop ends
        
        info!("Added {} sections to group '{}'", group.sections.len(), group.name);
        run_file.groups.push(group);
    }// GRP File loop ends

    info!("Validation successful for run file: {}", runFilePath);
    info!("Found {} groups in run file", run_file.groups.len());
    
    ValidationResult {
        valid: true,
        message: "All files exist and are valid.".to_string(),
        contents: Some(run_file),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Setup logging before anything else
    setup_logging().expect("Failed to set up logging");
    
    info!("Application starting up");
    
    // Load environment variables if you want to use them
    dotenvy::dotenv().ok();
    debug!("Environment variables loaded from .env file");
    
    // create startup migrations
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "Initial schema setup",
        sql: include_str!("../migrations/002_initial_schema.sql"),
        kind: MigrationKind::Up,
    }];

    debug!("Database migrations defined, setting up Tauri builder");

    tauri::Builder::default()
        .setup(|app| {
            info!("Tauri application setup starting");
            
            // Get app info for logging
            let app_handle = app.handle();
            let app_name = app_handle.package_info().name.clone();
            let version = app_handle.package_info().version.to_string();
            info!("Running {} v{}", app_name, version);
            
            // Log platform information
            #[cfg(target_os = "windows")]
            info!("Running on Windows");
            #[cfg(target_os = "macos")]
            info!("Running on macOS");
            #[cfg(target_os = "linux")]
            info!("Running on Linux");
            #[cfg(target_os = "ios")]
            info!("Running on iOS");
            #[cfg(target_os = "android")]
            info!("Running on Android");
            
            Ok(())
        })
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