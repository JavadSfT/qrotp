import keytar from "keytar";
import ora from "ora";
import { askHiddenInput } from "./prompt";
import {
  SERVICE_ACCOUNT,
  SERVICE_NAME,
  SESSION_DURATION_MS,
  SESSION_FILE_NAME,
} from "./constant";
import { readEncryptedFile, writeEncryptedFile } from "./file";
import fs , { readdirSync } from "fs";
import os from 'os';

export const getMasterPassword = async () => {
  return await keytar.getPassword(SERVICE_NAME, SERVICE_ACCOUNT);
};

export const setSession = async (secret: string) => {
  const session = {
    expireTime: Date.now() + SESSION_DURATION_MS,
  };
  await writeEncryptedFile(SESSION_FILE_NAME, JSON.stringify(session), secret);
};

export const getSession = async (secret: string) => {
  return JSON.parse(await readEncryptedFile(SESSION_FILE_NAME, secret));
};

export const validateUser = async (masterPassword: string) => {
  const password = (await askHiddenInput("enter password: ")).trim();
  if (password !== masterPassword) {
    ora("password is invalid").fail();
    process.exit(0);
  }
  await setSession(masterPassword);
};

export const removeExpiredSession = async () => {
  const sessionPath = os.homedir() +  "/.config/qrotp/sessions/"
  const data = readdirSync(sessionPath);
  for (const p of data) {
    const file = JSON.parse(await readEncryptedFile(sessionPath + `/${p}`))
    console.log(file.expireTime , Date.now());
    if(file.expireTime < Date.now()){
      fs.rmSync(sessionPath + `/${p}`)
    }
  }
  console.log(data);
};
