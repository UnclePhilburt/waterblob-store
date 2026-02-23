import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  if (process.env.OPENAI_API_KEY) {
    try {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      // OpenAI client initialized
    } catch (error) {
      // OpenAI not configured
    }
  }

  return openaiClient;
}
