import * as dotenv from 'dotenv';
dotenv.config();
import "reflect-metadata";
import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/core/database/migrations/*.ts"],
  synchronize: false,
});
