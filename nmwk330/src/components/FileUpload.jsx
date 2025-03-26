
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import "./FileUpload.css";

const FileUpload = () => {
    const [isValid, setIsValid] = useState(false);
    const [warning, setWarning] = useState('');

    const selectRunFile = async () => {
        try {
            const filePath = await open({
                filters: [{ name: "RUN Files", extensions: ["run", "txt"] }],
            });

            if (!filePath){
                console.log("No file selected");
                return; // Error or Cancelled
            }
            const result = await invoke("check_run_file", { runFilePath: filePath });

            if (result.valid) {
                setIsValid(true);
                setWarning('');
            } else {
                setIsValid(false);
                setWarning(result.message);
            }
        } catch (error) {
            console.error("Error selecting file:", error);
        }
    };
    return (
        <div className="file-upload-container">
            <button onClick={selectRunFile}>Select .RUN File</button>
            {warning && <p>{warning}</p>}
            {isValid && <button onClick={() => console.log("Upload triggered")}>Upload</button>}
        </div>
    );
};

export default FileUpload;