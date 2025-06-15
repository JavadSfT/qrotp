#! /usr/bin/env node
import keytar from "keytar";
import fs from "fs";
import { askHiddenInput, askUserInput } from "./utils/prompt";
import { parseArgs } from "./core/arg";
import {
  getPassword,
  getSession,
  initialSession,
  validateUser,
} from "./utils/session";
import {
  convertImageToBase64,
  deleteFromList,
  ensureJsonListExists,
  getOtpFromBase64Qr,
  getOtpFromImageFile,
  readFromIndex,
  saveToJsonList,
  showSavedList,
  watchToken,
} from "./core/otp";
import { SERVICE_ACCOUNT, SERVICE_NAME } from "./utils/constant";
import ora from "ora";

function showHelp() {
  console.log(`
Usage:
  -sb, --save-base64      Save a base64 QR string
  -sp, --save-pic         (Soon) Save from image file
  -r,  --read <index>     Read OTP from saved list
  -w,  --watch            Watch OTP from a given index
  -d,  --delete <index>   Delete entry from saved list
  -n,  --name <string>    Name for saved token
  -v,  --value <string>   Base64 value for saving
  -l,  --list             List all saved tokens

Examples:
  node otp-cli.js --save-base64 --name Gmail --value ABCDEF==
  node otp-cli.js --read 2
`);
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  const get = (k: string): string | undefined => {
    const val = options[k];
    return typeof val === "string" ? val : undefined;
  };

  const has = (...keys: string[]) => keys.some((k) => k in options);

  // await keytar.deletePassword(SERVICE_NAME, SERVICE_ACCOUNT)

  const getMasterPassword = await getPassword();

  if (has("-h", "--help")) {
    showHelp();
  }

  if (!getMasterPassword) {
    const mp = await askHiddenInput("Write master password: ");
    const cmp = await askHiddenInput("Write Confirm Password: ");
    if (mp === cmp) {
      await keytar.setPassword(SERVICE_NAME, SERVICE_ACCOUNT, mp);
      await initialSession();
    }
  }

  const gmp = (await getPassword())!;
  let session;
  try {
    session = await getSession(gmp);
    if (Number(session.expireTime) < Date.now()) {
      await validateUser(gmp);
    }
  } catch {
    ora("Session invalid or expired. Please login again.").info();
    await validateUser(gmp);
  }

  ensureJsonListExists();

  if (has("-sb", "--save-base64")) {
    const name = get("-n") ?? (await askUserInput("Enter name: "));
    const base64 = get("-v") ?? (await askUserInput("Enter base64: "));
    saveToJsonList(name, base64);
    return;
  }

  if (has("-sp", "--save-pic")) {
    const name = get("-n") ?? (await askUserInput("Enter name: "));
    const filePath =
      get("-v") ?? (await askUserInput("Enter image file path: "));

    if (!fs.existsSync(filePath)) {
      ora(` File does not exist: ${filePath}`).fail();
      process.exit(1);
    }

    const rawOtpAuth = await getOtpFromImageFile(filePath, true);
    if (!rawOtpAuth) {
      ora("Failed to extract QR data from image.").fail();
      process.exit(1);
    }

    const base64Image = await convertImageToBase64(filePath);
    saveToJsonList(name, base64Image);
    return;
  }

  if (has("-l", "--list")) {
    showSavedList();
    return;
  }

  if (has("-r", "--read") && has("-w", "--watch")) {
    const indexStr = get("-r") ?? get("--read");
    const index = indexStr ? parseInt(indexStr, 10) : NaN;
    if (isNaN(index) || index < 1) {
      ora("Invalid index. Must be a number >= 1.").fail();
      process.exit(1);
    }
    await watchToken(index - 1);
    return;
  }

  if (has("-r", "--read")) {
    const indexStr = get("-r") ?? get("--read");
    const index = indexStr ? parseInt(indexStr, 10) : NaN;
    if (isNaN(index) || index < 1) {
      ora("Invalid index. Must be a number >= 1.").fail();
      process.exit(1);
    }
    await readFromIndex(index - 1);
    return;
  }

  if (has("-d", "--delete")) {
    const indexStr = get("-d") ?? get("--delete");
    const index = indexStr ? parseInt(indexStr, 10) : NaN;
    if (isNaN(index) || index < 1) {
      ora("Invalid index. Must be a number >= 1.").fail();
      process.exit(1);
    }
    deleteFromList(index - 1);
    return;
  }

  if (Object.keys(options).length === 0) {
    ora("No valid option provided.").fail();
    showHelp();
    process.exit(1);
  }

  if (args.length === 1 && typeof args[0] === "string") {
    const token = await getOtpFromBase64Qr(args[0]);
    if (token) ora(`Generated OTP: ${token}`).succeed();
    else ora("Failed to generate OTP.").fail();
    return;
  }
}

main();
