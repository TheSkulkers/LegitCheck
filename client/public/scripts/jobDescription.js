document.addEventListener("DOMContentLoaded", () => {
  const jobInput = document.getElementById("jobDescription");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");

  async function analyseJob(promptText) {
    loading.classList.add("show");
    results.classList.remove("show");
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {
      const response = await fetch("/api/v1/jobDesc/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const promptResponse = await response.json();
      const summaryText = promptResponse.data;

      displayResults(summaryText);

    } catch (error) {
      console.error("Error during job analysis:", error);
      alert(`Error: Could not analyze the job description. Details: ${error.message}`);
    } finally {
      loading.classList.remove("show");
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "🔍 Analyze Job Posting";
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
      noFlags.style.cssText = "background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #166534; border-color: #bbf7d0; border-left-color: #22c55e;";
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

  function handleAnalyzeClick() {
    const jobDescriptionContent = jobInput.value.trim();
    if (jobDescriptionContent) {
      analyseJob(jobDescriptionContent);
    } else {
      alert("Please paste a job description to analyze.");
    }
  }

  analyzeBtn.addEventListener("click", handleAnalyzeClick);

  jobInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyzeClick();
    }
  });

  jobInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.max(220, this.scrollHeight) + "px";
  });
});
