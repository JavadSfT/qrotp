# 🚧 **BETA WARNING: This project is under active development. Use at your own risk. Data loss or breaking changes may occur.**

# 🔐 qrotp

> **A blazing-fast, secure CLI for managing, encrypting, and generating TOTP/HOTP 2FA tokens from QR codes.**  
> _No GUI. No cloud. 100% local, encrypted, and cross-platform._

[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E=18-blue)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![CLI Tool](https://img.shields.io/badge/CLI-Focused-informational)](https://github.com/javadsft/qrotp)
[![OTP Generator](https://img.shields.io/badge/2FA--TOTP%2FHOTP-Generator-orange)](https://github.com/javadsft/qrotp)
[![Image Support](https://img.shields.io/badge/QR--Image-Enabled-lightgrey)](https://github.com/javadsft/qrotp)
[![AES-256-GCM](https://img.shields.io/badge/Secure-AES--256--GCM-green)](https://github.com/javadsft/qrotp)
[![Local Encryption](https://img.shields.io/badge/Local%20Storage-Encrypted-green)](https://github.com/javadsft/qrotp)
[![Session Lock](https://img.shields.io/badge/Session-Locked-critical)](https://github.com/javadsft/qrotp)
[![Cross-platform](https://img.shields.io/badge/Platform-Mac%7CLinux%7CWin-lightblue)](https://github.com/javadsft/qrotp)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

---

## ✨ Why qrotp?

- **No cloud, no leaks:** All secrets are encrypted and stored locally.
- **TOTP & HOTP:** Supports both time-based and counter-based OTPs.
- **Image & Base64:** Add tokens from QR images or base64 strings.
- **Master password:** One password to unlock all your tokens.
- **Session lock:** Auto-locks after inactivity for extra safety.
- **Blazing fast:** Instant CLI access, no bloat, no waiting.
- **Cross-platform:** Works on Linux, macOS, and Windows.

---

## 🕒 Visual: TOTP vs HOTP

| TOTP (Time-based) | HOTP (Counter-based) |
|:-----------------:|:-------------------:|
| ![TOTP](https://github.com/JavadSfT/qrotp/blob/main/images/totp.png) | ![HOTP](https://github.com/JavadSfT/qrotp/blob/main/images/hotp.png) |

---

## 🚀 Quick Start

```bash
git clone https://github.com/javadsft/qrotp.git
cd qrotp
npm install
npm run build
```

For global CLI access:

```bash
npm install -g qrotp
```

---

## 🖥️ CLI Usage

```shell
qrotp [options]
qrotp <base64> [--counter N]
```

<details>
<summary><strong>Click to expand full command reference</strong></summary>

| Short | Long         | Description                                      |
|-------|--------------|--------------------------------------------------|
| -sb   | --save-base64| Save a base64 QR string to saved list            |
| -sp   | --save-pic   | Save QR from an image file (PNG/JPG)             |
| -n    | --name       | Name/label for the saved token                   |
| -v    | --value      | Base64 value or image path for saving            |
| -r    | --read       | Read and generate OTP from saved token           |
| -c    | --counter    | (HOTP only) Specify counter value for HOTP       |
| -w    | --watch      | Continuously watch OTP every 30s (TOTP only)     |
| -d    | --delete     | Delete entry by its index from saved list        |
| -l    | --list       | List all saved tokens with index, name, and type |
| -h    | --help       | Show this help message                           |
|       | --version, -v| Show version                                     |

</details>

### Positional

- `<base64>`: Direct base64 QR input for quick OTP generation  
  Example: `qrotp "ABCDEF=="`

---

## 📸 Examples

**Add a TOTP token from image:**
```sh
qrotp -sp images/totp.png -n sample-totp
```

**Add a HOTP token from image:**
```sh
qrotp -sp images/hotp.png -n sample-hotp
```

**List all entries:**
```sh
qrotp --list
```

**Generate TOTP (index 1):**
```sh
qrotp --read 1
```

**Generate HOTP (index 2, counter 7):**
```sh
qrotp --read 2 --counter 7
```

**Watch TOTP token (index 1):**
```sh
qrotp --read 1 --watch
```

**Delete an entry (index 2):**
```sh
qrotp --delete 2
```

**Generate OTP directly from a base64 QR:**
```sh
qrotp "ABCDEF=="
qrotp "ABCDEF==" --counter 7
```

---

## 🔒 Security Model

- **AES-256-GCM** encryption for all data.
- **Master password** is never saved to disk, only in RAM during session.
- **Session lock**: auto-locks after inactivity.
- **No cloud, no telemetry, no tracking.**
- **One file**: All secrets stored in a single encrypted file.

---

## 🧩 Dependencies

- [`jimp`](https://www.npmjs.com/package/jimp) - Image processing
- [`jsQR`](https://www.npmjs.com/package/jsqr) - QR code reader
- [`otpauth`](https://www.npmjs.com/package/otpauth) - OTP management
- [`ora`](https://www.npmjs.com/package/ora) - Terminal loading spinner
- [`keytar`](https://www.npmjs.com/package/keytar) - Secure credential storage

---

## 🛡️ FAQ

**Q: Is my master password ever saved?**  
A: Never. It is only kept in memory for the session.

**Q: Can I use this for both TOTP and HOTP?**  
A: Yes! It auto-detects the type from the QR.

**Q: Can I export or backup my tokens?**  
A: Not yet, but this is on the roadmap.

**Q: What if I forget my master password?**  
A: There is no recovery. Your data is cryptographically locked.

---

## 🧠 Roadmap

- 🔒 Multiple encrypted profiles
- 🌐 Import/export for backup/restore
- 📦 Bundle as a standalone binary (`pkg`, `nexe`)
- 🖥️ GUI companion (maybe!)

---

## 👨‍💻 Contributing

PRs, issues, and feature requests are welcome!  
Please open an issue or pull request on [GitHub](https://github.com/javadsft/qrotp).

---

## 🧼 License

ISC © 2025

---

### Made with ❤️ by [@JavadSfT](https://github.com/javadsft)

---

## 🆘 CLI Help

```
QROTP - Manage and generate TOTP/HOTP tokens from QR codes securely

USAGE
  qrotp [options]
  qrotp <base64> [--counter N]

OPTIONS
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

POSITIONAL
  <base64>                     (optional) Direct base64 QR input for quick OTP generation
                               Example: qrotp "ABCDEF=="

EXAMPLES
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

NOTES
  - You must set a master password on first run
  - Data is securely encrypted and stored locally
  - All indexes start from 1
  - For HOTP tokens, counter is auto-incremented unless specified with --counter
  - TOTP tokens refresh every 30 seconds; HOTP tokens require a counter
  - Use --list to see token types and counters
```