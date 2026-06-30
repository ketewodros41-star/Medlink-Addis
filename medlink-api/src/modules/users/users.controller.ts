import { Controller, Get, Post, Body, NotFoundException, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRole } from "../auth/decorators/require-role.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { BuiltInRole } from "../../shared/enums/user-role.enum";
import { UserResponseDto } from "./dto/user-response.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  async me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    const found = await this.users.findById(user.hospital_id, user.sub);
    if (!found) {
      throw new NotFoundException("Authenticated user was not found");
    }
    return plainToInstance(UserResponseDto, found, { excludeExtraneousValues: true });
  }

  @Get()
  @RequireRole(BuiltInRole.HospitalAdmin, BuiltInRole.SuperAdmin)
  async list(@CurrentUser() user: JwtPayload): Promise<UserResponseDto[]> {
    const list = await this.users.findAll(user.hospital_id);
    return plainToInstance(UserResponseDto, list, { excludeExtraneousValues: true });
  }

  @Post()
  @RequireRole(BuiltInRole.HospitalAdmin, BuiltInRole.SuperAdmin)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const newUser = await this.users.create(
      user.hospital_id,
      dto.firstName,
      dto.lastName,
      dto.email,
      dto.password,
      dto.roles,
      user.sub,
    );
    return plainToInstance(UserResponseDto, newUser, { excludeExtraneousValues: true });
  }
}
