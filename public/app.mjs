// Ensure code runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    loadBackgroundOptions();
    loadConversations();
});

// Load background options from skybox.json and populate the dropdown
async function loadBackgroundOptions() {
    const backgroundSelect = document.getElementById('background-select');
    const iframe = document.getElementById('background-iframe');

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
    const selectedUrl = backgroundSelect.value;

    if (selectedUrl) {
        iframe.src = selectedUrl;
    }
}

// Save generated conversation to localStorage with a timestamp
function saveConversation(content) {
    const timestamp = new Date().toISOString();
    localStorage.setItem(`conversation-${timestamp}`, content);
    loadConversations(); // Refresh conversation dropdown after saving
}

// Load saved conversations from localStorage into the dropdown
function loadConversations() {
    const conversationSelect = document.getElementById('conversation-select');
    conversationSelect.innerHTML = '<option value="">Select a conversation</option>'; // Reset dropdown

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('conversation-')) {
            const content = localStorage.getItem(key);
            const option = document.createElement('option');
            option.value = content;
            option.textContent = key.replace('conversation-', ''); // Display timestamp
            conversationSelect.appendChild(option);
        }
    }
}

// Display the selected conversation in the response box
function loadConversation() {
    const conversationSelect = document.getElementById('conversation-select');
    const responseDiv = document.getElementById('response');

    const selectedContent = conversationSelect.value;
    if (selectedContent) {
        responseDiv.innerHTML = marked.parse(selectedContent); // Render saved conversation as Markdown
        hljs.highlightAll();  // Apply syntax highlighting for code blocks
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
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result.text || 'No response from model.';
        responseDiv.innerHTML = marked.parse(generatedText);
        hljs.highlightAll();  // Apply syntax highlighting

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
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = marked.parse(result.text || 'No further response from model.');
        hljs.highlightAll();  // Apply syntax highlighting
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
        responseDiv.innerHTML = marked.parse(result.output || 'Command executed successfully.');
        hljs.highlightAll();  // Apply syntax highlighting
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
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = marked.parse(result.summary || 'No summary generated from the research.');
        hljs.highlightAll();  // Apply syntax highlighting
    } catch (error) {
        console.error('Error in research and summarize:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// AI-to-AI conversation with Markdown rendering
async function talkWithAnotherAI() {
    const responseDiv = document.getElementById('response');
    const huggingfaceResponseDiv = document.getElementById('huggingface-response');
    const prompt = document.getElementById('prompt').value;

    if (!responseDiv || !huggingfaceResponseDiv || !prompt) {
        console.error("Required elements not found or prompt is empty.");
        return;
    }

    // Initialize conversation in responseDiv for display
    responseDiv.innerHTML = `<p><strong>User:</strong> ${marked.parse(prompt)}</p>`;
    huggingfaceResponseDiv.style.display = 'block';

    async function aiConversation(currentPrompt, isPrimaryAI = true) {
        try {
            const response = await fetch(isPrimaryAI ? '/generate' : '/huggingface', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const aiResponse = result.text || 'No response from model.';

            const aiLabel = isPrimaryAI ? 'Primary AI' : 'Secondary AI';
            const aiClass = isPrimaryAI ? 'primary-response' : 'secondary-response';
            responseDiv.innerHTML += `
                <div class="${aiClass}">
                    <p><strong>${aiLabel}:</strong></p>
                    <div>${marked.parse(aiResponse)}</div>
                </div>
            `;
            hljs.highlightAll();  // Apply syntax highlighting
            setTimeout(() => aiConversation(aiResponse, !isPrimaryAI), 10000);
        } catch (error) {
            console.error('Error in AI-to-AI conversation:', error);
            responseDiv.innerHTML += `<p style="color:red;"><strong>Error:</strong> ${error.message}</p>`;
        }
    }

    aiConversation(prompt);
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
            body: JSON.stringify({ query: prompt, sessionId: sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.text); // Ensure Markdown is rendered correctly
        hljs.highlightAll();  // Apply syntax highlighting
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Attach functions to the window object for HTML access
window.updateBackground = updateBackground;
window.loadConversation = loadConversation;
window.executeCommand = executeCommand;
window.generateText = generateText;
window.continueText = continueText;
window.talkWithAnotherAI = talkWithAnotherAI;
window.agentChat = agentChat;
document.getElementById('research-button').onclick = researchAndSummarize;
