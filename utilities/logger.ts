import winston from "winston";

// Define custom log levels and colors
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    fatal: "red",
    error: "yellow",
    warn: "magenta",
    info: "blue",
    debug: "green",
  },
};

// Apply custom colors to Winston
winston.addColors(customLevels.colors);

const logger = winston.createLogger({
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.colorize({ all: true }), // Apply colors to all parts
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
