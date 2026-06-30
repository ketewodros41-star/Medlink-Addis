import { Controller, Get, UseGuards } from "@nestjs/common";
import { BuiltInRole } from "../../shared/enums/user-role.enum";
import { RequireRole } from "../auth/decorators/require-role.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionsService } from "./permissions.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @RequireRole(BuiltInRole.SuperAdmin, BuiltInRole.HospitalAdmin)
  list(): string[] {
    return this.permissions.listBuiltIn();
  }
}
