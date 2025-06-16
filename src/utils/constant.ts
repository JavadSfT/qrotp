import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import appRootPath from "app-root-path";

export const SERVICE_NAME = "qrotp-service";
export const SERVICE_ACCOUNT = "master_account";
export const SESSION_FILE_NAME = (() => {
  const p = join(appRootPath.path, "sessions");
  if (!existsSync(p)) {
    mkdirSync(p);
  }
  return join(p, "./session.lock");
})();
export const SESSION_DURATION_MS = 10 * 60 * 1000;
export const OTP_FILE_PATH = (() => {
  const p = join(appRootPath.path, "otp");
  if (!existsSync(p)) {
    mkdirSync(p);
  }
  return join(p, "otp.sec");
})();
