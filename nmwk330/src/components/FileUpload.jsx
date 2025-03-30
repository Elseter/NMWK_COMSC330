
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import "./FileUpload.css";

const FileUpload = () => {
    const [isValid, setIsValid] = useState(false);
    const [warning, setWarning] = useState('');
    const [runResults, setRunResults] = useState(null);

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
            } else {
                setIsValid(false);
                setWarning(result.message);
            }
        } catch (error) {
            console.error("Error selecting file:", error);
        }
    };
    return (
        <div>
            <div className="file-upload-container">
                <button onClick={selectRunFile}>Select .RUN File</button>
                {warning && <p>{warning}</p>}
                {isValid && <button onClick={() => console.log("Upload triggered")}>Upload</button>}
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