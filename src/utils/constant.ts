import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import os from "os";

export const SERVICE_NAME = "qrotp-service";
export const SERVICE_ACCOUNT = "master_account";
export const SESSION_FILE_NAME = (() => {
  const p = join(os.homedir(), ".config", "qrotp/sessions");
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
  }
  return join(p, `./${process.ppid}.lock`);
})();
export const SESSION_DURATION_MS = 10 * 60 * 1000;
export const OTP_FILE_PATH = (() => {
  const p = join(os.homedir(), ".config", "qrotp/otp");
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
  }
  return join(p, "otp.sec");
})();