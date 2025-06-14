export const argAliases: Record<string, string> = {
  "--read": "-r",
  "--delete": "-d",
  "--save-base64": "-sb",
  "--save-pic": "-sp",
  "--name": "-n",
  "--value": "-v",
  "--watch": "-w",
  "--list": "-l",
  "--help": "-h",
};

export const parseArgs = (args: string[]): Record<string, string | boolean> => {
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];

    if (argAliases[arg]) {
      arg = argAliases[arg];
    }

    const next = args[i + 1];
    if (next && !next.startsWith("-")) {
      options[arg] = next;
      i++;
    } else {
      options[arg] = true;
    }
  }

  return options;
};
