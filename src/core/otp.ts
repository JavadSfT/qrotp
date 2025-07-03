import { Jimp } from "jimp";
import jsQR from "jsqr";
import * as OTPAuth from "otpauth";
import { existsSync } from "fs";
import ora from "ora";
import { OTP_FILE_PATH } from "../utils/constant";
import { readEncryptedFile, writeEncryptedFile } from "../utils/file";

interface QrScanResult {
  data: string;
}

export const ensureJsonListExists = async () => {
  if (!existsSync(OTP_FILE_PATH)) {
    await writeEncryptedFile(OTP_FILE_PATH, "[]");
  } else {
    try {
      JSON.parse(await readEncryptedFile(OTP_FILE_PATH));
    } catch (err) {
      ora("JSON file was corrupted, resetting...").warn();
      await writeEncryptedFile(OTP_FILE_PATH, "[]");
    }
  }
};

export const convertImageToBase64 = async (filePath: string) => {
  const image = await Jimp.read(filePath);
  return image.getBase64("image/png");
};

export const readJsonList = async (): Promise<
  { name: string; value: string; counter?: number }[]
> => {
  try {
    if (!existsSync(OTP_FILE_PATH)) return [];
    return JSON.parse(await readEncryptedFile(OTP_FILE_PATH));
  } catch (error) {
    ora(`Error reading JSON list: ${error}`).fail();
    process.exit(1);
  }
};

export const readFromIndex = async (index: number, counter?: number): Promise<void> => {
  const list = await readJsonList();
  if (index < 0 || index >= list.length) {
    ora("Invalid index.").fail();
    process.exit(1);
  }

  const item = list[index];
  ora(`Using "${item.name}"...`).info();

  const qrCodeData = await getOtpFromBase64Qr(item.value, true);

  if (!qrCodeData) {
    ora("Failed to parse QR.").fail();
    return;
  }

  const parsed = OTPAuth.URI.parse(qrCodeData);

  let token: string | null = null;

  if (parsed instanceof OTPAuth.TOTP) {
    token = parsed.generate();
  } else if (parsed instanceof OTPAuth.HOTP) {
    // Use provided counter if available, otherwise use stored counter
    const currentCounter = typeof counter === "number" ? counter : (item.counter ?? 0);
    parsed.counter = currentCounter;
    token = parsed.generate();

    // Only increment stored counter if not overridden by user
    if (typeof counter !== "number") {
      list[index].counter = currentCounter + 1;
      await writeEncryptedFile(OTP_FILE_PATH, JSON.stringify(list, null, 2));
      ora(`Counter incremented to ${currentCounter + 1}`).info();
    } else {
      ora(`Using manual counter: ${counter}`).info();
    }
  } else {
    ora("Unknown OTP type.").fail();
    return;
  }

  if (token) {
    ora(`Generated OTP: ${token}`).succeed();
  } else {
    ora("Failed to generate OTP.").fail();
    process.exit(1);
  }
};


export const showSavedList = async () => {
  const list = await readJsonList();
  if (list.length === 0) {
    ora("No saved entries.").fail();
    return;
  }
  
  console.log("Saved OTP tokens:");
  console.log("=================");
  
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    try {
      const qrCodeData = await getOtpFromBase64Qr(item.value, true);
      if (qrCodeData) {
        const parsed = OTPAuth.URI.parse(qrCodeData);
        if (parsed instanceof OTPAuth.TOTP) {
          console.log(`[${i + 1}] ${item.name} (TOTP)`);
        } else if (parsed instanceof OTPAuth.HOTP) {
          const counter = item.counter ?? 0;
          console.log(`[${i + 1}] ${item.name} (HOTP, counter: ${counter})`);
        } else {
          console.log(`[${i + 1}] ${item.name} (Unknown)`);
        }
      } else {
        console.log(`[${i + 1}] ${item.name} (Invalid)`);
      }
    } catch (error) {
      console.log(`[${i + 1}] ${item.name} (Error)`);
    }
  }
};

export const deleteFromList = async (index: number) => {
  const list = await readJsonList();
  if (index < 0 || index >= list.length) {
    ora("Invalid index.").fail();
    process.exit(1);
  }

  const removed = list.splice(index, 1)[0];
  await writeEncryptedFile(OTP_FILE_PATH, JSON.stringify(list, null, 2));
  ora(`Deleted entry: "${removed.name}"`).succeed();
};

export const saveToJsonList = async (name: string, base64String: string) => {
  try {
    let list: { name: string; value: string; counter?: number }[] = [];
    if (existsSync(OTP_FILE_PATH)) {
      list = JSON.parse(await readEncryptedFile(OTP_FILE_PATH));
    }
    list.push({ name, value: base64String, counter: 0 });
    await writeEncryptedFile(OTP_FILE_PATH, JSON.stringify(list, null, 2));
    ora(`Saved "${name}" to list.`).succeed();
  } catch (error) {
    ora(`Error saving to JSON list: ${error}`).fail();
    process.exit(1);
  }
};

export const getOtpFromBase64Qr = async (
  base64ImageString: string,
  returnRaw: boolean = false,
  counter?: number // برای HOTP
): Promise<string | null> => {
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

    const otp = OTPAuth.URI.parse(code.data);

    if (otp instanceof OTPAuth.TOTP) {
      return otp.generate();
    } else if (otp instanceof OTPAuth.HOTP) {
      if (typeof counter === "number") {
        otp.counter = counter;
        return otp.generate();
      } else {
        ora("HOTP requires counter.").fail();
        return null;
      }
    } else {
      ora("Unknown OTP type.").fail();
      return null;
    }
  } catch (error) {
    ora(`Error processing QR Code: ${error}`);
    return null;
  }
};


export const getOtpFromImageFile = async (
  filePath: string,
  returnRaw = false
): Promise<string | null> => {
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
};

export const watchToken = async (index: number): Promise<void> => {
  const list = await readJsonList();
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
  
  if (parsed instanceof OTPAuth.TOTP) {
    const totp = parsed;
    
    console.log(`🔁 Watching TOTP "${item.name}"...`);
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
      console.log(`🔁 [${item.name}] - TOTP`);
      console.log("---------------------");
      console.log("OTP:", lastToken);
      console.log(`⏳ Expires in: ${remaining}s`);
      console.log("---------------------");
    }, 1000);
  } else if (parsed instanceof OTPAuth.HOTP) {
    ora("HOTP tokens cannot be watched continuously. Use --read to generate tokens.").warn();
    return;
  } else {
    ora("Unknown OTP type for watching.").fail();
    return;
  }
};
