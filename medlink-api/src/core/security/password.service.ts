import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const derived = await scrypt(password, salt, KEY_LENGTH);
    return `scrypt$${salt}$${Buffer.from(derived as Buffer).toString("base64url")}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedHash.split("$");
    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, "base64url");
    const derived = await scrypt(password, salt, expected.length);
    const actual = Buffer.from(derived as Buffer);

    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(actual, expected);
  }
}
