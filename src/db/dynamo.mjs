import { config } from '../config/config.mjs';
import { config as dotEnvConfig } from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import pkg from '@aws-sdk/lib-dynamodb';
const { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, marshall, unmarshall } = pkg;

// Load environment variables from .env file
dotEnvConfig();

// Import keys from environment variables
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// Ensure the AWS credentials are available
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('Error: AWS ACCESS_KEY and SECRET_KEY must be set in the environment variables.');
  process.exit(1);
}

// Configure AWS region and credentials
const client = new DynamoDBClient({
  // Ohio server
  region: 'us-east-1',
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

// Configure DynamoDB Document Client with marshall options
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true, // Add this line to remove undefined values
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Specific conversation storage functions
export async function storeGeneralConversation(messageData) {
    const params = {
        TableName: "AramidAI-Engine-General-Conversations",
        Item: messageData
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("Successfully stored general conversation in DynamoDB");
    } catch (error) {
        console.error("Error storing general conversation:", error);
        throw error;
    }
}

export async function storeAutoTraderConversation(messageData) {
    const params = {
        TableName: "AramidAI-Engine-AutoTrader-Conversations",
        Item: messageData
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("Successfully stored auto trader conversation in DynamoDB");
    } catch (error) {
        console.error("Error storing auto trader conversation:", error);
        throw error;
    }
}

export async function storeTradeAdviceConversation(messageData) {
    const params = {
        TableName: "AramidAI-Engine-TradeAdvice-Conversations",
        Item: messageData
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("Successfully stored trade advice conversation in DynamoDB");
    } catch (error) {
        console.error("Error storing trade advice conversation:", error);
        throw error;
    }
}

export async function storeTwitterConversation(messageData) {
    const params = {
        TableName: "AramidAI-Engine-Twitter-Conversations",
        Item: messageData
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("Successfully stored twitter conversation in DynamoDB");
    } catch (error) {
        console.error("Error storing twitter conversation:", error);
        throw error;
    }
}

export async function getMessageById(messageId) {
    const params = {
        TableName: "AramidAI-Engine-General-Conversations",
        Key: {
            message_id: messageId
        }
    };

    try {
        const response = await docClient.send(new GetCommand(params));
        return response.Item;
    } catch (error) {
        console.error("Error retrieving message from DynamoDB:", error);
        throw error;
    }
}

export async function getThreadMessages(threadId) {
    const params = {
        TableName: "AramidAI-Engine-General-Conversations",
        FilterExpression: "thread_id = :threadId",
        ExpressionAttributeValues: {
            ":threadId": threadId
        }
    };

    try {
        const response = await docClient.send(new ScanCommand(params));
        return response.Items;
    } catch (error) {
        console.error("Error retrieving thread messages from DynamoDB:", error);
        throw error;
    }
}

export async function getAssistantThread(assistantName) {
    const params = {
        TableName: "AramidAI-Engine-Assistant-Threads",
        FilterExpression: "assistant_name = :name",
        ExpressionAttributeValues: {
            ":name": assistantName
        }
    };

    try {
        const response = await docClient.send(new ScanCommand(params));
        if (response.Items && response.Items.length > 0) {
            return response.Items[0].thread_id;
        }
        return null;
    } catch (error) {
        console.error("Error retrieving assistant thread:", error);
        throw error;
    }
}

export async function storeAssistantThread(assistantName, threadId) {
    const params = {
        TableName: "AramidAI-Engine-Assistant-Threads",
        Item: {
            thread_id: threadId,
            assistant_name: assistantName,
            created_at: new Date().toISOString()
        }
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log(`Successfully stored thread ID for ${assistantName}`);
    } catch (error) {
        console.error("Error storing assistant thread:", error);
        throw error;
    }
}
