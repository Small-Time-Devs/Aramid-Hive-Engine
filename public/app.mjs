// Ensure code runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    loadBackgroundOptions();
});

// Helper function to render Markdown with syntax highlighting
function renderMarkdown(text) {
    if (typeof marked === 'undefined') {
        console.error("Marked.js library is not loaded.");
        return text; // Fallback to plain text if Marked is unavailable
    }

    const html = marked.parse(text);
    return html;
}

// Load background options from skybox.json and populate the dropdown
async function loadBackgroundOptions() {
    const backgroundSelect = document.getElementById('background-select');
    const iframe = document.getElementById('background-iframe');

    if (!backgroundSelect || !iframe) {
        console.warn("Background options elements not found in the DOM.");
        return;
    }

    try {
        const response = await fetch('/skyboxBackgrounds/skybox.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch backgrounds: ${response.statusText} (${response.status})`);
        }

        const backgrounds = await response.json();
        console.log('Background options loaded:', backgrounds);

        // Populate dropdown with background options
        backgrounds.forEach((background, index) => {
            const option = document.createElement('option');
            option.value = background.url;
            option.textContent = background.name;
            backgroundSelect.appendChild(option);

            // Set the first background as default
            if (index === 0) {
                backgroundSelect.value = background.url;
                iframe.src = background.url;
            }
        });
    } catch (error) {
        console.error('Error loading backgrounds:', error.message || error);
    }
}

// Update iframe with the selected background
function updateBackground() {
    const backgroundSelect = document.getElementById('background-select');
    const iframe = document.getElementById('background-iframe');

    if (!backgroundSelect || !iframe) {
        console.warn("Background update elements not found in the DOM.");
        return;
    }

    const selectedUrl = backgroundSelect.value;

    if (selectedUrl) {
        iframe.src = selectedUrl;
    }
}

// Generate AI text and save it as a conversation
async function generateText() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Generating...";

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result.text || 'No response from model.';
        responseDiv.innerHTML = renderMarkdown(generatedText);

        if (typeof hljs !== 'undefined') {
            hljs.highlightAll(); // Apply syntax highlighting if hljs is available
        } else {
            console.error("Highlight.js library is not loaded.");
        }

        // Save the generated conversation to localStorage
        saveConversation(generatedText);
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}
