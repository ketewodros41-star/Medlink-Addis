import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import Redis from "ioredis";
import { randomBytes, randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { REDIS_CLIENT } from "../../core/redis/redis.constants";
import { PasswordService } from "../../core/security/password.service";
import { UsersService } from "../users/users.service";
import { UserSessionEntity } from "./entities/user-session.entity";
import { JwtPayload } from "./types/jwt-payload.type";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
    @InjectRepository(UserSessionEntity)
    private readonly sessions: Repository<UserSessionEntity>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async login(input: {
    hospitalId: string;
    email: string;
    password: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<TokenPair> {
    const user = await this.users.findByEmail(input.hospitalId, input.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordOk = await this.passwords.verify(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const session = await this.createSession({
      hospitalId: user.hospitalId,
      userId: user.id,
      deviceFingerprint: input.deviceFingerprint,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return this.issueTokens({
      userId: user.id,
      hospitalId: user.hospitalId,
      sessionId: session.id,
      deviceId: session.deviceId,
      roles: user.roles.map(role => role.name),
      permissions: user.roles.flatMap(role => role.permissions.map(permission => permission.name)),
    });
  }

  async refresh(sessionId: string, refreshToken: string): Promise<TokenPair> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session is invalid");
    }

    const redisKey = this.refreshTokenKey(sessionId);
    const stored = await this.redis.get(redisKey);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException("Refresh token is invalid");
    }

    const user = await this.users.findById(session.hospitalId, session.userId);
    if (!user) {
      throw new UnauthorizedException("User is invalid");
    }

    await this.redis.del(redisKey);
    return this.issueTokens({
      userId: user.id,
      hospitalId: user.hospitalId,
      sessionId: session.id,
      deviceId: session.deviceId,
      roles: user.roles.map(role => role.name),
      permissions: user.roles.flatMap(role => role.permissions.map(permission => permission.name)),
    });
  }

  async logout(sessionId: string): Promise<{ revoked: true }> {
    await this.sessions.update({ id: sessionId }, { revokedAt: new Date() });
    await this.redis.del(this.refreshTokenKey(sessionId));
    return { revoked: true };
  }

  private async createSession(input: {
    hospitalId: string;
    userId: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSessionEntity> {
    const refreshTtl = this.config.getOrThrow<number>("auth.jwtRefreshTtlSeconds");
    const session = this.sessions.create({
      hospitalId: input.hospitalId,
      userId: input.userId,
      deviceId: randomUUID(),
      deviceFingerprint: input.deviceFingerprint ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt: new Date(Date.now() + refreshTtl * 1000),
    });
    return this.sessions.save(session);
  }

  private async issueTokens(input: {
    userId: string;
    hospitalId: string;
    sessionId: string;
    deviceId: string;
    roles: string[];
    permissions: string[];
  }): Promise<TokenPair> {
    const accessTtl = this.config.getOrThrow<number>("auth.jwtAccessTtlSeconds");
    const refreshTtl = this.config.getOrThrow<number>("auth.jwtRefreshTtlSeconds");
    const payload: JwtPayload = {
      sub: input.userId,
      hospital_id: input.hospitalId,
      roles: [...new Set(input.roles)],
      permissions: [...new Set(input.permissions)],
      session_id: input.sessionId,
      device_id: input.deviceId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("auth.jwtAccessSecret"),
      expiresIn: accessTtl,
    });
    const refreshToken = randomBytes(48).toString("base64url");
    await this.redis.set(this.refreshTokenKey(input.sessionId), refreshToken, "EX", refreshTtl);

    return {
      accessToken,
      refreshToken,
      sessionId: input.sessionId,
      expiresIn: accessTtl,
    };
  }

  private refreshTokenKey(sessionId: string): string {
    return `auth:refresh:${sessionId}`;
  }
}
