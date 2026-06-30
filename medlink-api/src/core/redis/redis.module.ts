import { Global, Module, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

class InMemoryRedis {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();
  private readonly logger = new Logger("InMemoryRedis");

  constructor() {
    this.logger.warn("Using in-memory Redis fallback because local Redis server is unreachable");
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, option?: string, ttlSeconds?: number): Promise<string> {
    let expiresAt: number | undefined;
    if (option === "EX" && ttlSeconds) {
      expiresAt = Date.now() + ttlSeconds * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger("RedisModule");
        const client = new Redis({
          host: config.getOrThrow<string>("redis.host"),
          port: config.getOrThrow<number>("redis.port"),
          password: config.get<string>("redis.password"),
          lazyConnect: true,
          maxRetriesPerRequest: 1, // Fail fast so we can fall back quickly
        });

        // Use a Proxy to transparently fall back to InMemoryRedis if a command fails
        const fallback = new InMemoryRedis();
        let useFallback = false;

        client.on("error", (err) => {
          if (!useFallback) {
            logger.warn(`Redis connection failed: ${err.message}. Falling back to in-memory store.`);
            useFallback = true;
          }
        });

        return new Proxy(client, {
          get(target, propKey, receiver) {
            if (useFallback || propKey === "status") {
              const fallbackVal = Reflect.get(fallback, propKey);
              if (typeof fallbackVal === "function") {
                return fallbackVal.bind(fallback);
              }
              return fallbackVal;
            }

            const origMethod = Reflect.get(target, propKey, receiver);
            if (typeof origMethod === "function") {
              return async function (...args: any[]) {
                try {
                  return await origMethod.apply(target, args);
                } catch (err: any) {
                  logger.error(`Redis command failed: ${err.message}. Switching to in-memory fallback.`);
                  useFallback = true;
                  const fallbackMethod = Reflect.get(fallback, propKey);
                  if (typeof fallbackMethod === "function") {
                    return fallbackMethod.apply(fallback, args);
                  }
                  return undefined;
                }
              };
            }
            return origMethod;
          },
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
