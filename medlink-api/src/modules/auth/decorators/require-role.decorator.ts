import { SetMetadata } from "@nestjs/common";
import { BuiltInRole } from "../../../shared/enums/user-role.enum";

export const REQUIRED_ROLES_KEY = "required_roles";
export const RequireRole = (...roles: BuiltInRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
