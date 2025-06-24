import { readFileSync, writeFileSync, } from "fs";
import ora from "ora";
import { Sha256 } from "../utils/crypto";
import { getMasterPassword } from "../utils/session";

export const readEncryptedFile = async (path: string, secretKey?: string) => {
  const password = await getMasterPassword();
  if (!secretKey && !password) {
    ora("you don't have a valid password").fail();
    process.exit(1);
  } else {
    const sha256 = new Sha256(secretKey || password!);
    return sha256.decrypt(readFileSync(path, { encoding: "utf-8" }));
  }
};

export const writeEncryptedFile = async (
  path: string,
  data: string,
  secretKey?: string
) => {
  const password = await getMasterPassword();
  if (!secretKey && !password) {
    ora("you don't have a valid password").fail();
    process.exit(1);
  } else {
    const sha256 = new Sha256(secretKey || password!);
    return writeFileSync(path, sha256.encrypt(data), { encoding: "utf-8" });
  }
};
