const formatMessage = (level: string, message: string): string => {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
};

export const logger = {
  info: (message: string, ...details: unknown[]) => {
    console.log(formatMessage("INFO", message), ...details);
  },
  warn: (message: string, ...details: unknown[]) => {
    console.warn(formatMessage("WARN", message), ...details);
  },
  error: (message: string, ...details: unknown[]) => {
    console.error(formatMessage("ERROR", message), ...details);
  },
  debug: (message: string, ...details: unknown[]) => {
    if (process.env.DEBUG === "true") {
      console.debug(formatMessage("DEBUG", message), ...details);
    }
  },
} as const;
