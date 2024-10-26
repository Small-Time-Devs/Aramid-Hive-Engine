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

// Train AI with the input from the prompt box
async function trainAI() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Training...";

    try {
        // Initial training request to `/train`
        const initialResponse = await fetch('/train', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!initialResponse.ok) {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }

        const initialResult = await initialResponse.json();
        const initialText = initialResult.message || 'Initial training response received.';
        responseDiv.innerHTML = `<div><strong>Initial Response:</strong><br>${marked.parse(initialText)}</div>`;
        hljs.highlightAll();  // Apply syntax highlighting

        // Wait 10 seconds, then send follow-up request to `/train/follow-up`
        setTimeout(async () => {
            try {
                const followUpResponse = await fetch('/train/follow-up', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initialText: initialText }),
                });

                if (!followUpResponse.ok) {
                    throw new Error(`HTTP error! status: ${followUpResponse.status}`);
                }

                const followUpResult = await followUpResponse.json();
                const refinedText = followUpResult.message || 'Follow-up response completed.';

                responseDiv.innerHTML += `<div style="margin-top: 10px;"><strong>Refined Response:</strong><br>${marked.parse(refinedText)}</div>`;
                hljs.highlightAll();  // Apply syntax highlighting
            } catch (error) {
                console.error('Error in follow-up training:', error);
                responseDiv.innerHTML += `<p style="color:red;"><strong>Follow-up training error:</strong> ${error.message}</p>`;
            }
        }, 10000); // 10-second delay
    } catch (error) {
        console.error('Error during initial training:', error);
        responseDiv.innerHTML = `<p style="color:red;"><strong>Training error:</strong> ${error.message}</p>`;
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

// Attach functions to the window object for HTML access
window.updateBackground = updateBackground;
window.loadConversation = loadConversation;
window.executeCommand = executeCommand;
window.generateText = generateText;
window.continueText = continueText;
window.trainAI = trainAI;
window.executeCommand = executeCommand;
window.talkWithAnotherAI = talkWithAnotherAI;
document.getElementById('research-button').onclick = researchAndSummarize;
