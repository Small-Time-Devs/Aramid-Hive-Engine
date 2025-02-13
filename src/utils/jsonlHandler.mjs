import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function appendToJSONL(filename, data) {
    const fullPath = path.join(__dirname, '../../logs', filename);
    
    // Ensure the logs directory exists
    const logsDir = path.dirname(fullPath);
    await fs.mkdir(logsDir, { recursive: true });
    
    // Convert the data to a JSON string and append with newline
    const jsonString = JSON.stringify(data) + '\n';
    await fs.appendFile(fullPath, jsonString, 'utf8');
}
