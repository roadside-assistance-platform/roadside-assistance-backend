import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Path to the combined log file
const LOG_FILE_PATH = path.join(process.cwd(), 'logs/combined.log');

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Retrieve the last 200 log entries
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of the last 200 log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     description: Timestamp of the log entry
 *                   level:
 *                     type: string
 *                     description: Log level (e.g., info, error)
 *                   message:
 *                     type: string
 *                     description: Log message content
 *       500:
 *         description: Server error while reading logs
 */
// GET /admin/logs - Return recent log entries (public)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Attempting to read logs from: ${LOG_FILE_PATH}`);
    
    if (!fs.existsSync(LOG_FILE_PATH)) {
      console.error('Log file does not exist at:', LOG_FILE_PATH);
      res.json([]);
      return;
    }
    
    const logData = fs.readFileSync(LOG_FILE_PATH, "utf-8").trim();
    
    if (!logData) {
      console.log('Log file is empty');
      res.json([]);
      return;
    }
    
    // Split by newline and parse each line as JSON
    const lines = logData.split("\n");
    const entries: any[] = [];
    
    for (const line of lines) {
      try {
        if (line.trim()) {  // Skip empty lines
          entries.push(JSON.parse(line));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error parsing log line:', errorMessage);
        // Include malformed lines as raw text
        entries.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Failed to parse log line',
          raw: line,
          error: errorMessage
        });
      }
    }
    
    // Return the most recent entries first
    const last200Entries = entries.slice(-200).reverse();
    res.json(last200Entries);
    return;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    console.error('Error reading logs:', errorMessage);
    res.status(500).json({ 
      error: "Failed to read logs",
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    });
    return;
  }
});

export default router;
