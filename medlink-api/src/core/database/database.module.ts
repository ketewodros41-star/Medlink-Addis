import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogLevel } from "typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("database.url");
        const ssl = config.get<boolean>("database.ssl") ? { rejectUnauthorized: false } : false;
        const logging: LogLevel[] = config.get<string>("app.nodeEnv") === "development" ? ["error", "warn"] : ["error"];
        const shared = {
          type: "postgres" as const,
          ssl,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          logging,
        };

        if (url) {
          return { ...shared, url };
        }

        return {
          ...shared,
          host: config.getOrThrow<string>("database.host"),
          port: config.getOrThrow<number>("database.port"),
          username: config.getOrThrow<string>("database.username"),
          password: config.getOrThrow<string>("database.password"),
          database: config.getOrThrow<string>("database.database"),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
