document.addEventListener("DOMContentLoaded", () => {
    const jobInput = document.getElementById("jobDescription");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const loading = document.getElementById("loading");
    const results = document.getElementById("results");
    const fileInput = document.getElementById("fileInput");
    const uploadLabel = document.querySelector(".upload-label");

    function getLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.log("Geolocation is not supported by your browser.");
                resolve(null); 
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error.message);
                    resolve(null); 
                }
            );
        });
    }

    async function analyzeFile(file) {
        loading.classList.add("show");
        results.classList.remove("show");
        analyzeBtn.disabled = true;
        uploadLabel.style.pointerEvents = 'none';
        analyzeBtn.textContent = "Analyzing File...";

        const location = await getLocation();

        const formData = new FormData();
        formData.append('analysisFile', file);
        
        if (location) {
            formData.append('location', JSON.stringify(location));
        }

        try {
            const response = await fetch("/api/v1/jobDesc/upload", {
                method: "POST",
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
            loading.classList.remove("show");
            analyzeBtn.disabled = false;
            uploadLabel.style.pointerEvents = 'auto';
            analyzeBtn.textContent = "Analyze Job Posting";
            fileInput.value = "";
        }
    }
    
    async function analyseJob(promptText) {
        loading.classList.add("show");
        results.classList.remove("show");
        analyzeBtn.disabled = true;
        uploadLabel.style.pointerEvents = 'none';
        analyzeBtn.textContent = "Analyzing...";

        const location = await getLocation(); 

        try {
            const response = await fetch("/api/v1/jobDesc/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
    
                body: JSON.stringify({ 
                    prompt: promptText,
                    location: location
                }),
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
            loading.classList.remove("show");
            analyzeBtn.disabled = false;
            uploadLabel.style.pointerEvents = 'auto';
            analyzeBtn.textContent = "Analyze Job Posting";
        }
    }
    
    function displayResults(data) {
        const riskBadge = document.getElementById("riskBadge");
        const riskTitle = document.getElementById("riskTitle");
        const riskSubtitle = document.getElementById("riskSubtitle");
        const redFlagsList = document.getElementById("redFlagsList");
        const recommendationsList = document.getElementById("recommendationsList");

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
        redFlagsList.innerHTML = "";
        if (data.red_flags && data.red_flags.length > 0) {
            data.red_flags.forEach((flag) => {
                const flagElement = document.createElement("div");
                flagElement.className = "flag-item";
                flagElement.textContent = flag;
                redFlagsList.appendChild(flagElement);
            });
        } else {
            const noFlags = document.createElement("div");
            noFlags.className = "flag-item";
            noFlags.style.cssText = "background: #f0fdf4; border-color: #bbf7d0; color: #166534; border-left-color: #22c55e;";
            noFlags.textContent = "No major red flags detected";
            redFlagsList.appendChild(noFlags);
        }
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
    analyzeBtn.addEventListener("click", () => {
        const jobDescriptionContent = jobInput.value.trim();
        if (jobDescriptionContent) {
            analyseJob(jobDescriptionContent);
        } else {
            alert("Please paste a job description to analyze.");
        }
    });
    uploadLabel.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            analyzeFile(file);
        }
    });
});