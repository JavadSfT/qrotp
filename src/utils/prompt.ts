import process from "process";
import { stdin as input, stdout as output } from "process";
import Readline from "readline";

export function askUserInput(question: string): Promise<string> {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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
    output.write(question);

    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    let inputStr = "";

    const onData = (char: string) => {
      if (char === "\r" || char === "\n") {
        input.setRawMode(false);
        input.pause();
        input.removeListener("data", onData);
        output.write("\n");
        resolve(inputStr);
      } else if (char === "\u0003") {
        // Ctrl+C
        input.setRawMode(false);
        input.pause();
        process.exit();
      } else if (char === "\u0008" || char === "\u007F") {
        // Backspace
        inputStr = inputStr.slice(0, -1);
      } else {
        inputStr += char;
      }
    };

    input.on("data", onData);
  });
}
