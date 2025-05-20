import { Router } from "express";
import login from "./login";
import logout from "./logout";
import logs from "./logs";
import providers from "./providers";
import ratings from "./ratings";
import verifySession from "./verify-session";
import dashboard from "./dashboard";

const router = Router();

// Public routes
router.use("/login", login);
router.use("/logout", logout);

// Protected routes (require authentication)
router.use("/dashboard", dashboard);
router.use("/logs", logs);
router.use("/providers", providers);
router.use("/ratings", ratings);
router.use("/verify-session", verifySession);

export default router;
