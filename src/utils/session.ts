import keytar from 'keytar';
import fs from 'fs';
import { Sha256 } from './crypto';
import { askHiddenInput } from './prompt';

const SERVICE_NAME = "qrotp-service";
const SERVICE_ACCOUNT = "master_account";
const SESSION_FILE_NAME = "./session.lock";
const SESSION_DURATION_MS = 10 * 60 * 1000;

export const getPassword = async () => {
  return await keytar.getPassword(SERVICE_NAME, SERVICE_ACCOUNT);
};

export const setSession = async (secret: string) => {
  const sha256 = new Sha256(secret);
  const session = {
    expireTime: Date.now() + SESSION_DURATION_MS,
  };
  fs.writeFileSync(SESSION_FILE_NAME, sha256.encrypt(JSON.stringify(session)));
};

export const initialSession = async () => {
  const sessionExist = fs.existsSync(SESSION_FILE_NAME);
  const sha256 = new Sha256((await getPassword())!);
  console.log("init session : ", Date.now());
  const newSession = {
    expireTime: Date.now(),
  };
  if (!sessionExist) {
    fs.writeFileSync(
      SESSION_FILE_NAME,
      sha256.encrypt(JSON.stringify(newSession))
    );
  }
};

export const getSession = async (secret: string) => {
  const sha256 = new Sha256(secret);
  return JSON.parse(
    sha256.decrypt(fs.readFileSync(SESSION_FILE_NAME, "utf-8"))
  );
};

export const validateUser = async (masterPassword: string) => {
  const password = (await askHiddenInput("enter password: ")).trim();
  if (password !== masterPassword) {
    console.error("password is invalid");
    process.exit(0);
  }
  await setSession(masterPassword);
};
