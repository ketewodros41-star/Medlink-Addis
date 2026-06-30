import { Injectable } from "@nestjs/common";
import { Permission } from "../../shared/enums/permission.enum";

@Injectable()
export class PermissionsService {
  listBuiltIn(): Permission[] {
    return Object.values(Permission);
  }
}
