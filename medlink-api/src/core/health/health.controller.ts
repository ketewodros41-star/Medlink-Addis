import { Controller, Get, Inject } from "@nestjs/common";
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get("live")
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.database.pingCheck("postgres"),
      async () => {
        await this.redis.connect().catch(() => undefined);
        const response = await this.redis.ping();
        return { redis: { status: response === "PONG" ? "up" : "down" } };
      },
    ]);
  }
}
