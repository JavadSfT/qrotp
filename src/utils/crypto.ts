import crypto from "crypto";

export class Sha256 {
  private _algorithm = "aes-256-gcm";
  private _key: Buffer;

  constructor(secret: string) {
    this._key = crypto.createHash("sha256").update(secret).digest();
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this._algorithm, this._key, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, "base64");
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encrypted = data.subarray(28);

    const decipher = crypto.createDecipheriv(this._algorithm, this._key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }
}