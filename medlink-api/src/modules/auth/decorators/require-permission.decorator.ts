import { SetMetadata } from "@nestjs/common";
import { Permission } from "../../../shared/enums/permission.enum";

export const REQUIRED_PERMISSIONS_KEY = "required_permissions";
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
