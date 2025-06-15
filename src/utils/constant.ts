import appRootPath from "app-root-path";
import { join } from "path";
import fs from 'fs';

export const SERVICE_NAME = "qrotp-service";
export const SERVICE_ACCOUNT = "master_account";
export const SESSION_FILE_NAME = (() => {
  const p = join(appRootPath.path, "sessions");
  if(!fs.existsSync(p)){
    fs.mkdirSync(p)
  }
  return join(p , "./session.lock")
})();
export const SESSION_DURATION_MS = 10 * 60 * 1000;
export const OTP_FILE_PATH = (() => {
  const p = join(appRootPath.path, "otp");
  if(!fs.existsSync(p)){
    fs.mkdirSync(p)
  }
  return join(p , "qr_base64.json")
})();