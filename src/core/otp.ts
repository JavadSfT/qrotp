import { Jimp } from "jimp";
import jsQR from "jsqr";
import * as OTPAuth from "otpauth";
import fs from "fs";
import { Sha256 } from "../utils/crypto";
import { getPassword } from "../utils/session";
import { OTP_FILE_PATH } from "../utils/constant";
import ora from "ora";

interface QrScanResult {
  data: string;
}

const sha256 = new Sha256((await getPassword())!);

export function ensureJsonListExists() {
  if (!fs.existsSync(OTP_FILE_PATH)) {
    fs.writeFileSync(OTP_FILE_PATH, sha256.encrypt("[]"), "utf-8");
  } else {
    try {
      JSON.parse(sha256.decrypt(fs.readFileSync(OTP_FILE_PATH, "utf-8")));
    } catch (err) {
      ora("JSON file was corrupted, resetting...").warn();
      fs.writeFileSync(OTP_FILE_PATH, sha256.encrypt("[]"), "utf-8");
    }
  }
}

export async function convertImageToBase64(filePath: string) {
  const image = await Jimp.read(filePath);
  return image.getBase64("image/png");
}

export function readJsonList(): { name: string; value: string }[] {
  try {
    if (!fs.existsSync(OTP_FILE_PATH)) return [];
    return JSON.parse(sha256.decrypt(fs.readFileSync(OTP_FILE_PATH, "utf8")));
  } catch (error) {
    ora(`Error reading JSON list: ${error}`).fail();
    process.exit(1);
  }
}

export async function readFromIndex(index: number): Promise<void> {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    ora("Invalid index.").fail();
    process.exit(1);
  }

  const item = list[index];
  ora(`Using "${item.name}"...`).info();
  const token = await getOtpFromBase64Qr(item.value);
  if (token) {
    ora(`Generated OTP: ${token}`).succeed();
  } else {
    ora("Failed to generate OTP.").fail();
    process.exit(1);
  }
}

export function showSavedList(): void {
  const list = readJsonList();
  if (list.length === 0) {
    ora("No saved entries.").fail();
    return;
  }
  list.forEach((item, index) => {
    console.log(`[${index + 1}] ${item.name}`);
  });
}

export function deleteFromList(index: number): void {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    ora("Invalid index.").fail();
    process.exit(1);
  }

  const removed = list.splice(index, 1)[0];
  fs.writeFileSync(
    OTP_FILE_PATH,
    sha256.encrypt(JSON.stringify(list, null, 2))
  );
  ora(`Deleted entry: "${removed.name}"`).succeed();
}

export function saveToJsonList(name: string, base64String: string): void {
  try {
    let list: { name: string; value: string }[] = [];
    if (fs.existsSync(OTP_FILE_PATH)) {
      list = JSON.parse(sha256.decrypt(fs.readFileSync(OTP_FILE_PATH, "utf8")));
    }
    list.push({ name, value: base64String });
    fs.writeFileSync(
      OTP_FILE_PATH,
      sha256.encrypt(JSON.stringify(list, null, 2))
    );
    ora(`Saved "${name}" to list.`).succeed();
  } catch (error) {
    ora(`Error saving to JSON list: ${error}`).fail();
    process.exit(1);
  }
}

export async function getOtpFromBase64Qr(
  base64ImageString: string,
  returnRaw: boolean = false
): Promise<string | null> {
  try {
    if (!base64ImageString) process.exit(1);
    const base64Data = base64ImageString.replace(
      /^data:image\/\w+;base64,/,
      ""
    );
    const imageBuffer = Buffer.from(base64Data, "base64");
    const image = await Jimp.read(imageBuffer);
    const imageData = new Uint8ClampedArray(image.bitmap.data.buffer);
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;

    const code: QrScanResult | null = jsQR(imageData, imageWidth, imageHeight, {
      inversionAttempts: "dontInvert",
    });

    if (!code || !code.data) return null;
    if (!code.data.startsWith("otpauth://")) return null;

    if (returnRaw) return code.data;

    const totp = OTPAuth.URI.parse(code.data);
    return totp.generate();
  } catch (error) {
    ora(`Error processing QR Code: ${error}`);
    return null;
  }
}

export async function getOtpFromImageFile(
  filePath: string,
  returnRaw = false
): Promise<string | null> {
  try {
    const image = await Jimp.read(filePath);
    const imageData = new Uint8ClampedArray(image.bitmap.data.buffer);
    const code = jsQR(imageData, image.bitmap.width, image.bitmap.height, {
      inversionAttempts: "dontInvert",
    });

    if (!code || !code.data) return null;
    if (!code.data.startsWith("otpauth://")) return null;

    if (returnRaw) return code.data;

    const totp = OTPAuth.URI.parse(code.data);
    return totp.generate();
  } catch (err) {
    ora(`Failed to read QR from image: ${err}`).fail();
    return null;
  }
}

export async function watchToken(index: number): Promise<void> {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    ora("Invalid index.").fail();
    process.exit(1);
  }

  const item = list[index];
  const qrCodeData = await getOtpFromBase64Qr(item.value, true);

  if (!qrCodeData || typeof qrCodeData !== "string") {
    ora("Failed to parse OTP URI.").fail();
    return;
  }

  const parsed = OTPAuth.URI.parse(qrCodeData);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    ora("Parsed OTP is not a TOTP type.").fail();
    return;
  }

  const totp = parsed;

  console.log(`🔁 Watching "${item.name}"...`);
  let lastToken = "";
  setInterval(() => {
    const now = new Date();
    const token = totp.generate();
    const remaining =
      totp.period - (Math.floor(now.getTime() / 1000) % totp.period);

    if (token !== lastToken) {
      lastToken = token;
    }

    console.clear();
    console.log(`🔁 [${item.name}]`);
    console.log("---------------------");
    console.log("OTP:", lastToken);
    console.log(`⏳ Expires in: ${remaining}s`);
    console.log("---------------------");
  }, 1000);
}
