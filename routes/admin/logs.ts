import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Adjust this path to your actual log file location
const LOG_FILE_PATH = path.join(__dirname, "../../logs/combined.log");

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
    if (!fs.existsSync(LOG_FILE_PATH)) {
      res.json([]);
      return;
    }
    const logData = fs.readFileSync(LOG_FILE_PATH, "utf-8");
    // Assume each log entry is a JSON line
    const lines = logData.trim().split("\n");
    const entries = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Return the last 200 entries (most recent)
    const last200Entries = entries.slice(-200);
    res.json(last200Entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs" });
    return;
  }
});

export default router;
