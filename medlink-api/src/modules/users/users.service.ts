import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { RoleEntity } from "./entities/role.entity";
import { PasswordService } from "../../core/security/password.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    private readonly passwords: PasswordService,
  ) {}

  async findByEmail(hospitalId: string, email: string): Promise<UserEntity | null> {
    return this.users.findOne({
      where: { hospitalId, email: email.toLowerCase(), isActive: true },
    });
  }

  async findById(hospitalId: string, id: string): Promise<UserEntity | null> {
    return this.users.findOne({
      where: { hospitalId, id, isActive: true },
    });
  }

  async findAll(hospitalId: string): Promise<UserEntity[]> {
    return this.users.find({
      where: { hospitalId },
      relations: ["roles"],
      order: { createdAt: "DESC" },
    });
  }

  async create(
    hospitalId: string,
    firstName: string,
    lastName: string,
    email: string,
    passwordPlain: string,
    roleNames: string[],
    actorId: string,
  ): Promise<UserEntity> {
    // Check if user already exists
    const existing = await this.findByEmail(hospitalId, email);
    if (existing) {
      throw new Error("User with this email already exists in this hospital");
    }

    // Resolve or create role entities for the hospital
    const roleEntities: RoleEntity[] = [];
    for (const name of roleNames) {
      let role = await this.roles.findOne({ where: { hospitalId, name } });
      if (!role) {
        role = this.roles.create({
          hospitalId,
          name,
          description: `${name.replace("_", " ")} Role`,
          isSystemRole: true,
          createdBy: actorId,
          updatedBy: actorId,
        });
        await this.roles.save(role);
      }
      roleEntities.push(role);
    }

    // Hash password
    const passwordHash = await this.passwords.hash(passwordPlain);

    // Create user
    const user = this.users.create({
      hospitalId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      roles: roleEntities,
      isActive: true,
      createdBy: actorId,
      updatedBy: actorId,
    });

    return this.users.save(user);
  }
}
