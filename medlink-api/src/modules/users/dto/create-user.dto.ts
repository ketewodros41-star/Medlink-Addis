import { IsEmail, IsString, IsArray, IsEnum, MinLength, IsNotEmpty } from "class-validator";
import { BuiltInRole } from "../../../shared/enums/user-role.enum";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password!: string;

  @IsArray()
  @IsEnum(BuiltInRole, { each: true, message: "Roles must be valid built-in roles" })
  roles!: BuiltInRole[];
}
