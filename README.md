# 🚧 BETA VERSION — Still under development

# 🔐 qrotp

A secure command-line tool for managing, encrypting, extracting, and generating 2FA tokens with simplicity and full control.

![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E=18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![CLI Tool](https://img.shields.io/badge/CLI-Focused-informational) ![OTP Generator](https://img.shields.io/badge/2FA--TOTP-Generator-orange)
![Image Support](https://img.shields.io/badge/QR--Image-Enabled-lightgrey) ![AES-256-GCM](https://img.shields.io/badge/Secure-AES--256--GCM-green)
![Local Encryption](https://img.shields.io/badge/Local%20Storage-Encrypted-green)
![Session Lock](https://img.shields.io/badge/Session-Locked-critical) ![Cross-platform](https://img.shields.io/badge/Platform-Mac%7CLinux%7CWin-lightblue)
![License: MIT](https://img.shields.io/badge/License-ISC-yellow)


---

## ✨ Introduction

`qrotp` is a fast and secure CLI utility for managing two-factor authentication (2FA) tokens. It allows you to read QR codes, store them securely with strong encryption, and generate time-based OTPs easily — all via the terminal.

> No GUI. Full terminal control. One master password to unlock everything.

---

## ⚙️ Features

* 📷 Read QR codes from image or Base64  
* 🔐 Secure AES-256-GCM encryption with a master password  
* 🧾 Encrypted storage and management of OTP entries  
* 🔁 Live OTP generation with auto-refresh every second  
* 🧠 Extract raw `otpauth://` data from QR  
* 💀 Remove stored entries by index  
* 🖼 Convert images to Base64 for easy input  

---

## 🧱 Security Architecture

All data — including the list of OTPs — is encrypted using AES-256-GCM. The key is derived from a user-provided master password. Without the password, the data is useless.

* Random IV + Auth Tag  
* Final result stored as Base64  
* Decryption only possible via original password  
* Master password kept in memory (RAM) during session only  

---

## 📦 Installation

```bash
git clone https://github.com/your-username/qrotp.git
cd qrotp
npm install
npm run build
```

For global CLI access:

```bash
npm install -g qrotp@beta
```

---

## 🚀 Quick Start

```bash
qrotp -sp ./qrcode.png -n "GitHub"
qrotp -l
qrotp -r 0
```

---

## 🔤 Commands

| Flag | Long Name     | Description                          |
| ---- | ------------- | ---------------------------------- |
| -sp  | --save-pic    | Save QR from image file             |
| -sb  | --save-base64 | Save QR from base64 string          |
| -n   | --name        | Custom label for stored entry       |
| -l   | --list        | Display all stored OTP entries      |
| -r   | --read        | Generate OTP for an entry by index  |
| -w   | --watch       | Live-refresh OTP every second       |
| -d   | --delete      | Delete entry by index               |
| -v   | --value       | Raw value for otpauth/base64 parsing|
| -h   | --help        | Show help menu                     |

---

## 📸 Examples

**Save from image:**

```bash
qrotp --save-pic ./qrs/github.png --name "GitHub"
```

**Save from base64:**

```bash
qrotp --save-base64 "data:image/png;base64,iVBOR..." --name "Google"
```

**List entries:**

```bash
qrotp --list
```

**Generate OTP:**

```bash
qrotp --read 0
```

**Watch live OTP:**

```bash
qrotp --watch 0
```

**Delete an entry:**

```bash
qrotp --delete 0
```

---

## 📁 File Storage

All encrypted data is saved in a single persistent file:

```ts
src/utils/constant.ts → OTP_FILE_PATH
```

---

## 📦 Dependencies

* `jimp` - Image processing  
* `jsQR` - QR code reader  
* `otpauth` - OTP management  
* `ora` - Terminal loading spinner  
* `crypto` (native) - Node.js encryption  

---

## 👨‍💻 For Development

Run in development mode:

```bash
npm run dev
```

---

## 🛡 Security Notes

* Master password is never saved to disk  
* Password stored only in memory (RAM) per session  
* Each launch requires password input again  
* Encrypted file is useless without correct password  

---

## 🧠 Roadmap Ideas

* 🔒 Support multiple encrypted profiles  
* 📦 Bundle standalone binary via `pkg` or `nexe`  

---

## 🧼 License

ISC © 2025

---

### Made by [@JavadSfT](https://github.com/javadsft)