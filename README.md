# Small Time Devs - AI

This project is a web-based AI interaction platform that allows users to interact with an AI model. The platform supports generating text responses, training the AI model, and conducting AI-to-AI conversations. Additionally, it features a 3D avatar rendered using Three.js.

## Features

- **Text Generation**: Generate text responses based on user prompts.
- **AI Training**: Train the AI model with user-provided prompts and predefined follow-up questions.
- **AI-to-AI Conversation**: Conduct conversations between two AI models.
- **Avatar**: Add your own Avatar to Public Folder and edit the image name in index.html.
- **3D Avatar**: Display a 3D avatar using a `.fbx` model. ( WIP)

## Prerequisites

- **Node.js** and **npm** (Node Package Manager)
- **Python** (for fine-tuning the AI model)
- **Blender** (for creating and exporting 3D models)
- **LM Studio**: A local model management software for running AI models. [Download and install LM Studio here.](https://lmstudio.ai/)

## Installation

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/MotoAcidic/AI-Chat.git
    cd AI-Chat
    ```

2. **Install Dependencies**:
    ```sh
    npm install
    ```

3. **Set Up Environment Variables**:
    Create a `.env` file in the root directory. Populate it with the following values:

    ```env
    HUGGING_FACE_API_KEY=your-huggingface-api-key
    LOCAL_MODEL_API_URL=http://localhost:8000/generate  # Adjust port if different in LM Studio
    ```

    - **HUGGING_FACE_API_KEY**: Your Hugging Face API key for connecting to Hugging Face services.
    - **LOCAL_MODEL_API_URL**: The local model endpoint URL from LM Studio for generating responses.

4. **Install and Configure LM Studio**:
    - Download and install LM Studio from [lmstudio.ai](https://lmstudio.ai/).
    - Import or set up your local model in LM Studio.
    - Start LM Studio and note the model’s API endpoint (e.g., `http://localhost:8000/generate`), which you will set as the `LOCAL_MODEL_API_URL` in `.env`.

5. **Prepare the 3D Model**:
    Ensure your `.fbx` model file (e.g., `Aramid.fbx`) is placed in the `public` directory.

## Usage

1. **Start the Server**:
    ```sh
    npm start
    ```

2. **Open the Application**:
    Open your web browser and navigate to `http://localhost:5000`.

3. **Interact with the AI**:
    - Enter a prompt in the text area and click "Generate" to get a response from the AI.
    - Click "Train" to train the AI model with the provided prompt and predefined follow-up questions.
    - Click "AI to AI Conversation" to start a conversation between two AI models.

## File Structure

- `public/`
  - `index.html`: The main HTML file for the application.
  - `app.js`: All functions for the front end site.
  - `styles.css`: The CSS file for styling the application.
  - `Aramid.png`: Flat png image for the avatar.
  - `Aramid.fbx`: The 3D model file for the avatar (WIP).
- `index.js`: The Node.js server file.
- `fine_tune.py`: The Python script for fine-tuning the AI model.
- `.env`: The environment variables file.

## Troubleshooting

### Common Issues

1. **3D Model Not Visible**:
    - Ensure the path to the `.fbx` file is correct.
    - Check the browser console for errors.
    - Verify that `fflate.min.js` is loaded before `FBXLoader.js`.

2. **API Errors**:
    - Ensure your Hugging Face API key is correct and has the necessary permissions.
    - Ensure LM Studio is running and the `LOCAL_MODEL_API_URL` matches the LM Studio API endpoint.
    - Check the server logs for error messages.

### Debugging Helpers

- **Grid Helper**: A grid to visualize the scene.
- **Axes Helper**: Axes to visualize the orientation of the scene.
  
### Links

- **LM Studio**: [https://lmstudio.ai](https://lmstudio.ai).
- **Small Time Devs Website**: [https://smalltimedevs.com](https://smalltimedevs.com).
- **Lucky Bet Bots**: [https://lucky-bet.io](https://lucky-bet.io).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
