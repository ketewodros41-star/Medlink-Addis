import { registerAs } from "@nestjs/config";

const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASEDB ?? process.env.databasedb;

export const databaseConfig = registerAs("database", () => ({
  url: databaseUrl,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSL === "true",
}));
