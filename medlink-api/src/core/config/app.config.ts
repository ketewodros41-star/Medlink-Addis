import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8000),
  apiPrefix: process.env.API_PREFIX ?? "api",
  apiVersion: process.env.API_VERSION ?? "v1",
  corsOrigins: process.env.CORS_ORIGINS ?? "http://127.0.0.1:3000,http://localhost:3000",
}));
