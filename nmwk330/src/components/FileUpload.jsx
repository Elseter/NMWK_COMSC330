
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import Database from '@tauri-apps/plugin-sql';
import "./FileUpload.css";

const FileUpload = () => {
    const [isValid, setIsValid] = useState(false);
    const [warning, setWarning] = useState('');
    const [runResults, setRunResults] = useState(null);
    const [runId, setRunId] = useState(null);

    const selectRunFile = async () => {
        try {
            const filePath = await open({
                filters: [{ name: "RUN Files", extensions: ["run", "txt"] }],
            });
            if (!filePath) {
                console.log("No file selected");
                return; // Error or Cancelled
            }
            const result = await invoke("check_run_file", { runFilePath: filePath });

            if (result.valid) {
                setIsValid(true);
                setWarning('');
                // Loop through the array of groups
                for (const group of result.contents.groups) {
                    console.log(group.name);
                    for (const section of group.sections) {
                        console.log(section.name);
                        for (const student of section.students) {
                            console.log(student.name);
                            console.log(student.id);
                            console.log(student.grade);
                        }
                    }
                }
                setRunResults(result.contents);
                console.log(result.contents);
            } else {
                setIsValid(false);
                setWarning(result.message);
            }
        } catch (error) {
            console.error("Error selecting file:", error);
        }
    };

    const handleUpload = async () => {
        try{
            const db = await Database.load("sqlite:nmwk330.db");
            // check if the run already exists in the database
            const runExists = await db.select("SELECT * FROM runs WHERE name = ?", [runResults.name]);
            if (runExists.length > 0) {
                console.log(runExists);
                setRunId(runExists[0].run_id);
                console.log(runExists[0].run_id);
                setWarning("Run already exists in the database.");
                return;
            }
            // Insert the run into the database
            await db.execute("INSERT INTO runs (name) VALUES (?)", [runResults.name]);
            const run = await db.select("SELECT run_id FROM runs WHERE name = ?", [runResults.name]);
            const runId = run[0].run_id;
            console.log(runId);

            // Loop through the array of groups
            for (const group of runResults.groups) {
                // Insert the group into the database
                await db.execute("INSERT INTO groups (run_id, group_name, group_gpa) VALUES (?, ?, ?)", [
                    runId, group.name, null
                ]);
                const groupData = await db.select("SELECT group_id FROM groups WHERE run_id = ? AND group_name = ?", [runId, group.name]);
                const groupId = groupData[0].group_id;

                // Loop through the array of sections
                for (const section of group.sections){
                    // Insert the section into the database
                    await db.execute("INSERT INTO sections (run_id, section_name, credit_hours, section_gpa) VALUES (?, ?, ?, ?)", [
                        runId, section.name, section.num_credits, null
                    ]);
                    const sectionData = await db.select("SELECT section_id FROM sections WHERE run_id = ? AND section_name = ?", [runId, section.name]);
                    const sectionId = sectionData[0].section_id;
                    console.log(sectionData);

                    // Insert section group relationship
                    await db.execute("INSERT INTO section_groups (section_id, group_id, run_id) VALUES (?, ?, ?)", [
                        sectionId, groupId, runId
                    ]);

                    // Loop through the array of students
                    for (const student of section.students){
                        // Check if the student already exists in the database for this run
                        const studentExists = await db.select("SELECT 1 FROM students WHERE student_id = ? AND run_id = ?", [
                            student.id, runId
                        ]);

                        if (studentExists.length === 0) {
                            // Insert the student if they don't exist in this run_id
                            await db.execute("INSERT INTO students (student_id, run_id, name, cumulative_gpa) VALUES (?, ?, ?, ?)", [
                                student.id, runId, student.name, null
                            ]);
                        } else {
                            console.log(`Student ${student.id} is already added for this run_id ${runId}`);
                        }
                
                        if (student.grade === "A+") {
                            console.log(section.name, student.id, student.grade);
                            student.grade = "A";
                        }
                        // Insert the student grade
                        await db.execute("INSERT INTO grades (student_id, section_id, run_id, letter_grade, numeric_grade) VALUES (?, ?, ?, ?, ?)", [
                            student.id, sectionId, runId, student.grade, null
                        ]);
                    }
                }
            }
            setWarning("");
            console.log("File uploaded successfully");
        } catch (error) {
            console.error("Error uploading file:", error);
            setWarning("An error occurred while uploading the file. See console for details.");
        }
    };

    const wipeData = async () => {
        try {
            if (!runId) {
                setWarning("No run ID to wipe.");
                return;
            }

            const db = await Database.load("sqlite:nmwk330.db");

            // Start by deleting from the most specific tables (foreign key constraints will protect the integrity)
            await db.execute("DELETE FROM grades WHERE run_id = ?", [runId]);
            await db.execute("DELETE FROM students WHERE run_id = ?", [runId]);
            await db.execute("DELETE FROM section_groups WHERE run_id = ?", [runId]);
            await db.execute("DELETE FROM sections WHERE run_id = ?", [runId]);
            await db.execute("DELETE FROM groups WHERE run_id = ?", [runId]);
            await db.execute("DELETE FROM runs WHERE run_id = ?", [runId]);

            setWarning("Data wiped successfully.");
            setRunId(null); // Reset runId
            setRunResults(null); // Optionally reset the runResults state
            console.log("Data wiped successfully.");
        } catch (error) {
            console.error("Error wiping data:", error);
            setWarning("An error occurred while wiping the data.");
        }
    };

    return (
        <div>
            <div className="file-upload-container">
                <button onClick={selectRunFile}>Select .RUN File</button>
                {warning && <p>{warning}</p>}
                {isValid && <button onClick={handleUpload}>Upload</button>}
                {isValid && <button onClick={wipeData}>Wipe Data</button>} {/* Wipe Data Button */}
            </div>

            {isValid && runResults && (
                <div className="results-container">
                    <h2>Run File Contents: {runResults.name}</h2>
                    <div className="results-columns">
                        <div className="group-column">
                            <h3>Groups</h3>
                            {runResults.groups.map((group, groupIndex) => (
                                <div key={groupIndex} className="group-item">
                                    {group.name}
                                </div>
                            ))}
                        </div>

                        <div className="section-column">
                            <h3>Sections</h3>
                            {runResults.groups.map((group, groupIndex) => (
                                <div key={groupIndex} className="group-sections">
                                    <div className="group-name">{group.name}</div>
                                    {group.sections.map((section, sectionIndex) => (
                                        <div key={sectionIndex} className="section-item">
                                            {section.name}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="student-column">
                            <h3>Students</h3>
                            {runResults.groups.map((group, groupIndex) => (
                                <div key={groupIndex} className="group-students">
                                    <div className="group-name">{group.name}</div>
                                    {group.sections.map((section, sectionIndex) => (
                                        <div key={sectionIndex} className="section-students">
                                            <div className="section-name">{section.name}</div>
                                            {section.students.map((student, studentIndex) => (
                                                <div key={studentIndex} className="student-item">
                                                    {student.name} (ID: {student.id}, Grade: {student.grade})
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;