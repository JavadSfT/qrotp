🔐 otp-cli – Secure TOTP Manager for Developers
A simple, secure CLI tool to store, manage, and generate time-based one-time passwords (TOTP) from base64 QR strings or images. Built with Node.js and supports password-protected sessions.

✨ Features
🔒 Master password protected

🧠 Session management with expiration

📝 Interactive CLI with prompts

📦 Save OTP from:

Base64 QR strings

(Coming soon) Image files with QR

👁️ View & watch live OTP codes

🗑️ Delete saved tokens

🧾 Simple local JSON-based storage

🚀 Installation
bash
Copy
Edit
npm install -g otp-cli
Or run directly (Node.js >= 18 recommended):

bash
Copy
Edit
node otp-cli.js [options]
🧪 First-Time Setup
When you run otp-cli for the first time, you’ll be prompted to set a master password. This password will be used to:

Encrypt your session

Validate future actions

🧰 CLI Usage
bash
Copy
Edit
otp-cli [options]
📄 Options
Option	Description
-sb, --save-base64	Save a base64-encoded QR string
-sp, --save-pic	(Coming Soon) Save from image file
-n, --name	Name for the saved token
-v, --value	Value (e.g., base64 QR string or filepath)
-r, --read <index>	Read OTP from saved list by index
-w, --watch	Live watch mode for an OTP index
-d, --delete	Delete a token from saved list
-l, --list	Show list of saved tokens
-h, --help	Show help menu

💡 Examples
bash
Copy
Edit
# Save a base64 QR string
otp-cli -sb -n Gmail -v ABCDEF==

# Read OTP at index 2
otp-cli -r 2

# Watch OTP at index 1 (live update)
otp-cli -r 1 -w

# Delete token at index 3
otp-cli -d 3

# List all saved tokens
otp-cli -l

# Direct decode from base64 QR
otp-cli ABCDEF==
📂 Data Storage
Saved tokens are stored in:

bash
Copy
Edit
~/.otp-cli/list.json
⚠️ Note: Only base64 QR strings are stored, not raw secrets or plaintext. Everything is protected by session and master password.

🔧 Future Plans
✅ Image file QR extraction (-sp)

🌐 OTP sync with cloud vaults (optional)

📱 GUI wrapper (Electron-based)

🔁 Backup & restore support

👨‍💻 Developer Notes
This project is in active development. Feedback and contributions are welcome!

Built with 💻 Node.js, 🧪 TypeScript (soon), and ❤️ by [Your Name]

📜 License
MIT
