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

    // Loop through localStorage keys to find saved conversations
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
        responseDiv.innerText = selectedContent;
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result.text || 'No response from model.';
        responseDiv.innerText = generatedText;

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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerText = result.text || 'No further response from model.';
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
        const response = await fetch('/train', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerText = result.message || 'Training initiated successfully.';
    } catch (error) {
        console.error('Error during training:', error);
        responseDiv.innerText = `Training error: ${error.message}`;
    }
}

// Initiate an AI-to-AI conversation
async function talkWithAnotherAI() {
    const responseDiv = document.getElementById('response');
    const huggingfaceResponseDiv = document.getElementById('huggingface-response');
    const prompt = document.getElementById('prompt').value;
    responseDiv.innerText = "Starting AI-to-AI conversation...";
    huggingfaceResponseDiv.style.display = 'block';

    let conversation = `User: ${prompt}`;

    async function aiConversation(prompt, isPrimaryAI = true) {
        try {
            const response = await fetch(isPrimaryAI ? '/generate' : '/huggingface', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const aiResponse = isPrimaryAI ? result.text : result.aiReply;
            conversation += `\n\n<strong>${isPrimaryAI ? 'Primary AI' : 'Secondary AI'}:</strong> ${aiResponse}`;
            if (isPrimaryAI) {
                responseDiv.innerHTML = conversation;
            } else {
                huggingfaceResponseDiv.innerHTML = conversation;
            }

            setTimeout(() => aiConversation(aiResponse, !isPrimaryAI), 120000);
        } catch (error) {
            console.error('Error in AI-to-AI conversation:', error);
            responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
        }
    }

    aiConversation(prompt);
}

// Attach functions to the window object for HTML access
window.updateBackground = updateBackground;
window.loadConversation = loadConversation;
window.generateText = generateText;
window.continueText = continueText;
window.trainAI = trainAI;
window.talkWithAnotherAI = talkWithAnotherAI;
