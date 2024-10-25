// Ensure all code runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');  // Log to confirm script loading

    // Function to generate AI text
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
            console.log(result); // Debugging log to see the backend response
    
            responseDiv.innerText = result.text || 'No response from model.';
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerText = `An error occurred: ${error.message}`;
        }
    }

    // Function to continue AI text generation
    async function continueText() {
        const responseDiv = document.getElementById('response');
        const currentText = responseDiv.innerText;
        responseDiv.innerText += "\n\nContinuing...";

        const prompt = `${currentText}\n\nPlease elaborate more, make this better so I can make a profit using this, and explain how to use it at the end of each response.`;

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),  // Send the prompt to the backend
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();  // Expect a JSON response
            responseDiv.innerText = result.text || 'No response from model.';
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
        }
    }

    // Function to train the AI
    async function trainAI() {
        const responseDiv = document.getElementById('response');
        const prompt = document.getElementById('prompt').value;
        responseDiv.innerText = "Training...";

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),  // Send the prompt to the backend
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();  // Expect a JSON response
            responseDiv.innerText = result.text || 'No response from model.';
            autoSaveConversation();

            // Start the loop to continue improving the program every 5 minutes
            setInterval(async () => {
                const currentText = responseDiv.innerText;
                const followUpPrompt = `${currentText}\n\nPlease elaborate more, make this better so I can make a profit using this, and explain how to use it at the end of each response.`;
                try {
                    const followUpResponse = await fetch('/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ prompt: followUpPrompt }),  // Send the prompt to the backend
                    });

                    if (!followUpResponse.ok) {
                        throw new Error(`HTTP error! status: ${followUpResponse.status}`);
                    }

                    const followUpResult = await followUpResponse.json();  // Expect a JSON response
                    responseDiv.innerText = followUpResult.text || 'No response from model.';
                } catch (error) {
                    console.error('Error:', error);
                    responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
                }
            }, 300000);  // 5 minutes interval
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerText = `An error occurred: ${error.message}`;
        }
    }

    // Function to handle AI-to-AI conversation
    async function talkWithAnotherAI() {
        const responseDiv = document.getElementById('response');
        const huggingfaceResponseDiv = document.getElementById('huggingface-response');
        const prompt = document.getElementById('prompt').value;
        responseDiv.innerText = "Starting AI-to-AI conversation...";
        huggingfaceResponseDiv.style.display = 'block';

        let conversation = `User: ${prompt}`;

        async function aiConversation(prompt, isAramid = true) {
            try {
                const response = await fetch(isAramid ? '/generate' : '/huggingface', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: prompt }),  // Send the prompt to the backend
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();  // Expect a JSON response
                const aiResponse = isAramid ? result.text : result.aiReply;
                conversation += `\n\n<strong>${isAramid ? 'Aramid' : 'Hugging Face AI'}:</strong> ${aiResponse}`;
                if (isAramid) {
                    responseDiv.innerHTML = marked.parse(conversation);
                } else {
                    huggingfaceResponseDiv.innerHTML = marked.parse(conversation);
                }

                // Continue the conversation
                setTimeout(() => aiConversation(aiResponse, !isAramid), 120000);  // Wait 2 minutes before the next response
            } catch (error) {
                console.error('Error:', error);
                responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
            }
        }

        aiConversation(prompt);
    }

    // Function to handle AI response display and parsing
    async function handleAIResponse(result, append = false) {
        const responseDiv = document.getElementById('response');
        try {
            if (result.choices && result.choices[0].text) {
                const parsedMarkdown = marked.parse(result.choices[0].text);
                if (append) {
                    responseDiv.innerHTML += parsedMarkdown;
                } else {
                    responseDiv.innerHTML = parsedMarkdown;
                }
                hljs.highlightAll();  // Highlight code blocks if any
                animateAvatar();
            } else if (result.text) {
                const parsedMarkdown = marked.parse(result.text);
                if (append) {
                    responseDiv.innerHTML += parsedMarkdown;
                } else {
                    responseDiv.innerHTML = parsedMarkdown;
                }
                hljs.highlightAll();  // Highlight code blocks if any
                animateAvatar();
            } else {
                responseDiv.innerText = 'No response from model or unexpected format.';
            }
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerText = `An error occurred: ${error.message}`;
        }
    }

    // Function to auto-save the conversation
    function autoSaveConversation() {
        const responseDiv = document.getElementById('response');
        const huggingfaceResponseDiv = document.getElementById('huggingface-response');
        const conversation = {
            response: responseDiv.innerHTML,
            huggingfaceResponse: huggingfaceResponseDiv.innerHTML
        };
        const timestamp = new Date().toISOString();
        localStorage.setItem(`conversation-${timestamp}`, JSON.stringify(conversation));
        updateSavedConversations();
    }

    // Function to update the sidebar with saved conversations
    function updateSavedConversations() {
        const savedConversations = document.getElementById('saved-conversations');
        savedConversations.innerHTML = '';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('conversation-')) {
                const card = document.createElement('div');
                card.className = 'conversation-card';
                card.textContent = key;
                card.onclick = () => loadConversation(key);
                savedConversations.appendChild(card);
            }
        }
    }

    // Function to load a saved conversation
    function loadConversation(key) {
        const responseDiv = document.getElementById('response');
        const huggingfaceResponseDiv = document.getElementById('huggingface-response');
        const conversation = localStorage.getItem(key);
        if (conversation) {
            const parsedConversation = JSON.parse(conversation);
            responseDiv.innerHTML = parsedConversation.response;
            huggingfaceResponseDiv.innerHTML = parsedConversation.huggingfaceResponse;
            alert('Conversation loaded!');
        } else {
            alert('No saved conversation found.');
        }
    }

    // Attach all functions to the global window object so they can be called from HTML
    window.generateText = generateText;
    window.continueText = continueText;
    window.trainAI = trainAI;
    window.talkWithAnotherAI = talkWithAnotherAI;
    window.autoSaveConversation = autoSaveConversation;
    window.updateSavedConversations = updateSavedConversations;
    window.loadConversation = loadConversation;

    // Run updateSavedConversations on page load to populate the sidebar
    updateSavedConversations();
});
