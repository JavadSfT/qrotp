import { stdin , stdout } from "process";
import Readline from "readline";

export function askUserInput(question: string): Promise<string> {
  const rl = Readline.createInterface({
    input: stdin,
    output: stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function askHiddenInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let inputStr = "";

    const onData = (char: string) => {
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(inputStr);
      } else if (char === "\u0003") {
        // Ctrl+C
        stdin.setRawMode(false);
        stdin.pause();
        process.exit(0);
      } else if (char === "\u0008" || char === "\u007F") {
        // Backspace
        inputStr = inputStr.slice(0, -1);
      } else {
        inputStr += char;
      }
    };

    stdin.on("data", onData);
  });
}
