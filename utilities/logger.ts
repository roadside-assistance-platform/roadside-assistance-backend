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
    winston.format.timestamp(),
    winston.format.colorize({ all: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
      return `[${timestamp}] ${level}: ${message}${metaStr ? `\n${metaStr}` : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
});

export default logger;
