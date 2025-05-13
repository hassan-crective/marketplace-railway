export {};
// adjust as you like
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      PORT: number;
      DATABASE_URL: string;
      JWT_ACCESS_SECRET: string;
      JWT_ACCESS_EXPIRY: string;
      JWT_REFRESH_SECRET: string;
      JWT_REFRESH_EXPIRY: string;
      DATABASE_HOST: string;
      DATABASE_PORT: number;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
      SENDER_EMAIL: string!;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_REGION: string;
      AWS_SES_ACCESS_KEY_ID: string;
      AWS_SES_SECRET_ACCESS_KEY: string;
      AWS_SES_DEFAULT_REGION: string;
      OPENAI_API_KEY: string;
      ENCRYPTION_KEY: string;
      WEBAPP_URL: string;
      TEMP_WEBAPP_URL: string;
      PROD_WEBAPP_URL: string;
      SENTRY_DSN: string;
      STRIPE_SECRET_KEY: string;
      CLOUDFRONT_DISTRIBUTION_DOMAIN: string;
      CLOUDFRONT_KEY_PAIR_ID: string;
      AWS_BUCKET: string;
      TESTING_URL: string;
    }
  }
}
