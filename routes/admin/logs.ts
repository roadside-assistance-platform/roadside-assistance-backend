import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { requireAdmin } from "../../utils/requireAdmin";

const router = express.Router();

// Adjust this path to your actual log file location
const LOG_FILE_PATH = path.join(__dirname, "../../logs/combined.log");

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Retrieve recent log entries
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of recent log entries (last 200)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                   level:
 *                     type: string
 *                   message:
 *                     type: string
 *       500:
 *         description: Failed to read logs
 */
// GET /admin/logs - Return recent log entries
router.get("/", requireAdmin, async (req: any, res: any) => {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return res.json([]);
    }
    const logData = fs.readFileSync(LOG_FILE_PATH, "utf-8");
    // Assume each log entry is a JSON line
    const lines = logData.trim().split("\n");
    const entries = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { timestamp: new Date().toISOString(), level: "raw", message: line };
      }
    });
    // Return the last 200 entries (most recent last)
    res.json(entries.slice(-200));
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs" });
  }
});

export default router;
