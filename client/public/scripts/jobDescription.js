document.addEventListener("DOMContentLoaded", () => {
    // --- Get all necessary elements from the DOM ---
    const jobInput = document.getElementById("jobDescription");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const loading = document.getElementById("loading");
    const results = document.getElementById("results");

    // Elements for the file upload
    const fileInput = document.getElementById("fileInput");
    const uploadLabel = document.querySelector(".upload-label"); // The visible paperclip icon

    // --- NEW: Function to analyze a file ---
    async function analyzeFile(file) {
        // 1. Show loading state and disable buttons
        loading.classList.add("show");
        results.classList.remove("show");
        analyzeBtn.disabled = true;
        uploadLabel.style.pointerEvents = 'none'; // Disable the label
        analyzeBtn.textContent = "Analyzing File...";

        // 2. Use FormData to package the file for sending
        const formData = new FormData();
        formData.append('analysisFile', file); // 'analysisFile' MUST match your backend multer config

        try {
            // 3. Send the file to your /upload endpoint
            const response = await fetch("/api/v1/jobDesc/upload", { // Adjust this path if you have a prefix like /api/v1
                method: "POST",
                // NOTE: DO NOT set a 'Content-Type' header. 
                // The browser sets it automatically for FormData.
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const promptResponse = await response.json();
            displayResults(promptResponse.data);

        } catch (error) {
            console.error("Error during file analysis:", error);
            alert(`Error: Could not analyze the file. Details: ${error.message}`);
        } finally {
            // 4. Reset the UI
            loading.classList.remove("show");
            analyzeBtn.disabled = false;
            uploadLabel.style.pointerEvents = 'auto';
            analyzeBtn.textContent = "Analyze Job Posting";
            fileInput.value = ""; // Clear the file input so the same file can be re-selected
        }
    }

    // --- Existing function for text analysis (slightly modified) ---
    async function analyseJob(promptText) {
        // Show loading state and disable controls
        loading.classList.add("show");
        results.classList.remove("show");
        analyzeBtn.disabled = true;
        uploadLabel.style.pointerEvents = 'none'; // Also disable upload button
        analyzeBtn.textContent = "Analyzing...";

        try {
            const response = await fetch("/api/v1/jobDesc/", { // Adjust path if needed
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: promptText }),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const promptResponse = await response.json();
            displayResults(promptResponse.data);

        } catch (error) {
            console.error("Error during job analysis:", error);
            alert(`Error: Could not analyze the job description. Details: ${error.message}`);
        } finally {
            // Reset the UI
            loading.classList.remove("show");
            analyzeBtn.disabled = false;
            uploadLabel.style.pointerEvents = 'auto';
            analyzeBtn.textContent = "Analyze Job Posting";
        }
    }

    // --- Existing function to display results (no changes needed) ---
    function displayResults(data) {
        const riskBadge = document.getElementById("riskBadge");
        const riskTitle = document.getElementById("riskTitle");
        const riskSubtitle = document.getElementById("riskSubtitle");
        const redFlagsList = document.getElementById("redFlagsList");
        const recommendationsList = document.getElementById("recommendationsList");

        // Determine risk level based on score
        let riskLevel;
        let score = parseInt(data.score);
        if (score >= 6) {
            riskLevel = "danger";
        } else if (score >= 3) {
            riskLevel = "warning";
        } else {
            riskLevel = "safe";
        }

        riskBadge.className = `risk-badge ${riskLevel}`;

        const riskTitles = {
            safe: "✅ Low Risk",
            warning: "⚠️ Medium Risk",
            danger: "🚨 High Risk",
        };

        riskTitle.textContent = riskTitles[riskLevel];
        riskSubtitle.textContent = data.reason;

        // Populate Red Flags
        redFlagsList.innerHTML = "";
        if (data.red_flags && data.red_flags.length > 0) {
            data.red_flags.forEach((flag) => {
                const flagElement = document.createElement("div");
                flagElement.className = "flag-item";
                flagElement.textContent = flag;
                redFlagsList.appendChild(flagElement);
            });
        } else {
            // Special styling for "no flags" message
            const noFlags = document.createElement("div");
            noFlags.className = "flag-item";
            noFlags.style.cssText = "background: #f0fdf4; border-color: #bbf7d0; color: #166534; border-left-color: #22c55e;";
            noFlags.textContent = "No major red flags detected";
            redFlagsList.appendChild(noFlags);
        }

        // Populate Recommendations
        recommendationsList.innerHTML = "";
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach((rec) => {
                const li = document.createElement("li");
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        }

        results.classList.add("show");
    }

    // --- Event listener for the main "Analyze" button ---
    analyzeBtn.addEventListener("click", () => {
        const jobDescriptionContent = jobInput.value.trim();
        if (jobDescriptionContent) {
            analyseJob(jobDescriptionContent);
        } else {
            alert("Please paste a job description to analyze.");
        }
    });
    
    // --- NEW: Event Listeners for the file upload ---
    
    // 1. When the user clicks the paperclip icon, it triggers the hidden file input.
    uploadLabel.addEventListener('click', () => {
        fileInput.click();
    });

    // 2. When the user selects a file, the 'change' event fires.
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Start the analysis with the selected file.
            analyzeFile(file);
        }
    });
});