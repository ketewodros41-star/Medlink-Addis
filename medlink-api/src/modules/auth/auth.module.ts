import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { HospitalsModule } from "../hospitals/hospitals.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserSessionEntity } from "./entities/user-session.entity";
import { PermissionsGuard } from "./guards/permissions.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserSessionEntity]),
    UsersModule,
    HospitalsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsGuard, RolesGuard],
  exports: [AuthService, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
