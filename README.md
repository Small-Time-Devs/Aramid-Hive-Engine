# AI Interaction - Log Cabin

This project is a web-based AI interaction platform that allows users to interact with an AI model. The platform supports generating text responses, training the AI model, and conducting AI-to-AI conversations. Additionally, it features a 3D avatar rendered using Three.js and an `.fbx` model.

## Features

- **Text Generation**: Generate text responses based on user prompts.
- **AI Training**: Train the AI model with user-provided prompts and predefined follow-up questions.
- **AI-to-AI Conversation**: Conduct conversations between two AI models.
- **3D Avatar**: Display a 3D avatar using a `.fbx` model.

## Prerequisites

- Node.js
- npm (Node Package Manager)
- Python (for fine-tuning the AI model)
- Blender (for creating and exporting 3D models)

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
    Create a `.env` file in the root directory and add your Hugging Face API key:
    ```env
    HUGGING_FACE_API_KEY=your-huggingface-api-key
    ```

4. **Prepare the 3D Model**:
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
  - `styles.css`: The CSS file for styling the application.
  - `Aramid.fbx`: The 3D model file for the avatar.
- `server.js`: The Node.js server file.
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
    - Check the server logs for error messages.

### Debugging Helpers

- **Grid Helper**: A grid to visualize the scene.
- **Axes Helper**: Axes to visualize the orientation of the scene.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.