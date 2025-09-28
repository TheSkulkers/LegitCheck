async function validateDomain(domain) {
    const apiURL = 'https://legitcheck-bdbmb4ajc9deh0ag.canadacentral-01.azurewebsites.net/html/jobDescription.html/api/validate-domain';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
    }
}

async function webScraping(data) {
    const apiURL = 'https://legitcheck-bdbmb4ajc9deh0ag.canadacentral-01.azurewebsites.net/html/jobDescription.html/api/submit-data';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
    }
}

async function riskAnalysis(data) {
    const apiURL = 'https://legitcheck-bdbmb4ajc9deh0ag.canadacentral-01.azurewebsites.net/html/jobDescription.html/api/generate-content';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.search-button').addEventListener('click', async () => {
        const domainInput = document.querySelector('.search-input').value;
        if (domainInput) {
            const result = await validateDomain(domainInput);
            if (result.success) {
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

    document.querySelector('#scrapingBtn').addEventListener('click', () => {
        const form = document.getElementById("detailsForm");
        const modal = document.getElementById("myFormModal");
        const closeButton = document.querySelector(".close-button");

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                action: "getArticles",
                keyword: form.name.value,
                lang: "eng",
                ignoreSourceGroupUri: "paywall/paywalled_sources",
                articlesPage: 1,
                articlesCount: 5,
                articlesSortBy: "date",
                articlesSortByAsc: false,
                dataType: ["news", "pr"],
                forceMaxDataTimeWindow: 31,
                resultType: "articles",
                apiKey: "dd18f533-34f2-4def-9a43-a7a505ca2adf"
            };

            const scrapeResult = await webScraping(formData);
            console.log("Submitted JSON:", JSON.stringify(formData, null, 2));

            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key.startsWith('scrapedItem_')) {
                    sessionStorage.removeItem(key);
                }
            }

            if (scrapeResult && scrapeResult.apiResult && Array.isArray(scrapeResult.apiResult)) {
                scrapeResult.apiResult.forEach((item, index) => {
                    const uniqueKey = 'scrapedItem_' + index;
                    sessionStorage.setItem(uniqueKey, JSON.stringify(item));
                    console.log(`Saved item to key: ${uniqueKey}`);
                });
                sessionStorage.setItem('scrapedItemCount', scrapeResult.apiResult.length);
            }

            const webscrapDiv = document.getElementById('webscrapResults');
            if (scrapeResult && scrapeResult.apiResult && Array.isArray(scrapeResult.apiResult)) {
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
            modal.style.display = "none";
        });

        modal.style.display = "block";

        closeButton.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    });

    document.querySelector('#riskAnalysisBtn').addEventListener('click', async () => {
        const itemCount = parseInt(sessionStorage.getItem('scrapedItemCount') || '0', 10);
        const retrievedArray = [];

        for (let i = 0; i < itemCount; i++) {
            const uniqueKey = 'scrapedItem_' + i;
            const itemString = sessionStorage.getItem(uniqueKey);
            if (itemString) {
                retrievedArray.push(JSON.parse(itemString));
            }
        }

        const articlesText = retrievedArray.map(a => `${a.title}\n${a.body}`).join("\n\n");
        const riskResult = await riskAnalysis({ data: articlesText });
        console.log("Risk Analysis Result:", riskResult);

        const resultsSection = document.getElementById('resultsSection');
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
            }

            if (parsed) {
                let riskClass = '';
                if (parsed.legitimacyScore >= 80) riskClass = 'risk-low';
                else if (parsed.legitimacyScore >= 50) riskClass = 'risk-medium';
                else riskClass = 'risk-high';

                riskLevelDiv.className = 'risk-level ' + riskClass;
                riskLevelDiv.textContent = `Risk Level: ${parsed.legitimacyScore} (${parsed.sentiment})`;
                articlesCountDiv.textContent = itemCount;
                sentimentScoreDiv.textContent = parsed.sentiment;
                scamIndicatorsDiv.textContent = parsed.scamIndicators && parsed.scamIndicators.length ? parsed.scamIndicators.join(', ') : 'None';
                onlinePresenceDiv.textContent = parsed.ghostCompanyPatterns && parsed.ghostCompanyPatterns.length ? parsed.ghostCompanyPatterns.join(', ') : 'None';
                resultsSection.classList.add('active');
            } else {
                riskLevelDiv.textContent = 'Risk Level: Unable to parse AI response.';
                resultsSection.classList.add('active');
            }
        } else {
            riskLevelDiv.textContent = 'Risk Level: No result.';
            resultsSection.classList.add('active');
        }
    });
});