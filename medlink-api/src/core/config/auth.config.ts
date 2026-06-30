import { registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  jwtRefreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
}));
