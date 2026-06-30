import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { HospitalsService } from "../hospitals/hospitals.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  /** Public endpoint — used by the login page to populate the hospital dropdown */
  @Get("hospitals")
  getHospitals() {
    return this.hospitalsService.findAllActive();
  }

  @Post("login")
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login({
      hospitalId: dto.hospitalId,
      email: dto.email,
      password: dto.password,
      deviceFingerprint: dto.deviceFingerprint,
      ipAddress: request.ip,
      userAgent: request.header("user-agent"),
    });
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.sessionId, dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.sessionId);
  }
}
