let brevoClient: any = null;

export function getBrevoClient(): any {
  if (brevoClient) return brevoClient;

  if (process.env.BREVO_API_KEY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const brevo = require('@getbrevo/brevo');
      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );
      brevoClient = apiInstance;
      // Brevo email client initialized
    } catch (error) {
      // Brevo not configured
    }
  }

  return brevoClient;
}
