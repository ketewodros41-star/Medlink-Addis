import { Expose, Type } from "class-transformer";

class RoleResponseDto {
  @Expose()
  name!: string;
}

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  hospitalId!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  mfaEnabled!: boolean;

  @Expose()
  @Type(() => RoleResponseDto)
  roles!: RoleResponseDto[];
}
