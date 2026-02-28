export function captureConsole<T>(fn: () => T): {
  output: string;
  errorOutput: string;
  result: T;
} {
  const replay = parseBool(Bun.env.TEST_LOGGER_CONSOLE_TEST_OUTPUT);

  let logOut = "";
  let errorOut = "";
  const original = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log,
  };

  console.debug = (...args) => (logOut += args.join(" ") + "\n");
  console.info = (...args) => (logOut += args.join(" ") + "\n");
  console.warn = (...args) => (logOut += args.join(" ") + "\n");
  console.log = (...args) => (logOut += args.join(" ") + "\n");
  console.error = (...args) => (errorOut += args.join(" ") + "\n");

  let result: T;
  try {
    result = fn();
  } finally {
    Object.assign(console, original);
  }

  if (replay) {
    fn();
  }

  return { output: logOut.trim(), errorOutput: errorOut.trim(), result };
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "enabled" ||
    normalized === "on"
  );
}
