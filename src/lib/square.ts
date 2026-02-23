import { Client, Environment } from 'square';

let squareClient: Client | null = null;
let squareEnvironmentName = 'not configured';

export function getSquareClient(): Client | null {
  if (squareClient) return squareClient;

  if (process.env.SQUARE_ACCESS_TOKEN) {
    const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
    squareEnvironmentName = isProduction ? 'PRODUCTION' : 'SANDBOX';
    squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: isProduction ? Environment.Production : Environment.Sandbox,
    });
    // Square client initialized
  }

  return squareClient;
}

export function getSquareEnvironment(): string {
  return squareEnvironmentName;
}
