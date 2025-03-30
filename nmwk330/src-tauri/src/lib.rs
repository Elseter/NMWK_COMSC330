use std::env;
use std::fs;
use std::path::PathBuf;
use std::path::Path;
use serde::Serialize;
use tauri_plugin_sql::{MigrationKind};

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
    println!("Validating run file: {}", runFilePath);

    let contents = match fs::read_to_string(&runFilePath) {
        Ok(data) => data,
        Err(err) => {
            eprintln!("Error reading RUN file: {}", err);
            return ValidationResult {
                valid: false,
                message: format!("Error reading RUN file: {}", err),
                contents: None,
            };
        }
    };

    let lines: Vec<&str> = contents.lines().collect();
    if lines.is_empty() {
        return ValidationResult {
            valid: false,
            message: "RUN file is empty".to_string(),
            contents: None,
        };
    }

    let _run_name = lines[0];
    println!("Run Name: {}", _run_name);
    let run_dir = Path::new(&runFilePath)
        .parent()
        .unwrap_or_else(|| {
            eprintln!("Error getting parent directory of RUN file");
            std::process::exit(1);
        });
    
    // Create RunFile struct
    let mut run_file = RunFile {
        name: _run_name.to_string(),
        groups: Vec::new(),
    };

    // Loop through lines in RUN file
    for grp_file in &lines[1..] {
        let grp_path = run_dir.join(grp_file);
        if !grp_path.exists() {
            let msg = format!("Missing .GRP File: {}", grp_path.display());
            eprintln!("{}", msg);
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
                eprintln!("{}", msg);
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
            return ValidationResult {
                valid: false,
                message: format!("GRP file {} is empty", grp_path.display()),
                contents: None,
            };
        }

        let _grp_name = grp_lines[0];
        println!("GRP Name: {}", _grp_name);

        // Create Group struct 
        let mut group = Group {
            name: _grp_name.to_string(),
            sections: Vec::new(),
        };

        // Loop through lines in GRP file
        for sec_file in &grp_lines[1..] {
            let sec_path = run_dir.join(sec_file);
            if !sec_path.exists() {
                let msg = format!("Missing .SEC File: {}", sec_path.display());
                eprintln!("{}", msg);
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
                    eprintln!("{}", msg);
                    return ValidationResult {
                        valid: false,
                        message: msg,
                        contents: None,
                    };
                }
            };

            let sec_lines: Vec<&str> = sec_contents.lines().collect();
            if sec_lines.is_empty() {
                return ValidationResult {
                    valid: false,
                    message: format!("SEC file {} is empty", sec_path.display()),
                    contents: None,
                };
            }

            let _sec_first_line = sec_lines[0];
            // the first line of the sec file contains the section name and number of credits
            // try to fetch name and number of credits, if not found, return error
            let _sec_name = _sec_first_line.split_whitespace().next();
            let _sec_credits = _sec_first_line.split_whitespace().last();
            // try to convert the number of credits to an integer, if not possible, return error
            let _sec_credits = match _sec_credits {
                Some(credits) => match credits.parse::<f32>() {
                    Ok(credits) => credits,
                    Err(_) => {
                        let msg = format!("Invalid number of credits in SEC file {}: {}", sec_path.display(), _sec_credits.unwrap());
                        eprintln!("{}", msg);
                        return ValidationResult {
                            valid: false,
                            message: msg,
                            contents: None,
                        };
                    }
                },
                None => {
                    let msg = format!("Invalid number of credits in SEC file {}: {}", sec_path.display(), _sec_credits.unwrap());
                    eprintln!("{}", msg);
                    return ValidationResult {
                        valid: false,
                        message: msg,
                        contents: None,
                    };
                }
            };

            // check if name and number of credits are found
            if _sec_name.is_none() {
                let msg = format!("Invalid SEC file {}: {}", sec_path.display(), _sec_first_line);
                eprintln!("{}", msg);
                return ValidationResult {
                    valid: false,
                    message: msg,
                    contents: None,
                };
            }
            
            // Create Section struct
            let mut section = Section {
                name: _sec_name.unwrap().to_string(),
                num_credits: _sec_credits,
                students: Vec::new(),
            };

            // Loop through lines in SEC file
            // Lines are in the format "lastname, firstname","id","grade"
            // Seperate based on the comma and quotes
            for student_line in &sec_lines[1..] {
                let student_data: Vec<&str> = student_line.split("\",\"").collect();
                if student_data.len() != 3 {
                    let msg = format!("Invalid student data in SEC file {}: {}", sec_path.display(), student_line);
                    eprintln!("{}", msg);
                    return ValidationResult {
                        valid: false,
                        message: msg,
                        contents: None,
                    };
                }

                let _student_name = student_data[0].trim_matches(|c| c == '"' || c == ',');
                let _student_id = student_data[1].trim_matches(|c| c == '"' || c == ',');
                let _student_grade = student_data[2].trim_matches(|c| c == '"' || c == ',');
                
                // Create Student struct
                let student = Student {
                    name: _student_name.to_string(),
                    id: _student_id.to_string(),
                    grade: _student_grade.to_string(),
                };

                section.students.push(student);
            }// Student loop ends
            group.sections.push(section);
        }// SEC File loop ends
        run_file.groups.push(group);
    }// GRP File loop ends

    ValidationResult {
        valid: true,
        message: "All files exist and are valid.".to_string(),
        contents: Some(run_file),
    }
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
