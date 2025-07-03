#! /usr/bin/env node
import keytar from "keytar";
import { existsSync, readFileSync } from "fs";
import { askHiddenInput, askUserInput } from "./utils/prompt";
import { parseArgs } from "./core/arg";
import {
  getMasterPassword,
  getSession,
  removeExpiredSession,
  setSession,
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

const showHelp = () => {
  console.log(`\n\x1b[36mQROTP\x1b[0m - Manage and generate TOTP/HOTP tokens from QR codes securely\n\n\x1b[1mUSAGE\x1b[0m
  qrotp [options]
  qrotp <base64> [--counter N]

\x1b[1mOPTIONS\x1b[0m
  -sb, --save-base64           Save a base64 QR string to saved list
      --name, -n <string>      Name/label for the saved token
      --value, -v <string>     Base64 value for saving

  -sp, --save-pic              Save QR from an image file (PNG/JPG)
      --name, -n <string>      Name/label for the saved token
      --value, -v <string>     Path to image file (e.g. ./qr.png)

  -r, --read <index>           Read and generate OTP from saved token
      --counter, -c <number>   (HOTP only) Specify counter value for HOTP generation
  -w, --watch                  Continuously watch OTP every 30s (TOTP only)
      (must be used with --read)

  -d, --delete <index>         Delete entry by its index from saved list
  -l, --list                   List all saved tokens with index, name, and type
  -h, --help                   Show this help message
  --version, -v                Show version

\x1b[1mPOSITIONAL\x1b[0m
  <base64>                     (optional) Direct base64 QR input for quick OTP generation
                               Example: qrotp "ABCDEF=="

\x1b[1mEXAMPLES\x1b[0m
  # Save a TOTP or HOTP QR code from base64
  qrotp --save-base64 --name Gmail --value "ABCDEF=="

  # Save a QR code from an image file
  qrotp --save-pic --name WorkEmail --value ./qr.png

  # List all saved tokens
  qrotp --list

  # Generate OTP from saved entry (auto-detects TOTP/HOTP)
  qrotp --read 2

  # Generate HOTP with a specific counter
  qrotp --read 2 --counter 5

  # Watch TOTP token
  qrotp --read 2 --watch

  # Delete a token
  qrotp --delete 3

  # Generate OTP directly from a base64 QR
  qrotp "ABCDEF=="
  qrotp "ABCDEF==" --counter 7

\x1b[1mNOTES\x1b[0m
  - You must set a master password on first run
  - Data is securely encrypted and stored locally
  - All indexes start from 1
  - For HOTP tokens, counter is auto-incremented unless specified with --counter
  - TOTP tokens refresh every 30 seconds; HOTP tokens require a counter
  - Use --list to see token types and counters\n`);
  process.exit(0);
};

const showVersion = () => {
  console.log(`qrotp version: 0.3.0-beta`);
};

const main = async () => {
  await removeExpiredSession();
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  const get = (k: string): string | undefined => {
    const val = options[k];
    return typeof val === "string" ? val : undefined;
  };

  const has = (...keys: string[]) => keys.some((k) => k in options);

  // await keytar.deletePassword(SERVICE_NAME, SERVICE_ACCOUNT)

  if (has("-h", "--help")) {
    showHelp();
  }
  if (has("--version", "-v")) {
    showVersion();
    process.exit(0);
  }

  if (!(await getMasterPassword())) {
    const mp = await askHiddenInput("Write master password: ");
    const cmp = await askHiddenInput("Write Confirm Password: ");
    if (mp === cmp) {
      await keytar.setPassword(SERVICE_NAME, SERVICE_ACCOUNT, mp);
      await setSession(mp);
    }
  }

  const gmp = (await getMasterPassword())!;
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

    if (!existsSync(filePath)) {
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

    // Get counter if provided for HOTP
    const counterStr = get("-c") ?? get("--counter");
    const counter = counterStr ? parseInt(counterStr, 10) : undefined;

    if (counterStr && (isNaN(counter!) || counter! < 0)) {
      ora("Invalid counter. Must be a number >= 0.").fail();
      process.exit(1);
    }

    await readFromIndex(index - 1, counter);
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
    const counterStr = get("--counter");
    const counter = counterStr ? parseInt(counterStr, 10) : undefined;

    if (counterStr && (isNaN(counter!) || counter! < 0)) {
      ora("Invalid counter. Must be a number >= 0.").fail();
      process.exit(1);
    }

    const token = await getOtpFromBase64Qr(args[0], false, counter);
    if (token) ora(`Generated OTP: ${token}`).succeed();
    else ora("Failed to generate OTP.").fail();
    return;
  }
};

main();
