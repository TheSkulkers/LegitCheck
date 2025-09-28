// Helper function to manage loading state
function showLoading(isLoading, loadingElement, resultElements) {
    if (isLoading) {
        loadingElement.classList.add('show');
        resultElements.forEach(el => {
            if (el) el.classList.remove('active');
        });
    } else {
        loadingElement.classList.remove('show');
    }
}

async function validateDomain(domain, loadingElement, resultElements) {
    showLoading(true, loadingElement, resultElements);
    const apiURL = '/api/validate-domain';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: domain })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Validation result:', data);
        return data;

    } catch (error) {
        console.error('Domain validation failed:', error);
        return { success: false, message: error.message };
    } finally {
        showLoading(false, loadingElement, resultElements);
    }
}

async function webScraping(data, loadingElement, resultElements) {
    showLoading(true, loadingElement, resultElements);
    const apiURL = '/api/submit-data';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('NewsAPI results:', result);
        return result;

    } catch (error) {
        console.error('NewsAPI failed to fetch', error);
        return { success: false, message: error.message };
    } finally {
        showLoading(false, loadingElement, resultElements);
    }
}

async function riskAnalysis(data, loadingElement, resultElements) {
    showLoading(true, loadingElement, resultElements);
    const apiURL = '/api/generate-content';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('GeminiAPI failed to fetch', error);
        return { success: false, message: error.message };
    } finally {
        showLoading(false, loadingElement, resultElements);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Get references to elements
    const loadingSection = document.getElementById('loadingSection');
    const webscrapDiv = document.getElementById('webscrapResults');
    const resultsSection = document.getElementById('resultsSection');
    const searchButton = document.querySelector('.search-button');
    const domainInput = document.querySelector('.search-input');
    const scrapingBtn = document.querySelector('#scrapingBtn');
    const riskAnalysisBtn = document.querySelector('#riskAnalysisBtn');

    searchButton.addEventListener('click', async () => {
        const domainValue = domainInput.value;
        if (domainValue) {
            const result = await validateDomain(domainValue, loadingSection, [webscrapDiv, resultsSection]);
            if (result.success) {
                // Your existing success logic
                alert(`Domain is valid: ${result.validationResult.ValidDomain}`);
                if (result.validationResult.ValidDomain) {
                    document.querySelector('.valid-domain-indicator').style.display = 'inline';
                    document.querySelector('.invalid-domain-indicator').style.display = 'none';
                } else {
                    document.querySelector('.valid-domain-indicator').style.display = 'none';
                    document.querySelector('.invalid-domain-indicator').style.display = 'inline';
                }
            } else {
                alert(`Validation failed: ${result.message}`);
            }
        } else {
            alert('Please enter a domain to analyze.');
        }
    });

    scrapingBtn.addEventListener('click', () => {
        const form = document.getElementById("detailsForm");
        const modal = document.getElementById("myFormModal");
        const closeButton = document.querySelector(".close-button");

        // Use a flag to avoid attaching multiple submit listeners
        if (form.dataset.listenerAttached) return;
        form.dataset.listenerAttached = 'true';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                action: "getArticles",
                keyword: form.name.value,
                lang: "eng",
                articlesCount: 15,
                articlesSortBy: "date",
                dataType: ["news", "pr"],
                apiKey: "dd18f533-34f2-4def-9a43-a7a505ca2adf" // Note: Be careful with hardcoding API keys client-side
            };
            
            modal.style.display = "none"; // Hide modal immediately
            const scrapeResult = await webScraping(formData, loadingSection, [webscrapDiv, resultsSection]);

            // Clear previous session storage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key.startsWith('scrapedItem_')) {
                    sessionStorage.removeItem(key);
                }
            }
            
            // Your existing logic for handling scrapeResult...
            if (scrapeResult && scrapeResult.apiResult && Array.isArray(scrapeResult.apiResult)) {
                scrapeResult.apiResult.forEach((item, index) => {
                    const uniqueKey = 'scrapedItem_' + index;
                    sessionStorage.setItem(uniqueKey, JSON.stringify(item));
                });
                sessionStorage.setItem('scrapedItemCount', scrapeResult.apiResult.length);
                
                const previewArticles = scrapeResult.apiResult.slice(0, 3);
                webscrapDiv.innerHTML = `<h3>Scraped Articles Preview (${scrapeResult.apiResult.length} total)</h3>` +
                    previewArticles.map(article => `
                        <div class="article-preview">
                            <div class="article-title">${article.title || 'No Title'}</div>
                            <div class="article-body">${article.body ? article.body.substring(0, 120) + '...' : ''}</div>
                        </div>`).join('') +
                    `<button class="cta-button show-all-btn" id="showAllArticlesBtn">Show All Articles</button>`;

                document.getElementById('showAllArticlesBtn').onclick = function() {
                    webscrapDiv.innerHTML = `<h3>All Scraped Articles (${scrapeResult.apiResult.length})</h3>` +
                        scrapeResult.apiResult.map(article => `
                            <div class="article-preview">
                                <div class="article-title">${article.title || 'No Title'}</div>
                                <div class="article-body">${article.body || ''}</div>
                            </div>`).join('');
                };
            } else {
                webscrapDiv.innerHTML = '<p>No articles found or error occurred.</p>';
            }
            form.reset();
        });

        modal.style.display = "block";
        closeButton.onclick = () => modal.style.display = "none";
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = "none";
        }
    });

    riskAnalysisBtn.addEventListener('click', async () => {
        const itemCount = parseInt(sessionStorage.getItem('scrapedItemCount') || '0', 10);
        if (itemCount === 0) {
            alert("Please scrape some articles first before running the analysis.");
            return;
        }

        const retrievedArray = [];
        for (let i = 0; i < itemCount; i++) {
            const itemString = sessionStorage.getItem('scrapedItem_' + i);
            if (itemString) retrievedArray.push(JSON.parse(itemString));
        }

        const articlesText = retrievedArray.map(a => `${a.title}\n${a.body}`).join("\n\n");
        const riskResult = await riskAnalysis({ data: articlesText }, loadingSection, [webscrapDiv, resultsSection]);

        console.log("Risk Analysis Result:", riskResult);
        
        // References to result elements
        const riskLevelDiv = document.getElementById('riskLevel');
        const articlesCountDiv = document.getElementById('articlesCount');
        const sentimentScoreDiv = document.getElementById('sentimentScore');
        const scamIndicatorsDiv = document.getElementById('scamIndicators');
        const onlinePresenceDiv = document.getElementById('onlinePresence');

        if (riskResult && riskResult.success && riskResult.generatedText) {
            let raw = riskResult.generatedText.trim();
            if (raw.startsWith("```json")) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
            else if (raw.startsWith("```")) raw = raw.replace(/^```/, '').replace(/```$/, '').trim();

            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                parsed = null;
                console.error("Failed to parse JSON from AI response:", raw);
            }

            if (parsed) {
                let riskClass = '';
                if (parsed.legitimacyScore >= 80) riskClass = 'risk-low';
                else if (parsed.legitimacyScore >= 50) riskClass = 'risk-medium';
                else riskClass = 'risk-high';

                riskLevelDiv.className = 'risk-level ' + riskClass;
                riskLevelDiv.textContent = `Risk Level: ${parsed.legitimacyScore} (${parsed.sentiment})`;
                articlesCountDiv.textContent = itemCount;
                sentimentScoreDiv.textContent = parsed.sentiment.charAt(0).toUpperCase() + parsed.sentiment.slice(1);
                scamIndicatorsDiv.textContent = parsed.scamIndicators && parsed.scamIndicators.length ? parsed.scamIndicators.join(', ') : 'None';
                onlinePresenceDiv.textContent = parsed.ghostCompanyPatterns && parsed.ghostCompanyPatterns.length ? parsed.ghostCompanyPatterns.join(', ') : 'None';
            } else {
                riskLevelDiv.textContent = 'Risk Level: Unable to parse AI response.';
            }
        } else {
            riskLevelDiv.textContent = 'Risk Level: No result from analysis.';
        }
        resultsSection.classList.add('active'); // Show the results section
    });
});