import { Jimp } from "jimp";
import jsQR from "jsqr";
import * as OTPAuth from "otpauth";
import * as path from "path";
import fs from "fs";
import { Sha256 } from "../utils/crypto";
import { getPassword } from "../utils/session";

interface QrScanResult {
  data: string;
}

const SAVE_FILE = path.join(process.cwd(), "qr_base64.json");
const sha256 = new Sha256((await getPassword())!);

export function ensureJsonListExists() {
  if (!fs.existsSync(SAVE_FILE)) {
    fs.writeFileSync(SAVE_FILE, sha256.encrypt("[]"), "utf-8");
  } else {
    try {
      JSON.parse(sha256.decrypt(fs.readFileSync(SAVE_FILE, "utf-8")));
    } catch (err) {
      console.warn("⚠️ JSON file was corrupted, resetting...");
      fs.writeFileSync(SAVE_FILE, sha256.encrypt("[]"), "utf-8");
    }
  }
}

export async function convertImageToBase64(filePath: string) {
  const image = await Jimp.read(filePath);
  return image.getBase64("image/png");
}

export function readJsonList(): { name: string; value: string }[] {
  try {
    if (!fs.existsSync(SAVE_FILE)) return [];
    return JSON.parse(sha256.decrypt(fs.readFileSync(SAVE_FILE, "utf8")));
  } catch (error) {
    console.error("Error reading JSON list:", error);
    process.exit(1);
  }
}

export async function readFromIndex(index: number): Promise<void> {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    console.error("Invalid index.");
    process.exit(1);
  }

  const item = list[index];
  console.log(`Using "${item.name}"...`);
  const token = await getOtpFromBase64Qr(item.value);
  if (token) {
    console.log("Generated OTP:", token);
  } else {
    console.error("Failed to generate OTP.");
    process.exit(1);
  }
}

export function showSavedList(): void {
  const list = readJsonList();
  if (list.length === 0) {
    console.log("No saved entries.");
    return;
  }
  list.forEach((item, index) => {
    console.log(`[${index + 1}] ${item.name}`);
  });
}

export function deleteFromList(index: number): void {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    console.error("Invalid index.");
    process.exit(1);
  }

  const removed = list.splice(index, 1)[0];
  fs.writeFileSync(SAVE_FILE, sha256.encrypt(JSON.stringify(list, null, 2)));
  console.log(`Deleted entry: "${removed.name}"`);
}

export function saveToJsonList(name: string, base64String: string): void {
  try {
    let list: { name: string; value: string }[] = [];
    if (fs.existsSync(SAVE_FILE)) {
      list = JSON.parse(sha256.decrypt(fs.readFileSync(SAVE_FILE, "utf8")));
    }
    list.push({ name, value: base64String });
    fs.writeFileSync(SAVE_FILE, sha256.encrypt(JSON.stringify(list, null, 2)));
    console.log(`Saved "${name}" to list.`);
  } catch (error) {
    console.error("Error saving to JSON list:", error);
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

    const code: QrScanResult | null = jsQR(
      imageData,
      imageWidth,
      imageHeight,
      {
        inversionAttempts: "dontInvert",
      }
    );

    if (!code || !code.data) return null;
    if (!code.data.startsWith("otpauth://")) return null;

    if (returnRaw) return code.data;

    const totp = OTPAuth.URI.parse(code.data);
    return totp.generate();
  } catch (error) {
    console.error("Error processing QR Code:", error);
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
    const code = jsQR(
      imageData,
      image.bitmap.width,
      image.bitmap.height,
      {
        inversionAttempts: "dontInvert",
      }
    );

    if (!code || !code.data) return null;
    if (!code.data.startsWith("otpauth://")) return null;

    if (returnRaw) return code.data;

    const totp = OTPAuth.URI.parse(code.data);
    return totp.generate();
  } catch (err) {
    console.error("❌ Failed to read QR from image:", err);
    return null;
  }
}

export async function watchToken(index: number): Promise<void> {
  const list = readJsonList();
  if (index < 0 || index >= list.length) {
    console.error("Invalid index.");
    process.exit(1);
  }

  const item = list[index];
  const qrCodeData = await getOtpFromBase64Qr(item.value, true);

  if (!qrCodeData || typeof qrCodeData !== "string") {
    console.error("Failed to parse OTP URI.");
    return;
  }

  const parsed = OTPAuth.URI.parse(qrCodeData);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    console.error("Parsed OTP is not a TOTP type.");
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
