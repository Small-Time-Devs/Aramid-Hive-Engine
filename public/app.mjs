// Ensure code runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    loadBackgroundOptions();
});

// Helper function to render Markdown with syntax highlighting
function renderMarkdown(text) {
    if (typeof marked === 'undefined') {
        console.error("Marked.js library is not loaded.");
        return text; // Fallback to plain text if marked is unavailable
    }

    const html = marked.parse(text, {
        highlight: (code, lang) => {
            return hljs ? hljs.highlightAuto(code, [lang]).value : code;
        },
    });

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
        hljs?.highlightAll(); // Apply syntax highlighting if hljs is available

        // Save the generated conversation to localStorage
        saveConversation(generatedText);
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Continue AI text generation based on existing response
async function continueText() {
    const responseDiv = document.getElementById('response');
    const currentText = responseDiv.innerText;
    responseDiv.innerText += "\n\nContinuing...";

    const prompt = `${currentText}\n\nPlease elaborate further and provide additional insights.`;

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
        responseDiv.innerHTML = renderMarkdown(result.text || 'No further response from model.');
        hljs?.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
    }
}

// Execute command on server and send text to Notepad if required
async function executeCommand() {
    const commandInput = document.getElementById('command-input').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Executing command...";

    try {
        const response = await fetch('/execute-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: commandInput }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.output || 'Command executed successfully.');
        hljs?.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error executing command:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Research and Summarize function
async function researchAndSummarize() {
    const query = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Researching and summarizing...";

    try {
        const response = await fetch('/research-and-summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.summary || 'No summary generated from the research.');
        hljs?.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error in research and summarize:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Handle agent-based chat
async function agentChat() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
    localStorage.setItem('sessionId', sessionId);

    responseDiv.innerText = "Processing...";

    try {
        const response = await fetch('/agent-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: prompt, sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.text || 'No response from the agent.');
        hljs?.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Attach functions to the window object for HTML access
window.updateBackground = updateBackground;
window.generateText = generateText;
window.continueText = continueText;
window.agentChat = agentChat;
document.getElementById('research-button')?.addEventListener('click', researchAndSummarize);
